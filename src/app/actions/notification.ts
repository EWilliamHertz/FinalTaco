"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function getNotifications() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    return { success: true, notifications };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function markAsRead(id?: string) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not logged in" };

  try {
    if (id) {
      await prisma.notification.update({
        where: { id, userId: user.id },
        data: { read: true }
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId: user.id, read: false },
        data: { read: true }
      });
    }
    revalidatePath("/notifications");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
