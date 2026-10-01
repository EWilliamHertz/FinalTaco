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
  foilPrice?: number | null;
  reversePrice?: number | null;
  condition?: any;
  notes?: string;
  quantity?: number;
  customPrice?: number;
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
        foilPrice: data.foilPrice !== undefined ? data.foilPrice : undefined,
        reversePrice: data.reversePrice !== undefined ? data.reversePrice : undefined,
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
        foilPrice: data.foilPrice ?? null,
        reversePrice: data.reversePrice ?? null,
      },
    });

    // 2. Create CardInstance(s) in user's vault
    const qty = data.quantity || 1;
    await prisma.cardInstance.createMany({
      data: Array.from({ length: qty }).map(() => ({
        ownerId: userId,
        cardId: cardRef.id,
        condition: data.condition || "NEAR_MINT",
        notes: data.notes || null,
        customPrice: data.customPrice || null,
      })),
    });

    return { success: true };
  } catch (error) {
    console.error("Add to vault error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to add to vault" };
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

export async function getVaultStats() {
  try {
    const userId = await getUserId();
    if (!userId) return { count: 0, value: 0 };
    
    const instances = await prisma.cardInstance.findMany({
      where: { ownerId: userId },
      include: { Card: { select: { marketPrice: true, foilPrice: true } } }
    });
    
    const count = instances.length;
    const value = instances.reduce((acc, inst) => {
      if (inst.customPrice !== null) return acc + inst.customPrice;
      const isFoil = inst.notes?.toLowerCase().includes("foil") || inst.notes?.toLowerCase().includes("holo");
      if (isFoil && inst.Card.foilPrice) return acc + inst.Card.foilPrice;
      return acc + (inst.Card.marketPrice || 0);
    }, 0);
    return { count, value };
  } catch {
    return { count: 0, value: 0 };
  }
}

export async function removeFromVault(instanceIds: string[]) {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Not logged in" };

    // Delete instances that belong to the user
    await prisma.cardInstance.deleteMany({
      where: {
        id: { in: instanceIds },
        ownerId: userId,
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error("Remove from vault error:", error);
    return { success: false, error: "Failed to remove items from vault" };
  }
}
