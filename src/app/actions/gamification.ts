"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "./auth";

// Basic stub for awarding a badge
export async function awardBadge(userId: string, badgeName: string) {
  try {
    let badge = await prisma.badge.findUnique({ where: { name: badgeName } });
    if (!badge) return { success: false, error: "Badge not found" };

    const existing = await prisma.userBadge.findUnique({
      where: {
        userId_badgeId: { userId, badgeId: badge.id }
      }
    });

    if (!existing) {
      await prisma.userBadge.create({
        data: { userId, badgeId: badge.id }
      });
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getUserBadges(username: string) {
  try {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return { success: false, badges: [] };

    const badges = await prisma.userBadge.findMany({
      where: { userId: user.id },
      include: { Badge: true }
    });

    return { success: true, badges: badges.map(b => b.Badge) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
