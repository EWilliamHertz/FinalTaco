"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function toggleWishlist(cardId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not logged in" };

    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_cardId: {
          userId: user.id,
          cardId
        }
      }
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      revalidatePath("/search");
      revalidatePath("/profile");
      return { success: true, added: false };
    } else {
      await prisma.wishlist.create({
        data: {
          userId: user.id,
          cardId
        }
      });
      revalidatePath("/search");
      revalidatePath("/profile");
      return { success: true, added: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getWishlist(username?: string) {
  try {
    const targetUser = username ? await prisma.user.findUnique({ where: { username } }) : await getCurrentUser();
    if (!targetUser) return { success: false, items: [] };

    const wishlist = await prisma.wishlist.findMany({
      where: { userId: targetUser.id },
      include: {
        Card: true
      },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, items: wishlist };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
