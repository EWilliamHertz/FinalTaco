"use server";

import bcrypt from "bcryptjs";
import { Resend } from "resend";
import jwt from "jsonwebtoken";
import { cookies, headers } from "next/headers";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

// Lazily create the Resend client so a missing API key doesn't crash the
// whole module (which would 500 every auth server action on Vercel).
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("RESEND_API_KEY is not set — verification emails are disabled");
    return null;
  }
  return new Resend(key);
}

export async function checkEmail(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    return { exists: !!user, success: true };
  } catch (error) {
    console.error("Error checking email:", error);
    return { exists: false, success: false, error: "Database error" };
  }
}

export async function loginUser(email: string, pass: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { success: false, error: "User not found" };

    if (!user.password) return { success: false, error: "No password set for this account" };

    const isValid = await bcrypt.compare(pass, user.password);
    if (!isValid) return { success: false, error: "Invalid password" };

    // Uncomment when you want to enforce email verification
    // if (!user.verified) return { success: false, error: "Please verify your email first" };

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "hatakesecret", { expiresIn: "7d" });
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });

    return { success: true };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: "Something went wrong" };
  }
}

export async function registerUser(email: string, username: string, pass: string) {
  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { success: false, error: "Email already registered" };

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) return { success: false, error: "Username taken" };

    const hashedPassword = await bcrypt.hash(pass, 10);
    const vToken = randomUUID();

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        verificationToken: vToken,
        verified: false,
      },
    });

    const verifyToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "hatakesecret", { expiresIn: "24h" });

    // Build the verify link from the request host so it works on localhost
    // and on the deployed domain alike.
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
    const proto = headerStore.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const verifyLink = `${proto}://${host}/api/auth/verify?token=${verifyToken}`;

    const resend = getResend();
    if (resend) {
      await resend.emails.send({
        from: "Hatake Social <onboarding@resend.dev>",
        to: email,
        subject: "Verify Your Hatake.Social Vault",
        html: `
        <div style="background-color: #050505; color: #ffffff; padding: 40px; font-family: sans-serif; text-align: center;">
          <h1 style="font-family: serif; letter-spacing: 2px;">Welcome to Hatake.Social</h1>
          <p style="color: #a3a3a3; font-size: 14px; margin-bottom: 30px;">Your ultimate TCG vault awaits.</p>
          <a href="${verifyLink}" style="background-color: #ffffff; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Verify Vault</a>
        </div>
      `,
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "hatakesecret", { expiresIn: "7d" });
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7 * 24 * 60 * 60 });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to register" };
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "hatakesecret") as { userId: string };
    if (!decoded.userId) return null;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, username: true, avatarUrl: true, email: true, role: true }
    });
    return user;
  } catch (err) {
    return null;
  }
}
