const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const badges = [
    { name: 'The Planeswalker', description: 'Collect cards from 10 different MTG sets', icon: '🔥' },
    { name: 'Gotta Catch Em All', description: 'Complete a base set of Pokémon cards', icon: '⚡' },
    { name: 'Verified Collector', description: 'Verified your email address', icon: '✔️' },
    { name: 'First Trade', description: 'Successfully completed your first trade', icon: '🤝' },
  ];

  for (const b of badges) {
    await prisma.badge.upsert({
      where: { name: b.name },
      update: {},
      create: b
    });
  }

  // Award 'Verified Collector' to all users just as a demo
  const badge = await prisma.badge.findUnique({ where: { name: 'Verified Collector' } });
  const users = await prisma.user.findMany();
  for (const u of users) {
    await prisma.userBadge.upsert({
      where: { userId_badgeId: { userId: u.id, badgeId: badge.id } },
      update: {},
      create: { userId: u.id, badgeId: badge.id }
    });
  }
  console.log("Seeded badges!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
