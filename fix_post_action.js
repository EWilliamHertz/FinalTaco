const fs = require('fs');
let postActions = fs.readFileSync('src/app/actions/post.ts', 'utf8');

postActions = postActions.replace(
  /export async function getPosts\(skip = 0, take = 12\) \{[\s\S]*?orderBy: \{ createdAt: "desc" \} as any\n\s*\};/m,
  \`export async function getPosts(skip = 0, take = 12, feedType: "GLOBAL" | "FOLLOWING" = "GLOBAL") {
  const user = await getCurrentUser();
  let whereClause = {};

  if (feedType === "FOLLOWING" && user) {
    const following = await prisma.follows.findMany({
      where: { followerId: user.id },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);
    followingIds.push(user.id);

    whereClause = { authorId: { in: followingIds } };
  }

  const query = {
    where: whereClause,
    skip,
    take,
    include: {
      Author: { select: { id: true, username: true, avatarUrl: true, role: true } },
      PostLikes: true,
      Comments: {
        include: { Author: { select: { id: true, username: true, avatarUrl: true } } },
        orderBy: { createdAt: "asc" } as any
      }
    },
    orderBy: { createdAt: "desc" as any }
  };\`);

// Also it looks like I need to replace the try catch block and prisma.post.findMany
fs.writeFileSync('src/app/actions/post.ts', postActions);
