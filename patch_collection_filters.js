const fs = require('fs');
let content = fs.readFileSync('src/app/collection/page.tsx', 'utf8');

const filterUI = `
            {cards.length > 0 && (
              <div className="flex flex-wrap gap-4 mb-6">
                {cards.length > 1 && (
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
                  >
                    <option value="NEWEST">Sort: Newest</option>
                    <option value="PRICE_DESC">Price: High to Low</option>
                    <option value="PRICE_ASC">Price: Low to High</option>
                    <option value="NAME_ASC">Name: A to Z</option>
                    <option value="NAME_DESC">Name: Z to A</option>
                  </select>
                )}

                {uniqueGames.length > 1 && activeGame === "both" && (
                  <select 
                    value={filterGame}
                    onChange={(e) => setFilterGame(e.target.value as any)}
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
                  >
                    <option value="ALL">All Games</option>
                    {uniqueGames.map(g => (
                      <option key={g} value={g}>{g === 'MTG' ? 'Magic: The Gathering' : g === 'POKEMON' ? 'Pokémon' : g}</option>
                    ))}
                  </select>
                )}

                {uniqueTags.length > 1 && (
                  <select 
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
                  >
                    <option value="ALL">All Variants & Conditions</option>
                    {uniqueTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
`;

content = content.replace(
  /<div className="flex items-center justify-between mb-6">/g,
  filterUI + '\n          <div className="flex items-center justify-between mb-6">'
);

fs.writeFileSync('src/app/collection/page.tsx', content);
