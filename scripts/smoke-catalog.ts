import { syncGroups, syncGroupProducts, findGroupsByCode } from "../src/lib/catalog";
import { prisma } from "../src/lib/db";

async function main() {
  // 1. Groups sync
  const groupCount = await syncGroups(1); // MTG
  console.log(`[groups] MTG groups in catalog: ${groupCount}`);

  // 2. Find a set by code
  const groups = await findGroupsByCode(1, "OTP");
  console.log(`[find] code "OTP" ->`, groups.map((g) => `${g.name} (#${g.groupId})`));
  if (groups.length === 0) throw new Error("No group matched code OTP");

  const grp = groups[0];

  // 3. Sync that set's products + prices
  const t0 = Date.now();
  const { products } = await syncGroupProducts(1, grp.groupId);
  console.log(`[sync] ${grp.name}: ${products} products in ${Date.now() - t0}ms`);

  // 4. Combined search: name + set code + collector number
  const sample = await prisma.cardReference.findFirst({
    where: { groupId: grp.groupId, number: { not: null } },
    select: { name: true, number: true, setCode: true, marketPrice: true },
  });
  if (!sample) throw new Error("No synced card with a collector number found");

  const base = sample.name.split(/[,.]/)[0].split(" ").slice(0, 2).join(" ");
  const found = await prisma.cardReference.findMany({
    where: {
      AND: [
        { setCode: { contains: sample.setCode ?? "", mode: "insensitive" } },
        { OR: [{ number: sample.number }, { number: { startsWith: `${sample.number}/` } }] },
      ],
      OR: [
        { name: { contains: base, mode: "insensitive" } },
        { cleanName: { contains: base, mode: "insensitive" } },
      ],
    },
    take: 5,
  });
  console.log(`[search] name="${base}" set=${sample.setCode} #${sample.number} -> ${found.length} hit(s)`);
  for (const c of found) {
    console.log(`   - ${c.name} [${c.setCode} #${c.number}] $${c.marketPrice}`);
  }

  const counts = await prisma.$transaction([
    prisma.cardGroup.count(),
    prisma.cardReference.count(),
  ]);
  console.log(`[totals] groups=${counts[0]} cards=${counts[1]}`);
}

main()
  .catch((err) => {
    console.error("SMOKE TEST FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
