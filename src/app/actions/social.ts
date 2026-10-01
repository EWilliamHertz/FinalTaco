"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function toggleFollow(targetUserId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not logged in" };
    if (user.id === targetUserId) return { success: false, error: "Cannot follow yourself" };

    const existing = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId
        }
      }
    });

    if (existing) {
      await prisma.follows.delete({ where: { followerId_followingId: { followerId: user.id, followingId: targetUserId } } });
      revalidatePath("/profile");
      return { success: true, following: false };
    } else {
      await prisma.follows.create({
        data: {
          followerId: user.id,
          followingId: targetUserId
        }
      });
      revalidatePath("/profile");
      return { success: true, following: true };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getFollowStatus(targetUserId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, following: false };
    
    const existing = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId
        }
      }
    });
    
    return { success: true, following: !!existing };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
