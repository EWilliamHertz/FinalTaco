const fs = require('fs');
let content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

// Add links to Quick Links
const newLinks = \`
              <Link href="/messages" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors text-blue-400">Messages</Link>
              <Link href="/groups" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors text-pink-400">Groups</Link>
              <Link href="/auctions" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors text-orange-400">Auctions</Link>
              <Link href="/leaderboard" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors text-yellow-400">Leaderboard</Link>
\`;

content = content.replace(
  /<Link href="\/market" onClick=\{\(\) => setSidebarOpen\(false\)\} className="p-3 hover:bg-white\/5 rounded-lg transition-colors">Market<\/Link>/,
  '<Link href="/market" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors">Market</Link>' + newLinks
);

fs.writeFileSync('src/components/Navigation.tsx', content);
