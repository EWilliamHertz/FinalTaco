const fs = require('fs');
let content = fs.readFileSync('src/app/trades/page.tsx', 'utf8');

const headerReplacement = \`<div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
            Trade <span className="text-purple-400">Center</span>
          </h1>
          <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
            Manage your incoming and outgoing offers
          </p>
        </div>
        <Link href="/trades/new" className="px-8 py-3 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest">
          Start Trade
        </Link>
      </div>\`;

content = content.replace(
  /<div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white\/10 pb-8">[\s\S]*?<\/div>/,
  headerReplacement
);

fs.writeFileSync('src/app/trades/page.tsx', content);
