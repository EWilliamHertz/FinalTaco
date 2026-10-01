const fs = require('fs');
let content = fs.readFileSync('src/app/actions/user.ts', 'utf8');

// Add searchUsers function
content += \`
export async function searchUsers(query: string) {
  if (!query) return [];
  try {
    const users = await prisma.user.findMany({
      where: {
        username: {
          startsWith: query,
          mode: 'insensitive'
        }
      },
      select: { username: true, avatarUrl: true },
      take: 5
    });
    return users;
  } catch (e) {
    return [];
  }
}
\`;

// Fix getUserProfile case-sensitivity by using findFirst
content = content.replace(
  /findUnique\(\{\s*where: \{ username \}/,
  \`findFirst({
      where: { username: { equals: username, mode: 'insensitive' } }\`
);

content = content.replace(
  /findUnique\(\{\s*where: \{ username \}/,
  \`findFirst({
      where: { username: { equals: username, mode: 'insensitive' } }\`
);


fs.writeFileSync('src/app/actions/user.ts', content);
