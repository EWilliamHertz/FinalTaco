"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function getAllUsers() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.email !== "swagyser9@gmail.com")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return { success: true, users };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to fetch users" };
  }
}

export async function updateUserRole(userId: string, newRole: "ADMIN" | "USER") {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && user.email !== "swagyser9@gmail.com")) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: "Failed to update role" };
  }
}
