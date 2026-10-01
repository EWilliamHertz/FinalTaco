/**
 * Route a remote card image through our server-side proxy (/api/img).
 *
 * The user's ISP blocks Scryfall's image hosts, so every card image shown in
 * the UI must go through the proxy to be visible. Already-local images
 * (e.g. /uploads/...) are returned untouched.
 */
export function proxiedImage(url?: string | null): string | undefined {
  if (!url) return undefined;
  // Local/static images don't need the proxy
  if (url.startsWith("/")) return url;
  return `/api/img?url=${encodeURIComponent(url)}`;
}
