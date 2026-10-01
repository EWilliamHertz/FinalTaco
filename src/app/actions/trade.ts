"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "./auth";
import { revalidatePath } from "next/cache";

export async function createTrade(receiverId: string, offeredInstanceIds: string[], requestedInstanceIds: string[]) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not logged in" };

    if (user.id === receiverId) return { success: false, error: "Cannot trade with yourself" };
    if (offeredInstanceIds.length === 0 && requestedInstanceIds.length === 0) return { success: false, error: "Empty trade" };

    const trade = await prisma.trade.create({
      data: {
        senderId: user.id,
        receiverId,
        OfferedItems: {
          create: offeredInstanceIds.map(id => ({
            cardInstanceId: id,
            isOffered: true
          }))
        },
        RequestedItems: {
          create: requestedInstanceIds.map(id => ({
            cardInstanceId: id,
            isOffered: false
          }))
        }
      }
    });

    return { success: true, trade };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateTradeStatus(tradeId: string, status: "ACCEPTED" | "DECLINED" | "CANCELLED") {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not logged in" };

    const trade = await prisma.trade.findUnique({
      where: { id: tradeId },
      include: { OfferedItems: true, RequestedItems: true }
    });

    if (!trade) return { success: false, error: "Trade not found" };

    if (status === "CANCELLED" && trade.senderId !== user.id) {
      return { success: false, error: "Only sender can cancel" };
    }
    
    if ((status === "ACCEPTED" || status === "DECLINED") && trade.receiverId !== user.id) {
      return { success: false, error: "Only receiver can accept or decline" };
    }

    if (trade.status !== "PENDING") {
      return { success: false, error: "Trade is not pending" };
    }

    if (status === "ACCEPTED") {
      // Execute trade: Swap ownerIds
      for (const item of trade.OfferedItems) {
        await prisma.cardInstance.update({
          where: { id: item.cardInstanceId },
          data: { ownerId: trade.receiverId }
        });
      }
      for (const item of trade.RequestedItems) {
        await prisma.cardInstance.update({
          where: { id: item.cardInstanceId },
          data: { ownerId: trade.senderId }
        });
      }
    }

    const updated = await prisma.trade.update({
      where: { id: tradeId },
      data: { status }
    });

    revalidatePath("/trades");
    return { success: true, trade: updated };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTrades() {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not logged in" };

    const trades = await prisma.trade.findMany({
      where: {
        OR: [
          { senderId: user.id },
          { receiverId: user.id }
        ]
      },
      include: {
        Sender: { select: { username: true, avatarUrl: true } },
        Receiver: { select: { username: true, avatarUrl: true } },
        OfferedItems: {
          include: {
            Instance: { include: { Card: true } }
          }
        },
        RequestedItems: {
          include: {
            Instance: { include: { Card: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return { success: true, trades };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
