"use server";

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

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
    cookieStore.set("auth_token", token, { httpOnly: true, secure: true, sameSite: "strict", path: "/" });

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
    const verifyLink = `http://localhost:3000/api/auth/verify?token=${verifyToken}`;

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

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "hatakesecret", { expiresIn: "7d" });
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, { httpOnly: true, secure: true, sameSite: "strict", path: "/" });

    return { success: true };
  } catch (error) {
    console.error("Registration error:", error);
    return { success: false, error: "Failed to register" };
  }
}
