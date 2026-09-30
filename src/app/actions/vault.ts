"use server";

import { PrismaClient, GameType } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function addToVault(data: {
  tcgcsvId: string;
  game: "pokemon" | "mtg";
  name: string;
  setName: string;
  imageUrl: string;
  rarity?: string;
}) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return { success: false, error: "Not logged in" };

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "hatakesecret") as { userId: string };
    const userId = decoded.userId;

    const gameType: GameType = data.game === "pokemon" ? "POKEMON" : "MTG";

    // 1. Ensure CardReference exists
    let cardRef = await prisma.cardReference.findUnique({
      where: { tcgcsvId: data.tcgcsvId }
    });

    if (!cardRef) {
      cardRef = await prisma.cardReference.create({
        data: {
          tcgcsvId: data.tcgcsvId,
          game: gameType,
          name: data.name,
          setName: data.setName,
          imageUrl: data.imageUrl,
          rarity: data.rarity || "",
        }
      });
    }

    // 2. Create CardInstance in user's vault
    await prisma.cardInstance.create({
      data: {
        ownerId: userId,
        cardId: cardRef.id,
        condition: "NEAR_MINT",
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Add to vault error:", error);
    return { success: false, error: "Failed to add to vault" };
  }
}

export async function getVault() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return { success: false, error: "Not logged in" };

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "hatakesecret") as { userId: string };
    const userId = decoded.userId;

    const instances = await prisma.cardInstance.findMany({
      where: { ownerId: userId },
      include: {
        Card: true
      },
      orderBy: { acquiredAt: 'desc' }
    });

    return { success: true, instances };
  } catch (error) {
    console.error("Get vault error:", error);
    return { success: false, error: "Failed to get vault" };
  }
}
