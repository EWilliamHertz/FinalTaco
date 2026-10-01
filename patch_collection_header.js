const fs = require('fs');
let content = fs.readFileSync('src/app/collection/page.tsx', 'utf8');

// Remove the top cards/est. value header
content = content.replace(
  /<div className="flex gap-12 font-serif">\s*<div className="flex flex-col">\s*<span className="text-3xl text-white">\{displayedCards\.length\}<\/span>\s*<span className="text-xs text-neutral-500 uppercase tracking-widest font-sans">Cards<\/span>\s*<\/div>\s*<div className="flex flex-col">\s*<span className=\{`text-3xl \$\{brandColor\}`\}>\$\{totalValue\.toFixed\(2\)\}<\/span>\s*<span className="text-xs text-neutral-500 uppercase tracking-widest font-sans">Est\. Value<\/span>\s*<\/div>\s*<\/div>/,
  ''
);

// Reduce 50 to 0 (so it's always unlocked). 
// Wait, if we change `cards.length < 50` to `cards.length < 0`, it will never be true, which unlocks it immediately.
content = content.replace(/\{cards\.length < 50 \?/g, '{cards.length < 0 ?');

fs.writeFileSync('src/app/collection/page.tsx', content);
