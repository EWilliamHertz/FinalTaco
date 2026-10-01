"use server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "./auth";

export async function getSnapshots() {
  const user = await getCurrentUser();
  if (!user) return { success: false };
  try {
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" }
    });
    return { success: true, snapshots };
  } catch (e) {
    return { success: false };
  }
}
