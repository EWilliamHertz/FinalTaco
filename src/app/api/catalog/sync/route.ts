import { NextResponse } from "next/server";
import { syncGroups, syncGroupProducts, startFullSync, getSyncProgress } from "@/lib/catalog";
import { CATEGORY_IDS } from "@/lib/tcgcsv";

/**
 * POST /api/catalog/sync
 *   { categoryId }             -> ensure groups exist (fast)
 *   { categoryId, groupId }    -> sync one set's cards + prices (~2 requests)
 *   { categoryIds: [..] }      -> full background catalog sync
 *   { groups: [{categoryId, groupId}] } -> sync several specific sets
 *
 * GET /api/catalog/sync -> current sync progress
 */
export async function GET() {
  return NextResponse.json(getSyncProgress());
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));

    if (body.categoryIds || body.groups) {
      const categoryIds: number[] =
        body.categoryIds ??
        [...new Set((body.groups as any[]).map((g) => g.categoryId))];
      const groupIds: number[] | undefined = body.groups?.map(
        (g: any) => g.groupId
      );
      const progress = startFullSync(categoryIds, groupIds);
      return NextResponse.json({ started: true, progress });
    }

    const categoryId = Number(body.categoryId);
    if (!categoryId) {
      return NextResponse.json(
        { error: "Missing categoryId" },
        { status: 400 }
      );
    }

    if (body.groupId) {
      const result = await syncGroupProducts(categoryId, Number(body.groupId));
      return NextResponse.json({ synced: true, ...result });
    }

    const count = await syncGroups(categoryId);
    return NextResponse.json({ syncedGroups: count });
  } catch (error: any) {
    console.error("Catalog sync error:", error);
    return NextResponse.json(
      { error: error?.message || "Sync failed" },
      { status: 500 }
    );
  }
}
