const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fetchResults(path) {
  const res = await fetch(`https://tcgcsv.com/tcgplayer${path}`);
  const data = await res.json();
  return data.results || [];
}

async function run() {
  // Sync MTG (1) and Pokemon (2)
  for (const categoryId of [1, 2]) {
    console.log(`Syncing category ${categoryId}...`);
    const groups = await prisma.cardGroup.findMany({
      where: { categoryId, syncedAt: null },
      orderBy: { publishedOn: "desc" }
    });
    console.log(`Found ${groups.length} groups left to sync.`);
    
    for (const grp of groups) {
      console.log(`Syncing set: ${grp.name}...`);
      const [products, prices] = await Promise.all([
        fetchResults(`/${categoryId}/${grp.groupId}/products`),
        fetchResults(`/${categoryId}/${grp.groupId}/prices`),
      ]);
      
      const priceByProduct = new Map();
      for (const p of prices) {
        if (!priceByProduct.has(p.productId)) priceByProduct.set(p.productId, p);
      }
      
      const game = categoryId === 1 ? "MTG" : "POKEMON";
      
      for (const prod of products) {
        const price = priceByProduct.get(prod.productId);
        const priceVal = price?.marketPrice ?? price?.midPrice ?? price?.lowPrice ?? 0;
        await prisma.cardReference.upsert({
          where: { tcgcsvId: String(prod.productId) },
          update: { marketPrice: priceVal },
          create: {
            tcgcsvId: String(prod.productId),
            game,
            groupId: grp.groupId,
            name: prod.name,
            setName: grp.name,
            marketPrice: priceVal,
          },
        });
      }
      await prisma.cardGroup.update({
        where: { groupId: grp.groupId },
        data: { syncedAt: new Date() }
      });
    }
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
