const fs = require('fs');

let content = fs.readFileSync('src/app/feed/page.tsx', 'utf8');

// 1. Remove the "Or paste URL..." input
content = content.replace(
  /<input type="text" name="image" placeholder="Or paste URL\.\.\." className="bg-black\/50 border border-white\/10 rounded-lg px-3 text-xs text-white focus:outline-none font-sans w-24 sm:w-48" \/>\s*/g,
  ''
);

// 2. Change the layout from columns (masonry) to grid
content = content.replace(
  /<div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">/,
  '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">'
);

// 3. Remove break-inside-avoid from the post container since it's no longer masonry
content = content.replace(
  /className={`break-inside-avoid relative group rounded-2xl overflow-hidden/g,
  'className={`relative group rounded-2xl overflow-hidden'
);

fs.writeFileSync('src/app/feed/page.tsx', content);

