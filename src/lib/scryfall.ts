export async function searchScryfall(query: string, set?: string, number?: string, page: number = 1) {
  let q = [];
  if (query) q.push(query);
  if (set) q.push(`set:${set}`);
  if (number) q.push(`cn:${number}`);
  
  if (q.length === 0) return { data: [], has_more: false };

  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(q.join(" "))}&unique=prints&page=${page}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'hatake-social/1.0' } });
    if (!res.ok) {
      if (res.status === 404) return { data: [], has_more: false }; // No cards found
      throw new Error(`Scryfall API error: ${res.statusText}`);
    }
    const data = await res.json();
    return { data: data.data || [], has_more: data.has_more || false };
  } catch (error) {
    console.error("Scryfall error:", error);
    return { data: [], has_more: false };
  }
}
