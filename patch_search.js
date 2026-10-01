const fs = require('fs');
const content = fs.readFileSync('src/app/search/page.tsx', 'utf8');

// 1. Add useMemo to imports if not there
let newContent = content.replace(/import \{([^}]+)\} from "react";/, (match, p1) => {
    if (!p1.includes('useMemo')) return `import { ${p1}, useMemo } from "react";`;
    return match;
});

// 2. Add state and useMemo inside SearchPage
const stateToAdd = `
  const [filterGame, setFilterGame] = useState<string>("ALL");
  const [filterSet, setFilterSet] = useState<string>("ALL");
  const [filterRarity, setFilterRarity] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("RELEVANCE");

  const processedResults = useMemo(() => {
    let res = [...results];
    if (filterGame !== "ALL") res = res.filter(r => (r as any).game?.toLowerCase() === filterGame.toLowerCase());
    if (filterSet !== "ALL") res = res.filter(r => r.setName === filterSet);
    if (filterRarity !== "ALL") res = res.filter(r => r.rarity === filterRarity);

    if (sortBy === "PRICE_ASC") res.sort((a, b) => (a.marketPrice || 0) - (b.marketPrice || 0));
    else if (sortBy === "PRICE_DESC") res.sort((a, b) => (b.marketPrice || 0) - (a.marketPrice || 0));
    else if (sortBy === "NAME_ASC") res.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "NAME_DESC") res.sort((a, b) => b.name.localeCompare(a.name));
    
    return res;
  }, [results, filterGame, filterSet, filterRarity, sortBy]);

  const uniqueGames = useMemo(() => Array.from(new Set(results.map(r => (r as any).game?.toLowerCase() || ""))).filter(Boolean), [results]);
  const uniqueSets = useMemo(() => Array.from(new Set(results.map(r => r.setName))).filter(Boolean).sort(), [results]);
  const uniqueRarities = useMemo(() => Array.from(new Set(results.map(r => r.rarity))).filter(Boolean).sort(), [results]);
`;

newContent = newContent.replace('const [added, setAdded] = useState<Record<string, boolean>>({});', 'const [added, setAdded] = useState<Record<string, boolean>>({});\n' + stateToAdd);

// 3. Render filters above results grid
const filtersUI = `
          {loading ? (
            <div className="text-center text-neutral-500 font-serif italic py-12">Scouring the archives...</div>
          ) : results.length > 0 ? (
            <>
              {results.length > 1 && (
                <div className="flex flex-wrap gap-4 mb-6">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
                  >
                    <option value="RELEVANCE">Sort: Relevance</option>
                    <option value="PRICE_DESC">Price: High to Low</option>
                    <option value="PRICE_ASC">Price: Low to High</option>
                    <option value="NAME_ASC">Name: A to Z</option>
                    <option value="NAME_DESC">Name: Z to A</option>
                  </select>
                  
                  {uniqueGames.length > 1 && (
                    <select 
                      value={filterGame}
                      onChange={(e) => setFilterGame(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
                    >
                      <option value="ALL">All Games</option>
                      {uniqueGames.map(g => (
                        <option key={g} value={g}>{g === 'mtg' ? 'Magic: The Gathering' : g === 'pokemon' ? 'Pokémon' : g}</option>
                      ))}
                    </select>
                  )}

                  {uniqueSets.length > 1 && (
                    <select 
                      value={filterSet}
                      onChange={(e) => setFilterSet(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
                    >
                      <option value="ALL">All Sets</option>
                      {uniqueSets.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}

                  {uniqueRarities.length > 1 && (
                    <select 
                      value={filterRarity}
                      onChange={(e) => setFilterRarity(e.target.value)}
                      className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
                    >
                      <option value="ALL">All Rarities</option>
                      {uniqueRarities.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {processedResults.length === 0 ? (
                <div className="py-20 text-center text-neutral-500 font-serif italic border border-white/5 rounded-xl bg-neutral-900/30">
                  No results match the selected filters.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {processedResults.map((card) => (
`;

newContent = newContent.replace(
  /\{\s*loading \? \([\s\S]*?Scouring the archives\.\.\.<\/div>\s*\)\s*:\s*results\.length > 0 \? \([\s\S]*?<div className="grid[^>]*>[\s\S]*?\{results\.map\(\(card\) => \(/,
  filtersUI
);

// Close the tag for the fragment we opened
newContent = newContent.replace(
  /<\/div>\s*\)\s*:\s*\(\s*<div className="py-20 text-center flex flex-col items-center justify-center opacity-50">/,
  `                </div>\n              )}\n            </>\n          ) : (\n            <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">`
);


fs.writeFileSync('src/app/search/page.tsx', newContent);
