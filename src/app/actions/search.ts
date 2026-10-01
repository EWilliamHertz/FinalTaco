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
import { searchScryfall } from "@/lib/scryfall";
import type { GameType, Prisma } from "@prisma/client";

const STOPWORDS = new Set(["the", "of", "and", "a", "to", "in", "is", "you", "that", "it", "he", "was", "for", "on", "are", "as", "with", "his", "they", "i", "at", "be", "this", "have", "from", "or", "one", "had", "by", "word", "but", "not", "what", "all", "were", "we", "when", "your", "can", "said", "there", "use", "an", "each", "which", "she", "do", "how", "their", "if", "will", "up", "other", "about", "out", "many", "then", "them", "these", "so", "some", "her", "would", "make", "like", "him", "into", "time", "has", "look", "two", "more", "write", "go", "see", "number", "no", "way", "could", "people", "my", "than", "first", "water", "been", "call", "who", "oil", "its", "now", "find", "long", "down", "day", "did", "get", "come", "made", "may", "part"]);

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
  foilPrice: number | null;
  reversePrice: number | null;
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
  
  let mapped: CatalogCard[] = [];

  // MTG Scryfall Search
  if (games.includes("MTG") && (name || set || number)) {
    try {
      const scryfallCards = await searchScryfall(name, set, number);
      for (const c of scryfallCards) {
        // Many Scryfall cards have multiple faces. Use front face name if available.
        const cardName = c.name.includes(" // ") ? c.name.split(" // ")[0] : c.name;
        
        mapped.push({
          tcgcsvId: c.tcgplayer_id ? String(c.tcgplayer_id) : `scryfall-${c.id}`,
          name: cardName,
          setName: c.set_name,
          setCode: c.set?.toUpperCase() || null,
          number: c.collector_number || null,
          imageUrl: c.image_uris?.normal || c.card_faces?.[0]?.image_uris?.normal || null,
          rarity: c.rarity || null,
          marketPrice: c.prices?.usd ? parseFloat(c.prices.usd) : 0,
          foilPrice: c.prices?.usd_foil ? parseFloat(c.prices.usd_foil) : null,
          reversePrice: null, // MTG does not use reverse holofoil
          game: "mtg",
        });
      }
    } catch (e) {
      console.error("Failed MTG Scryfall search:", e);
    }
  }

  // Pokemon TCGCSV Search
  if (games.includes("POKEMON")) {
    if (set) {
      const categoryIds = [CATEGORY_IDS.pokemon];
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

    const where: any = { game: "POKEMON" };
    if (set) {
      where.setCode = { equals: set, mode: "insensitive" };
    }
    if (number) {
      where.number = { equals: number, mode: "insensitive" };
    }

    if (name) {
      const words = name.split(" ").filter(w => w.trim().length > 0 && !STOPWORDS.has(w.toLowerCase()));
      const wordClauses = words.map(w => ({
        OR: [
          { name: { contains: w, mode: "insensitive" } },
          { cleanName: { contains: w, mode: "insensitive" } }
        ]
      }));

      if (wordClauses.length > 0) {
        if (set || number) {
          where.AND = wordClauses;
        } else {
          where.AND = [
            {
              OR: [
                { name: { contains: name, mode: "insensitive" } },
                { cleanName: { contains: name, mode: "insensitive" } },
              ],
            },
          ];
          
          let exactMatch = await prisma.cardReference.findMany({
            where,
            take: 20,
            orderBy: [{ marketPrice: "desc" }, { name: "asc" }],
          });
          
          if (exactMatch.length === 0) {
            where.AND = wordClauses;
          }
        }
      }
    }

    if (Object.keys(where).length > 1) {
      const results = await prisma.cardReference.findMany({
        where,
        take: 30,
        orderBy: [{ marketPrice: "desc" }, { name: "asc" }],
      });
      
      mapped.push(...results.map((c) => ({
        tcgcsvId: c.tcgcsvId,
        name: c.name,
        setName: c.setName,
        setCode: c.setCode,
        number: c.number,
        imageUrl: c.imageUrl,
        rarity: c.rarity,
        marketPrice: c.marketPrice,
        foilPrice: c.foilPrice,
        reversePrice: c.reversePrice,
        game: "pokemon",
      })));
    }
  }

  // Sort combined results by price
  mapped.sort((a, b) => b.marketPrice - a.marketPrice);
  
  return { results: mapped.slice(0, 50), setsSynced };

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
