"use server";

import { prisma } from "@/lib/db";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

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

export interface ListingOverride {
  instanceId: string;
  /** Pricing mode for this card. Omit to use the bulk default. */
  mode?: "percent" | "flat";
  /** Percent of market price (mode=percent) or absolute USD (mode=flat). */
  value?: number;
  /** Skip this card entirely. */
  skip?: boolean;
}

/**
 * Mark cards for sale.
 * - bulkPercent: default listing price for all cards = marketPrice * bulkPercent/100
 * - overrides: per-card flat amounts or individual % of market
 */
export async function markForSale(
  instanceIds: string[],
  bulkPercent: number,
  overrides: ListingOverride[] = []
) {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Not logged in" };

    if (!instanceIds || instanceIds.length === 0) {
      return { success: false, error: "No cards selected" };
    }
    if (!Number.isFinite(bulkPercent) || bulkPercent <= 0) {
      return { success: false, error: "Bulk percent must be greater than 0" };
    }

    // Only allow listing cards the user actually owns
    const owned = await prisma.cardInstance.findMany({
      where: { id: { in: instanceIds }, ownerId: userId },
      include: { Card: { select: { marketPrice: true } } },
    });

    if (owned.length === 0) return { success: false, error: "No owned cards found" };

    const overrideMap = new Map(overrides.map((o) => [o.instanceId, o]));

    const listings = owned
      .map((inst) => {
        const ov = overrideMap.get(inst.id);
        if (ov?.skip) return null;

        const market = inst.Card.marketPrice || 0;
        let price: number;
        if (ov?.mode === "flat" && Number.isFinite(ov.value)) {
          price = ov.value as number;
        } else if (ov?.mode === "percent" && Number.isFinite(ov.value)) {
          price = market * ((ov.value as number) / 100);
        } else {
          price = market * (bulkPercent / 100);
        }

        price = Math.round(price * 100) / 100;
        if (price <= 0) return null;

        return {
          sellerId: userId,
          cardInstanceId: inst.id,
          price,
          status: "ACTIVE" as const,
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    if (listings.length === 0) {
      return { success: false, error: "No valid listings (prices must be greater than 0)" };
    }

    // Replace any existing active listings for these instances
    await prisma.$transaction([
      prisma.marketListing.deleteMany({
        where: { cardInstanceId: { in: instanceIds }, status: "ACTIVE" },
      }),
      prisma.marketListing.createMany({ data: listings }),
    ]);

    return { success: true, created: listings.length, total: owned.length };
  } catch (error) {
    console.error("Mark for sale error:", error);
    return { success: false, error: "Failed to create listings" };
  }
}

/** Remove an active listing (stop selling). */
export async function cancelListing(listingId: string) {
  try {
    const userId = await getUserId();
    if (!userId) return { success: false, error: "Not logged in" };

    const listing = await prisma.marketListing.findUnique({
      where: { id: listingId },
      select: { sellerId: true, status: true },
    });
    if (!listing || listing.sellerId !== userId) {
      return { success: false, error: "Listing not found" };
    }
    if (listing.status !== "ACTIVE") {
      return { success: false, error: "Listing is no longer active" };
    }

    await prisma.marketListing.update({
      where: { id: listingId },
      data: { status: "CANCELLED" },
    });
    return { success: true };
  } catch (error) {
    console.error("Cancel listing error:", error);
    return { success: false, error: "Failed to cancel listing" };
  }
}

export async function getMarketplaceListings(game?: string) {
  try {
    const whereClause: any = { status: "ACTIVE" };
    if (game && game !== "both") {
      whereClause.CardInstance = {
        Card: { game: game === "pokemon" ? "POKEMON" : "MTG" }
      };
    }

    const listings = await prisma.marketListing.findMany({
      where: whereClause,
      include: {
        Seller: { select: { username: true } },
        CardInstance: {
          include: { Card: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return listings;
  } catch (error) {
    console.error("Fetch marketplace error:", error);
    return [];
  }
}
