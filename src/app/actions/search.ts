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
  let name = input.name?.trim() ?? "";
  let set = input.set?.trim() ?? "";
  let number = input.number?.trim() ?? "";

  // Smart parser: If user typed "Abaddon 40K 319" into name
  if (!set && !number && name) {
    const parts = name.split(" ");
    if (parts.length >= 3) {
      const possibleNumber = parts[parts.length - 1];
      const possibleSet = parts[parts.length - 2];
      // Basic heuristic: number is often digits or alphanumeric short string, set is 3-4 letters
      if (/^\d+[a-zA-Z]?$/.test(possibleNumber) || possibleNumber.includes("/")) {
        number = possibleNumber;
        set = possibleSet;
        name = parts.slice(0, parts.length - 2).join(" ");
      }
    }
  }

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

  let results = await prisma.cardReference.findMany({
    where,
    orderBy: [{ marketPrice: "desc" }],
    take: 60,
  });

  // Fallback: If 0 results, try matching ANY significant word in the name
  if (results.length === 0 && name) {
    const stopWords = new Set(["the", "of", "and", "a", "an", "in", "on", "with", "to", "for"]);
    const words = name.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w.toLowerCase()));
    
    if (words.length > 0) {
      delete where.OR; // remove strict name match
      
      const wordClauses = words.map(w => ({
        OR: [
          { name: { contains: w, mode: "insensitive" } },
          { cleanName: { contains: w, mode: "insensitive" } }
        ]
      }));
      
      // Require ALL significant words to match (still strict but ignores misspellings in dropped words)
      // Actually, let's just require ANY word to match, since number/set might narrow it down heavily
      const currentAnd = Array.isArray(where.AND) ? where.AND : (where.AND ? [where.AND] : []);
      if (set || number) {
        where.AND = [...currentAnd, { OR: wordClauses }] as any;
      } else {
        where.AND = [...currentAnd, { OR: wordClauses }] as any;
      }

      results = await prisma.cardReference.findMany({
        where,
        orderBy: [{ marketPrice: "desc" }],
        take: 60,
      });
    }
  }
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

  let groups = 0, cards = 0, syncedGroups = 0;
  try {
    [groups, cards, syncedGroups] = await Promise.all([
      prisma.cardGroup.count({ where: { categoryId: { in: categoryIds } } }),
      prisma.cardReference.count({
        where: { Group: { categoryId: { in: categoryIds } } },
      }),
      prisma.cardGroup.count({
        where: { categoryId: { in: categoryIds }, syncedAt: { not: null } },
      }),
    ]);
  } catch (err: any) {
    groupsError = groupsError || err?.message || "Failed to reach database";
  }

  return { groups, cards, syncedGroups, sync: getSyncProgress(), categoryIds, groupsError };
}

/** Start a full catalog sync for the active game(s). */
export async function startCatalogSync(game: "pokemon" | "mtg" | "both") {
  return startFullSync(categoryIdsForGame(game));
}
