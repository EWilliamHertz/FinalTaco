const { PrismaClient } = require('./node_modules/@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const fetch = global.fetch; // node 18+ has fetch
  console.log("Fetching products...");
  const pRes = await fetch("https://tcgcsv.com/tcgplayer/1/3079/products", { headers: { 'User-Agent': 'hatake-social/1.0' } });
  const products = (await pRes.json()).results;
  
  console.log("Fetching prices...");
  const prRes = await fetch("https://tcgcsv.com/tcgplayer/1/3079/prices", { headers: { 'User-Agent': 'hatake-social/1.0' } });
  const prices = (await prRes.json()).results;
  
  const normalPriceByProduct = new Map();
  const foilPriceByProduct = new Map();

  for (const p of prices) {
    const isFoil = p.subTypeName?.toLowerCase().includes("foil") || p.subTypeName?.toLowerCase().includes("holo");
    if (isFoil) foilPriceByProduct.set(p.productId, p);
    else normalPriceByProduct.set(p.productId, p);
  }

  console.log("Inserting...", products.length);
  const data = [];
  
  for (const prod of products) {
        const nPrice = normalPriceByProduct.get(prod.productId) || foilPriceByProduct.get(prod.productId);
        const fPrice = foilPriceByProduct.get(prod.productId) || normalPriceByProduct.get(prod.productId);
        const priceVal = nPrice?.marketPrice ?? nPrice?.midPrice ?? nPrice?.lowPrice ?? 0;
        const foilPriceVal = fPrice?.marketPrice ?? fPrice?.midPrice ?? fPrice?.lowPrice ?? null;
        
        const ext = (prod.extendedData || []);
        const rarityObj = ext.find(e => e.name === "Rarity");
        const numObj = ext.find(e => e.name === "Number");

        data.push({
          tcgcsvId: String(prod.productId),
          groupId: 3079,
          game: "MTG",
          name: prod.name,
          cleanName: prod.cleanName,
          setName: "Universes Beyond: Warhammer 40,000",
          setCode: "40K",
          number: numObj ? numObj.value : null,
          imageUrl: prod.imageUrl,
          rarity: rarityObj ? rarityObj.value : null,
          marketPrice: priceVal,
          foilPrice: foilPriceVal,
        });
  }
  
  // upsert
  let inserted = 0;
  for (const d of data) {
    await prisma.cardReference.upsert({
      where: { tcgcsvId: d.tcgcsvId },
      create: d,
      update: d
    });
    inserted++;
  }
  console.log("Done inserting", inserted);
}
run();
