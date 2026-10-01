import { prisma } from "@/lib/db";
import { after } from "next/server";
import { CATEGORY_IDS } from "./tcgcsv";

const TCGCSV_BASE = "https://tcgcsv.com/tcgplayer";
const HEADERS = {
  "User-Agent": "HatakeSocial/1.0.0 (Contact: admin@hatake.social)",
  Accept: "application/json",
};

/** Fetch a TCGCSV collection and return its `results` array. */
async function fetchResults(path: string): Promise<any[]> {
  const res = await fetch(`${TCGCSV_BASE}${path}`, {
    headers: HEADERS,
    // TCGCSV is a static daily mirror behind a CDN; bypass Next's fetch
    // cache so re-syncs see fresh builds.
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`TCGCSV ${path} failed: ${res.status}`);
  const data = await res.json();
  return data.results || [];
}

/**
 * Ensure the CardGroup catalog (sets) is populated for a category.
 * Cheap (~1 request); safe to run at search time.
 */
export async function syncGroups(categoryId: number): Promise<number> {
  const existing = await prisma.cardGroup.count({ where: { categoryId } });
  if (existing > 0) return existing;

  const groups = await fetchResults(`/${categoryId}/groups`);
  if (groups.length === 0) return 0;

  await prisma.cardGroup.createMany({
    data: groups.map((g: any) => ({
      groupId: g.groupId,
      categoryId: g.categoryId,
      name: g.name,
      abbreviation: g.abbreviation || null,
      publishedOn: g.publishedOn ? new Date(g.publishedOn) : null,
      syncedAt: null,
    })),
    skipDuplicates: true,
  });

  return groups.length;
}

/**
 * Find groups matching a user-entered set code (or set name fragment).
 * Exact abbreviation matches are ranked first.
 */
export async function findGroupsByCode(categoryId: number, code: string) {
  await syncGroups(categoryId);
  const q = code.trim();
  if (!q) return [];
  const groups = await prisma.cardGroup.findMany({
    where: {
      categoryId,
      OR: [
        { abbreviation: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { publishedOn: "desc" },
  });
  const lower = q.toLowerCase();
  return groups.sort(
    (a, b) =>
      Number(b.abbreviation?.toLowerCase() === lower) -
      Number(a.abbreviation?.toLowerCase() === lower)
  );
}

/** Prefer Normal, then Holofoil, then anything else when a product has multiple prices. */
function subtypeRank(s?: string | null): number {
  if (s === "Normal") return 0;
  if (s === "Holofoil") return 1;
  return 2;
}

const UPSERT_BATCH = 25;

/**
 * Sync one group's products + prices into CardReference.
 * ~2 TCGCSV requests, bounded by set size (hundreds, not tens of thousands).
 */
export async function syncGroupProducts(
  categoryId: number,
  groupId: number
): Promise<{ products: number }> {
  const [products, prices] = await Promise.all([
    fetchResults(`/${categoryId}/${groupId}/products`),
    fetchResults(`/${categoryId}/${groupId}/prices`),
  ]);

  const group = await prisma.cardGroup.findUnique({ where: { groupId } });
  const groupName = group?.name ?? "Unknown Set";
  const setCode = group?.abbreviation ?? null;

  const normalPriceByProduct = new Map<number, any>();
  const foilPriceByProduct = new Map<number, any>();
  const reversePriceByProduct = new Map<number, any>();

  for (const p of prices) {
    const sub = p.subTypeName?.toLowerCase() || "";
    if (sub.includes("reverse")) {
      reversePriceByProduct.set(p.productId, p);
    } else if (sub.includes("foil") || sub.includes("holo")) {
      const prev = foilPriceByProduct.get(p.productId);
      if (!prev || subtypeRank(p.subTypeName) < subtypeRank(prev.subTypeName)) {
        foilPriceByProduct.set(p.productId, p);
      }
    } else {
      const prev = normalPriceByProduct.get(p.productId);
      if (!prev || subtypeRank(p.subTypeName) < subtypeRank(prev.subTypeName)) {
        normalPriceByProduct.set(p.productId, p);
      }
    }
  }

  const game = categoryId === CATEGORY_IDS.mtg ? "MTG" : "POKEMON";

  for (let i = 0; i < products.length; i += UPSERT_BATCH) {
    const batch = products.slice(i, i + UPSERT_BATCH);
    await prisma.$transaction(
      batch.map((prod: any) => {
        const nPrice = normalPriceByProduct.get(prod.productId) || foilPriceByProduct.get(prod.productId) || reversePriceByProduct.get(prod.productId);
        const fPrice = foilPriceByProduct.get(prod.productId);
        const rPrice = reversePriceByProduct.get(prod.productId);
        const priceVal = nPrice?.marketPrice ?? nPrice?.midPrice ?? nPrice?.lowPrice ?? 0;
        const foilPriceVal = fPrice?.marketPrice ?? fPrice?.midPrice ?? fPrice?.lowPrice ?? null;
        const reversePriceVal = rPrice?.marketPrice ?? rPrice?.midPrice ?? rPrice?.lowPrice ?? null;
        const ext = (prod.extendedData || []) as {
          name: string;
          value: string;
        }[];
        const findExt = (nm: string) =>
          ext.find((e) => e.name === nm)?.value ?? null;

        return prisma.cardReference.upsert({
          where: { tcgcsvId: String(prod.productId) },
          update: {
            marketPrice: priceVal,
            foilPrice: foilPriceVal,
            reversePrice: reversePriceVal,
            lowPrice: nPrice?.lowPrice ?? null,
            highPrice: nPrice?.highPrice ?? null,
            groupId,
            setName: groupName,
            setCode,
          },
          create: {
            tcgcsvId: String(prod.productId),
            game,
            groupId,
            name: prod.name,
            cleanName: prod.cleanName ?? null,
            setName: groupName,
            setCode,
            number: findExt("Number"),
            imageUrl: prod.imageUrl || null,
            rarity: findExt("Rarity"),
            subTypeName: nPrice?.subTypeName ?? null,
            marketPrice: priceVal,
            foilPrice: foilPriceVal,
            reversePrice: reversePriceVal,
            lowPrice: nPrice?.lowPrice ?? null,
            highPrice: nPrice?.highPrice ?? null,
          },
        });
      })
    );
  }

  await prisma.cardGroup.update({
    where: { groupId },
    data: { syncedAt: new Date() },
  });

  return { products: products.length };
}

// ---------------------------------------------------------------------------
// Full-catalog sync job with progress tracking (survives HMR via globalThis)
// ---------------------------------------------------------------------------

interface SyncProgress {
  running: boolean;
  categoryIds: number[];
  done: number;
  total: number;
  currentGroup: string | null;
  errors: string[];
  startedAt: number | null;
  finishedAt: number | null;
}

const globalForSync = globalThis as unknown as {
  __hatakeCatalogSync?: SyncProgress;
};

function progressRef(): SyncProgress {
  if (!globalForSync.__hatakeCatalogSync) {
    globalForSync.__hatakeCatalogSync = {
      running: false,
      categoryIds: [],
      done: 0,
      total: 0,
      currentGroup: null,
      errors: [],
      startedAt: null,
      finishedAt: null,
    };
  }
  return globalForSync.__hatakeCatalogSync;
}

export function getSyncProgress(): SyncProgress {
  return progressRef();
}

/**
 * Kick off a background sync of every group in the given categories
 * (or only `groupIds` if provided). Returns immediately; poll getSyncProgress.
 *
 * Uses next/server `after()` so the work continues after the response is
 * sent — required on Vercel serverless, harmless locally.
 */
export function startFullSync(
  categoryIds: number[],
  groupIds?: number[]
): SyncProgress {
  const p = progressRef();
  if (p.running) return p;

  const run = async () => {
    try {
      for (const categoryId of categoryIds) {
        await syncGroups(categoryId);
      }
      const groups = await prisma.cardGroup.findMany({
        where: {
          categoryId: { in: categoryIds },
          ...(groupIds && groupIds.length > 0 ? { groupId: { in: groupIds } } : {}),
        },
        orderBy: { publishedOn: "desc" },
      });

      p.categoryIds = categoryIds;
      p.done = groups.filter(g => g.syncedAt !== null).length;
      p.total = groups.length;
      p.currentGroup = null;
      p.errors = [];
      p.startedAt = Date.now();
      p.running = true;
      p.finishedAt = null;

      for (const grp of groups) {
        // Skip already synced groups unless explicitly forced via groupIds
        if (grp.syncedAt !== null && (!groupIds || groupIds.length === 0)) {
          continue;
        }

        try {
          p.currentGroup = grp.name;
          await syncGroupProducts(grp.categoryId, grp.groupId);
        } catch (err: any) {
          p.errors.push(`${grp.name}: ${err?.message ?? "unknown error"}`);
        }
        p.done += 1;
      }
    } catch (err: any) {
      p.errors.push(err?.message ?? "fatal sync error");
    } finally {
      p.running = false;
      p.finishedAt = Date.now();
    }
  };

  try {
    after(run);
  } catch {
    // Called outside a request scope (e.g. local scripts) — run directly.
    void run();
  }

  return p;
}
