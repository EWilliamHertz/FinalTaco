const fs = require('fs');
let content = fs.readFileSync('src/components/Navigation.tsx', 'utf8');

// Add Trades link
content = content.replace(
  /<Link href="\/market" onClick=\{.* className="p-3 hover:bg-white\/5 rounded-lg transition-colors">Market<\/Link>/,
  '<Link href="/trades" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors text-purple-400">Trade Center</Link>\n              <Link href="/market" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors">Market</Link>'
);

// Add Public Profile link
content = content.replace(
  /<Link href="\/collection" onClick=\{.* className="p-3 hover:bg-white\/5 rounded-lg transition-colors">Collection<\/Link>/,
  '<Link href="/collection" onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors">Collection</Link>\n              {user && <Link href={`/profile/${user.username}`} onClick={() => setSidebarOpen(false)} className="p-3 hover:bg-white/5 rounded-lg transition-colors">My Profile</Link>}'
);

fs.writeFileSync('src/components/Navigation.tsx', content);
