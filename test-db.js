const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const posts = await prisma.post.findMany();
  console.log("Posts count:", posts.length);
  const users = await prisma.user.findMany();
  console.log("Users:", users.map(u => ({ email: u.email, role: u.role })));
}
main().catch(console.error).finally(() => prisma.$disconnect());
