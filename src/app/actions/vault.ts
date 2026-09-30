"use server";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { GameType } from "@prisma/client";

/** Resolve the logged-in user's id from the auth cookie, or null. */
async function getUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "hatakesecret") as {
      userId: string;
    };
    return decoded.userId ?? null;
  } catch {
    return null;
    }
}

export async function addToVault(data: {
  tcgcsvId: string;
  game: "pokemon" | "mtg";
  name: string;
  setName: string;
  imageUrl: string;
  rarity?: string;
  setCode?: string;
  number?: string;
  marketPrice?: number;
}) {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Not logged in" };

    const gameType: GameType = data.game === "pokemon" ? "POKEMON" : "MTG";

    // 1. Ensure CardReference exists (upsert keeps prices/set metadata fresh)
    const cardRef = await prisma.cardReference.upsert({
      where: { tcgcsvId: data.tcgcsvId },
      update: {
        marketPrice: data.marketPrice ?? undefined,
        setCode: data.setCode ?? undefined,
        number: data.number ?? undefined,
      },
      create: {
        tcgcsvId: data.tcgcsvId,
        game: gameType,
        name: data.name,
        setName: data.setName,
        imageUrl: data.imageUrl || null,
        rarity: data.rarity || null,
        setCode: data.setCode ?? null,
        number: data.number ?? null,
        marketPrice: data.marketPrice ?? 0,
      },
    });

    // 2. Create CardInstance in user's vault
    await prisma.cardInstance.create({
      data: {
        ownerId: userId,
        cardId: cardRef.id,
        condition: "NEAR_MINT",
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Add to vault error:", error);
    return { success: false, error: "Failed to add to vault" };
  }
}

export async function getVault() {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Not logged in" };

    const instances = await prisma.cardInstance.findMany({
      where: { ownerId: userId },
      include: {
        Card: true,
        Listings: {
          where: { status: "ACTIVE" },
          select: { id: true, price: true },
        },
      },
      orderBy: { acquiredAt: "desc" },
    });

    return { success: true, instances };
    } catch (error) {
    console.error("Get vault error:", error);
    return { success: false, error: "Failed to get vault" };
  }
}

export async function removeCard(instanceId: string) {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Not logged in" };

    // Ownership check prevents removing another user's card
    const instance = await prisma.cardInstance.findUnique({
      where: { id: instanceId },
      select: { ownerId: true },
    });
    if (!instance || instance.ownerId !== userId) {
      return { success: false, error: "Card not found in your vault" };
    }

    await prisma.cardInstance.delete({ where: { id: instanceId } });
    return { success: true };
  } catch (error) {
    console.error("Remove card error:", error);
    return { success: false, error: "Failed to remove card" };
  }
}
