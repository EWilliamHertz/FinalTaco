import { NextResponse } from "next/server";

/**
 * Server-side image proxy.
 *
 * The user's ISP blocks Scryfall's image hosts, so card images must be
 * fetched server-side and streamed back from our own origin. Also proxies
 * TCGplayer product images (the Pokémon catalog) for the same reason.
 *
 * Usage: /api/img?url=<encoded image url>
 * Only allowlisted hosts are proxied so this can't be abused as an open proxy.
 */

const ALLOWED_HOST_SUFFIXES = [
  "scryfall.io",
  "cards.scryfall.io",
  "img.scryfall.com",
  "product-images.tcgplayer.com",
  "tcgcsv.com",
];

const UA = "HatakeSocial/1.0.0 (Contact: admin@hatake.social)";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = searchParams.get("url");

  if (!raw) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Only https urls are allowed" }, { status: 400 });
  }

  const host = parsed.hostname.toLowerCase();
  const allowed = ALLOWED_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  );
  if (!allowed) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: { "User-Agent": UA, Accept: "image/*" },
      // Images are static; let Next/CDN cache the proxy response for an hour
      next: { revalidate: 3600 },
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 }
      );
    }

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return NextResponse.json({ error: "Proxy fetch failed" }, { status: 502 });
  }
}
