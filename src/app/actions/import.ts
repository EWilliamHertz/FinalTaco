"use server";

import { addToVault } from "./vault";

/**
 * Import ManaBox CSV. 
 * ManaBox format is generally:
 * "Name","Set code","Set name","Collector number","Foil","Rarity","Quantity","ManaBox ID","Scryfall ID"
 */
export async function importManaboxCSV(csvText: string) {
  try {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== "");
    if (lines.length < 2) return { success: false, error: "Empty or invalid CSV file" };

    const headers = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim());
    const scryfallIdIdx = headers.findIndex(h => h.toLowerCase() === "scryfall id");
    const quantityIdx = headers.findIndex(h => h.toLowerCase() === "quantity");
    const foilIdx = headers.findIndex(h => h.toLowerCase() === "foil");

    if (scryfallIdIdx === -1) {
      return { success: false, error: "Could not find 'Scryfall ID' column in CSV" };
    }

    const cardsToImport = [];

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV split ignoring commas inside quotes
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(val => val.replace(/^"|"$/g, "").trim());
      if (!row || row.length <= scryfallIdIdx) continue;

      const scryfallId = row[scryfallIdIdx];
      if (!scryfallId) continue;

      const qty = quantityIdx !== -1 && row[quantityIdx] ? parseInt(row[quantityIdx], 10) : 1;
      const isFoil = foilIdx !== -1 && row[foilIdx]?.toLowerCase() === "foil";

      cardsToImport.push({ scryfallId, qty, isFoil });
    }

    if (cardsToImport.length === 0) return { success: false, error: "No Scryfall IDs found in the CSV" };

    let addedCount = 0;
    // Scryfall collection API allows max 75 per request
    const chunkSize = 75;
    for (let i = 0; i < cardsToImport.length; i += chunkSize) {
      const chunk = cardsToImport.slice(i, i + chunkSize);
      
      const identifiers = chunk.map(c => ({ id: c.scryfallId }));
      const res = await fetch("https://api.scryfall.com/cards/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "hatake-social/1.0" },
        body: JSON.stringify({ identifiers })
      });

      if (!res.ok) {
        console.error("Scryfall collection API error", await res.text());
        continue; // Skip chunk on error but continue others
      }

      const data = await res.json();
      const scryfallCards = data.data || [];

      for (const card of scryfallCards) {
        // Find original row for qty/foil
        const original = chunk.find(c => c.scryfallId === card.id);
        if (!original) continue;

        const cardName = card.name.includes(" // ") ? card.name.split(" // ")[0] : card.name;
        
        await addToVault({
          tcgcsvId: card.tcgplayer_id ? String(card.tcgplayer_id) : `scryfall-${card.id}`,
          game: "mtg",
          name: cardName,
          setName: card.set_name,
          imageUrl: card.image_uris?.normal || card.card_faces?.[0]?.image_uris?.normal || "",
          rarity: card.rarity || null,
          setCode: card.set?.toUpperCase() || null,
          number: card.collector_number || null,
          marketPrice: card.prices?.usd ? parseFloat(card.prices.usd) : 0,
          foilPrice: card.prices?.usd_foil ? parseFloat(card.prices.usd_foil) : null,
          reversePrice: null,
          quantity: original.qty,
          notes: original.isFoil ? "Foil" : ""
        });
        addedCount += original.qty;
      }
      
      // Delay to respect rate limits (50-100ms per Scryfall guidelines, 10 requests per second max)
      if (i + chunkSize < cardsToImport.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    return { success: true, count: addedCount };

  } catch (error) {
    console.error("CSV Import Error:", error);
    return { success: false, error: "Failed to parse and import CSV" };
  }
}
