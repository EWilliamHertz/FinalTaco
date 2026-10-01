const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = null; // Simulating no user
  try {
    const posts = await prisma.post.findMany({
      skip: 0,
      take: 12,
      orderBy: { createdAt: "desc" },
      include: {
        Author: {
          select: { username: true, avatarUrl: true }
        },
        Comments: {
          include: {
            Author: { select: { username: true, avatarUrl: true } }
          },
          orderBy: { createdAt: "asc" }
        },
        PostLikes: user ? {
          where: { userId: user.id }
        } : false
      }
    });
    console.log("Posts returned without user:", posts.length);
  } catch (err) {
    console.error("ERROR in query:", err.message);
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
