const fs = require('fs');
let content = fs.readFileSync('src/app/profile/[username]/ProfileVaultClient.tsx', 'utf8');

// Add sortBy state
content = content.replace(
  /const \[activeTag, setActiveTag\] = useState<string>\("ALL"\);/,
  `const [activeTag, setActiveTag] = useState<string>("ALL");\n  const [sortBy, setSortBy] = useState<"NEWEST" | "PRICE_DESC" | "PRICE_ASC" | "NAME_ASC" | "NAME_DESC">("NEWEST");`
);

// We need to apply sorting to filteredVault
// We also need a way to get the price of a card in ProfileVaultClient.
// ProfileVaultClient fetches the vault. What does the vault item look like?
// getUserVault returns an array of instances.
// We can use the same logic for sorting.

const sortingLogic = `
  const sortedAndFilteredVault = useMemo(() => {
    let res = [...filteredVault];
    
    const getValue = (instance: any) => {
      if (instance.customPrice && instance.customPrice > 0) return instance.customPrice;
      const isReverse = instance.notes?.includes("Reverse Holo");
      if (isReverse && instance.Card.reversePrice && instance.Card.reversePrice > 0) return instance.Card.reversePrice;
      const isFoil = instance.notes?.includes("Foil");
      if (isFoil && instance.Card.foilPrice && instance.Card.foilPrice > 0) return instance.Card.foilPrice;
      return instance.Card.marketPrice || 0;
    };

    if (sortBy === "PRICE_ASC") {
      res.sort((a, b) => getValue(a) - getValue(b));
    } else if (sortBy === "PRICE_DESC") {
      res.sort((a, b) => getValue(b) - getValue(a));
    } else if (sortBy === "NAME_ASC") {
      res.sort((a, b) => a.Card.name.localeCompare(b.Card.name));
    } else if (sortBy === "NAME_DESC") {
      res.sort((a, b) => b.Card.name.localeCompare(a.Card.name));
    }
    
    return res;
  }, [filteredVault, sortBy]);
`;

content = content.replace(
  /return \(\n\s*<div className="mt-16 border-t border-white\/10 pt-16">/,
  sortingLogic + '\n  return (\n    <div className="mt-16 border-t border-white/10 pt-16">'
);

// We need uniqueGames to conditionally show the Game filter
content = content.replace(
  /const filteredVault = useMemo\(\(\) => \{/,
  `const uniqueGames = useMemo(() => Array.from(new Set(vault.map((c: any) => c.Card?.game?.toUpperCase()))).filter(Boolean), [vault]);\n\n  const filteredVault = useMemo(() => {`
);

// Now update the UI
const uiFilterGame = `
          {uniqueGames.length > 1 && (
            <select 
              value={activeGame}
              onChange={(e) => setActiveGame(e.target.value as any)}
              className="bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans text-[10px] uppercase tracking-widest focus:outline-none focus:border-white/30"
            >
              <option value="ALL">All Games</option>
              {uniqueGames.map(g => (
                <option key={g} value={g}>{g === 'MTG' ? 'Magic: The Gathering' : g === 'POKEMON' ? 'Pokémon' : g}</option>
              ))}
            </select>
          )}
`;

content = content.replace(
  /<select\s*value=\{activeGame\}[\s\S]*?<\/select>/,
  uiFilterGame
);

const uiSortBy = `
          {vault.length > 1 && (
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
`;

content = content.replace(
  /<div className="flex flex-col sm:flex-row gap-4">/,
  '<div className="flex flex-col sm:flex-row gap-4">\n' + uiSortBy
);

// Finally, use sortedAndFilteredVault instead of filteredVault in the map
content = content.replace(/\{filteredVault\.map/g, '{sortedAndFilteredVault.map');
content = content.replace(/filteredVault\.length === 0/g, 'sortedAndFilteredVault.length === 0');

fs.writeFileSync('src/app/profile/[username]/ProfileVaultClient.tsx', content);
