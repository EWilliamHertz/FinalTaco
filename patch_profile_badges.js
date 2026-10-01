const fs = require('fs');

let content = fs.readFileSync('src/app/profile/[username]/page.tsx', 'utf8');

// Import getUserBadges
content = content.replace(
  'import { getUserProfile } from "@/app/actions/user";',
  'import { getUserProfile } from "@/app/actions/user";\nimport { getUserBadges } from "@/app/actions/gamification";'
);

// Fetch badges
content = content.replace(
  /const profile = await getUserProfile\(resolvedParams\.username\);/,
  `const profile = await getUserProfile(resolvedParams.username);\n  const badgesRes = await getUserBadges(resolvedParams.username);\n  const badges = badgesRes.success ? badgesRes.badges : [];`
);

// Display badges
const badgesUI = `
          {badges && badges.length > 0 && (
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-6">
              {badges.map((b: any) => (
                <div key={b.id} className="group relative flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <span className="text-[10px]">{b.icon || "🏆"}</span>
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-max max-w-[200px] bg-black border border-white/10 rounded p-2 z-50">
                    <p className="text-[10px] font-serif text-white mb-1">{b.name}</p>
                    <p className="text-[8px] font-sans text-neutral-400">{b.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
`;

content = content.replace(
  /<p className="font-sans text-xs uppercase tracking-widest text-neutral-400 mb-6">\s*Joined \{new Date\(profile\.createdAt\)\.toLocaleDateString\(\)\}\s*<\/p>/,
  `<p className="font-sans text-xs uppercase tracking-widest text-neutral-400 mb-4">\n            Joined {new Date(profile.createdAt).toLocaleDateString()}\n          </p>` + badgesUI
);

fs.writeFileSync('src/app/profile/[username]/page.tsx', content);

