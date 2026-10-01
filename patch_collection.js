const fs = require('fs');
const content = fs.readFileSync('src/app/collection/page.tsx', 'utf8');

let newContent = content.replace(
  /const displayedCards = activeGame === "both"\s*\? cards\s*: cards\.filter\(\(c\) => c\.Card\.game\.toLowerCase\(\) === activeGame\);/,
  `const displayedCards = useMemo(() => {
    let filtered = activeGame === "both"
      ? cards
      : cards.filter((c) => c.Card.game.toLowerCase() === activeGame);
      
    if (filterGame !== "ALL") {
      filtered = filtered.filter(c => c.Card.game.toUpperCase() === filterGame);
    }
    
    if (filterTag !== "ALL") {
      filtered = filtered.filter(c => {
        const notes = c.notes ? c.notes.toLowerCase() : "";
        const cond = c.condition ? c.condition.toLowerCase() : "";
        const tagLower = filterTag.toLowerCase();
        return notes.includes(tagLower) || cond === tagLower;
      });
    }

    if (sortBy === "PRICE_ASC") {
      filtered.sort((a, b) => getInstanceValue(a) - getInstanceValue(b));
    } else if (sortBy === "PRICE_DESC") {
      filtered.sort((a, b) => getInstanceValue(b) - getInstanceValue(a));
    } else if (sortBy === "NAME_ASC") {
      filtered.sort((a, b) => a.Card.name.localeCompare(b.Card.name));
    } else if (sortBy === "NAME_DESC") {
      filtered.sort((a, b) => b.Card.name.localeCompare(a.Card.name));
    } else if (sortBy === "NEWEST") {
      // Assuming original order is newest, or we could leave it
    }

    return filtered;
  }, [cards, activeGame, filterGame, filterTag, sortBy]);

  const uniqueGames = useMemo(() => Array.from(new Set(cards.map(c => c.Card.game.toUpperCase()))).filter(Boolean), [cards]);
  const uniqueTags = useMemo(() => {
    const tags = new Set<string>();
    cards.forEach(instance => {
      if (instance.notes) {
        instance.notes.split(",").forEach((note) => {
          const t = note.trim();
          if (t) tags.add(t);
        });
      }
      if (instance.condition) {
        tags.add(instance.condition);
      }
    });
    return Array.from(tags).sort();
  }, [cards]);
`
);

// We need to move getInstanceValue above displayedCards so it can be used in useMemo.
// Let's do that.
newContent = newContent.replace(
  /const getInstanceValue = \(instance: any\) => \{[\s\S]*?return instance\.Card\.marketPrice \|\| 0;\n  \};/,
  ''
);

newContent = newContent.replace(
  /const displayedCards = useMemo\(\(\) => \{/,
  `const getInstanceValue = (instance: any) => {
    if (instance.customPrice && instance.customPrice > 0) return instance.customPrice;
    const isReverse = instance.notes?.includes("Reverse Holo");
    if (isReverse && instance.Card.reversePrice && instance.Card.reversePrice > 0) return instance.Card.reversePrice;
    const isFoil = instance.notes?.includes("Foil");
    if (isFoil && instance.Card.foilPrice && instance.Card.foilPrice > 0) return instance.Card.foilPrice;
    return instance.Card.marketPrice || 0;
  };

  const displayedCards = useMemo(() => {`
);


// Now inject the UI for filters.
// Find the place where the grid is rendered or above it.
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

newContent = newContent.replace(
  /<div className="flex flex-wrap items-center gap-4 mb-6">/g,
  filterUI + '\n            <div className="flex flex-wrap items-center gap-4 mb-6">'
);


fs.writeFileSync('src/app/collection/page.tsx', newContent);
