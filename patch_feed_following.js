const fs = require('fs');
let postActions = fs.readFileSync('src/app/actions/post.ts', 'utf8');

postActions = postActions.replace(
  /export async function getPosts\(skip = 0, take = 10\) \{[\s\S]*?orderBy: \{ createdAt: "desc" \}\s*\n\s*\};/,
  `export async function getPosts(skip = 0, take = 10, feedType: "GLOBAL" | "FOLLOWING" = "GLOBAL") {
  const user = await getCurrentUser();
  let whereClause = {};

  if (feedType === "FOLLOWING" && user) {
    const following = await prisma.follows.findMany({
      where: { followerId: user.id },
      select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);
    followingIds.push(user.id); // include own posts

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
  };`
);
fs.writeFileSync('src/app/actions/post.ts', postActions);

let feedPage = fs.readFileSync('src/app/feed/page.tsx', 'utf8');

feedPage = feedPage.replace(
  /const \[hasMore, setHasMore\] = useState\(true\);\n  const \[loadingMore, setLoadingMore\] = useState\(false\);/,
  `const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [feedType, setFeedType] = useState<"GLOBAL" | "FOLLOWING">("GLOBAL");`
);

feedPage = feedPage.replace(
  /const initialPosts = await getPosts\(0, TAKE\);/,
  `const initialPosts = await getPosts(0, TAKE, feedType);`
);

feedPage = feedPage.replace(
  /const morePosts = await getPosts\(skip, TAKE\);/,
  `const morePosts = await getPosts(skip, TAKE, feedType);`
);

feedPage = feedPage.replace(
  /fetchInitial\(\);\n  \}, \[fetchInitial\]\);/,
  `fetchInitial();\n  }, [fetchInitial, feedType]);`
);

// Add the feed toggle UI
const feedToggleUI = `
      <div className="flex justify-center mb-12">
        <div className="bg-neutral-900/50 border border-white/10 rounded-full p-1 flex">
          <button 
            onClick={() => { setFeedType("GLOBAL"); setSkip(0); }}
            className={\`px-6 py-2 rounded-full font-sans text-[10px] uppercase tracking-widest transition-colors \${feedType === "GLOBAL" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}\`}
          >
            Global Feed
          </button>
          <button 
            onClick={() => { setFeedType("FOLLOWING"); setSkip(0); }}
            className={\`px-6 py-2 rounded-full font-sans text-[10px] uppercase tracking-widest transition-colors \${feedType === "FOLLOWING" ? "bg-white text-black" : "text-neutral-500 hover:text-white"}\`}
          >
            Following
          </button>
        </div>
      </div>
`;

feedPage = feedPage.replace(
  /<div className="max-w-2xl mx-auto mb-16">/,
  feedToggleUI + '\n      <div className="max-w-2xl mx-auto mb-16">'
);

fs.writeFileSync('src/app/feed/page.tsx', feedPage);
