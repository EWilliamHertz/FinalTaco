"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/app/actions/auth";

export async function createAuction(cardInstanceId: string, startingPrice: number, buyItNowPrice: number | null, durationHours: number) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const cardInstance = await prisma.cardInstance.findUnique({
      where: { id: cardInstanceId }
    });

    if (!cardInstance) {
      return { success: false, error: "Card instance not found" };
    }

    if (cardInstance.ownerId !== user.id) {
      return { success: false, error: "You don't own this card" };
    }

    const endTime = new Date();
    endTime.setHours(endTime.getHours() + durationHours);

    const auction = await prisma.auction.create({
      data: {
        sellerId: user.id,
        cardInstanceId,
        startingPrice,
        currentPrice: startingPrice,
        buyItNowPrice,
        endTime,
        status: "ACTIVE"
      }
    });

    return { success: true, auctionId: auction.id };
  } catch (error) {
    console.error("Failed to create auction:", error);
    return { success: false, error: "Failed to create auction" };
  }
}

export async function getActiveAuctions() {
  try {
    const auctions = await prisma.auction.findMany({
      where: { status: "ACTIVE" },
      include: {
        CardInstance: {
          include: {
            Card: true
          }
        },
        Seller: {
          select: { username: true, avatarUrl: true }
        }
      },
      orderBy: { endTime: "asc" }
    });
    return { success: true, auctions };
  } catch (error) {
    console.error("Failed to fetch auctions:", error);
    return { success: false, error: "Failed to fetch auctions" };
  }
}

export async function getAuctionDetails(auctionId: string) {
  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        CardInstance: {
          include: {
            Card: true
          }
        },
        Seller: {
          select: { username: true, avatarUrl: true, id: true }
        },
        Bids: {
          include: {
            Bidder: {
              select: { username: true, avatarUrl: true }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!auction) return { success: false, error: "Auction not found" };

    return { success: true, auction };
  } catch (error) {
    console.error("Failed to fetch auction details:", error);
    return { success: false, error: "Failed to fetch auction details" };
  }
}

export async function placeBid(auctionId: string, amount: number) {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };

  try {
    const auction = await prisma.auction.findUnique({
      where: { id: auctionId }
    });

    if (!auction) return { success: false, error: "Auction not found" };
    if (auction.status !== "ACTIVE") return { success: false, error: "Auction is no longer active" };
    if (auction.sellerId === user.id) return { success: false, error: "You cannot bid on your own auction" };
    if (auction.endTime < new Date()) return { success: false, error: "Auction has ended" };

    if (amount <= auction.currentPrice) {
      return { success: false, error: "Bid amount must be greater than current price" };
    }

    const newBid = await prisma.auctionBid.create({
      data: {
        auctionId,
        bidderId: user.id,
        amount
      }
    });

    await prisma.auction.update({
      where: { id: auctionId },
      data: { currentPrice: amount }
    });

    return { success: true, bid: newBid };
  } catch (error) {
    console.error("Failed to place bid:", error);
    return { success: false, error: "Failed to place bid" };
  }
}

export async function getUserCardsForAuction() {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Unauthorized" };
  
  try {
    const cards = await prisma.cardInstance.findMany({
      where: { ownerId: user.id },
      include: {
        Card: true
      }
    });
    return { success: true, cards };
  } catch (error) {
    console.error("Failed to fetch user cards:", error);
    return { success: false, error: "Failed to fetch user cards" };
  }
}
