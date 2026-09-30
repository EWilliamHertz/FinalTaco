"use server";

import { prisma } from "@/lib/db";
import { CATEGORY_IDS } from "@/lib/tcgcsv";
import {
  findGroupsByCode,
  syncGroups,
  syncGroupProducts,
  startFullSync,
  getSyncProgress,
} from "@/lib/catalog";
import type { GameType, Prisma } from "@prisma/client";

export interface CatalogSearchInput {
  name?: string;
  set?: string;
  number?: string;
  game?: "pokemon" | "mtg" | "both";
}

export interface CatalogCard {
  tcgcsvId: string;
  name: string;
  setName: string;
  setCode: string | null;
  number: string | null;
  imageUrl: string | null;
  rarity: string | null;
  marketPrice: number;
  game: string;
}

const MAX_AUTO_SYNCED_SETS = 5;

/**
 * Search the local catalog with any 1–3 combination of:
 *   name   – card name (contains, case-insensitive)
 *   set    – set code/abbreviation or set name fragment
 *   number – collector number (e.g. "139", "139/195", "7a")
 *
 * Cards live in sets; if a matched set isn't ingested yet, it is synced
 * on demand (max 5 sets per query) so results appear on the first search.
 */
export async function searchCatalog(
  input: CatalogSearchInput
): Promise<{ results: CatalogCard[]; setsSynced: string[] }> {
  const name = input.name?.trim() ?? "";
  const set = input.set?.trim() ?? "";
  const number = input.number?.trim() ?? "";
  const games: GameType[] =
    input.game === "pokemon"
      ? ["POKEMON"]
      : input.game === "mtg"
        ? ["MTG"]
        : ["POKEMON", "MTG"];

  const setsSynced: string[] = [];

  if (set) {
    const categoryIds = games.map((g) =>
      g === "MTG" ? CATEGORY_IDS.mtg : CATEGORY_IDS.pokemon
    );
    for (const categoryId of categoryIds) {
      const groups = await findGroupsByCode(categoryId, set);
      for (const grp of groups) {
        if (setsSynced.length >= MAX_AUTO_SYNCED_SETS) break;
        const known = await prisma.cardReference.findFirst({
          where: { groupId: grp.groupId },
          select: { id: true },
        });
        if (!known) {
          try {
            await syncGroupProducts(categoryId, grp.groupId);
            setsSynced.push(grp.name);
          } catch (err) {
            console.error(`Failed to sync set ${grp.name}:`, err);
          }
        }
      }
      if (setsSynced.length >= MAX_AUTO_SYNCED_SETS) break;
    }
  }

  const where: Prisma.CardReferenceWhereInput = { game: { in: games } };

  const andClauses: Prisma.CardReferenceWhereInput[] = [];

  if (set) {
    andClauses.push({
      OR: [
        { setCode: { contains: set, mode: "insensitive" } },
        { setName: { contains: set, mode: "insensitive" } },
      ],
    });
  }

  if (number) {
    andClauses.push({
      OR: [
        { number: number },
        { number: number.toLowerCase() },
        // "139" also matches "139/195"
        { number: { startsWith: `${number}/` } },
      ],
    });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  if (name) {
    where.OR = [
      { name: { contains: name, mode: "insensitive" } },
      { cleanName: { contains: name, mode: "insensitive" } },
    ];
  }

  const results = await prisma.cardReference.findMany({
    where,
    orderBy: [{ marketPrice: "desc" }],
    take: 60,
  });

  const mapped: CatalogCard[] = results.map((c) => ({
    tcgcsvId: c.tcgcsvId,
    name: c.name,
    setName: c.setName,
    setCode: c.setCode,
    number: c.number,
    imageUrl: c.imageUrl,
    rarity: c.rarity,
    marketPrice: c.marketPrice,
    game: c.game === "MTG" ? "mtg" : "pokemon",
  }));

  return { results: mapped, setsSynced };
}

function categoryIdsForGame(game: "pokemon" | "mtg" | "both"): number[] {
  if (game === "pokemon") return [CATEGORY_IDS.pokemon];
  if (game === "mtg") return [CATEGORY_IDS.mtg];
  return [CATEGORY_IDS.pokemon, CATEGORY_IDS.mtg];
}

/** Ensure groups exist for the active game(s) and report catalog coverage. */
export async function getCatalogStatus(game: "pokemon" | "mtg" | "both") {
  const categoryIds = categoryIdsForGame(game);
  let groupsError: string | null = null;
  for (const id of categoryIds) {
    try {
      await syncGroups(id);
    } catch (err: any) {
      // Don't let a TCGCSV hiccup hide the whole status banner
      groupsError = err?.message ?? "failed to reach TCGCSV";
    }
  }

  const [groups, cards, syncedGroups] = await Promise.all([
    prisma.cardGroup.count({ where: { categoryId: { in: categoryIds } } }),
    prisma.cardReference.count({
      where: { Group: { categoryId: { in: categoryIds } } },
    }),
    prisma.cardGroup.count({
      where: { categoryId: { in: categoryIds }, syncedAt: { not: null } },
    }),
  ]);

  return { groups, cards, syncedGroups, sync: getSyncProgress(), categoryIds, groupsError };
}

/** Start a full catalog sync for the active game(s). */
export async function startCatalogSync(game: "pokemon" | "mtg" | "both") {
  return startFullSync(categoryIdsForGame(game));
}
