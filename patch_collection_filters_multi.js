const fs = require('fs');
let content = fs.readFileSync('src/app/collection/page.tsx', 'utf8');

// Add import for MultiSelect
content = content.replace(
  'import { getVault, removeFromVault } from "@/app/actions/vault";',
  'import { getVault, removeFromVault } from "@/app/actions/vault";\nimport { MultiSelect } from "@/components/MultiSelect";'
);

// Update states
content = content.replace(
  /const \[filterGame, setFilterGame\] = useState<"ALL" \| "POKEMON" \| "MTG">("ALL");\n\s*const \[filterTag, setFilterTag\] = useState\("ALL"\);/,
  `const [filterGames, setFilterGames] = useState<Set<string>>(new Set());
  const [filterConditions, setFilterConditions] = useState<Set<string>>(new Set());
  const [filterVariants, setFilterVariants] = useState<Set<string>>(new Set());`
);

// Update filtering logic
content = content.replace(
  /if \(filterGame !== "ALL"\) \{\s*filtered = filtered\.filter\(c => c\.Card\.game\.toUpperCase\(\) === filterGame\);\s*\}/,
  `if (filterGames.size > 0) {
      filtered = filtered.filter(c => filterGames.has(c.Card.game.toUpperCase()));
    }`
);

content = content.replace(
  /if \(filterTag !== "ALL"\) \{\s*filtered = filtered\.filter\(c => \{\s*const notes = c\.notes \? c\.notes\.toLowerCase\(\) : "";\s*const cond = c\.condition \? c\.condition\.toLowerCase\(\) : "";\s*const tagLower = filterTag\.toLowerCase\(\);\s*return notes\.includes\(tagLower\) \|\| cond === tagLower;\s*\}\);\s*\}/,
  `if (filterConditions.size > 0) {
      filtered = filtered.filter(c => c.condition && filterConditions.has(c.condition));
    }
    if (filterVariants.size > 0) {
      filtered = filtered.filter(c => {
        if (!c.notes) return false;
        const notesArr = c.notes.split(",").map(n => n.trim());
        return Array.from(filterVariants).some(v => notesArr.includes(v));
      });
    }`
);

content = content.replace(/\[cards, activeGame, filterGame, filterTag, sortBy\]/, `[cards, activeGame, filterGames, filterConditions, filterVariants, sortBy]`);


// Replace uniqueTags with uniqueConditions and uniqueVariants
content = content.replace(
  /const uniqueTags = useMemo\(\(\) => \{[\s\S]*?return Array\.from\(tags\)\.sort\(\);\n  \}, \[cards\]\);/,
  `const uniqueConditions = useMemo(() => {
    const conditions = new Set<string>();
    cards.forEach(instance => {
      if (instance.condition) conditions.add(instance.condition);
    });
    return Array.from(conditions).sort();
  }, [cards]);

  const uniqueVariants = useMemo(() => {
    const variants = new Set<string>();
    cards.forEach(instance => {
      if (instance.notes) {
        instance.notes.split(",").forEach((note) => {
          const t = note.trim();
          if (t) variants.add(t);
        });
      }
    });
    return Array.from(variants).sort();
  }, [cards]);`
);

// Update UI
content = content.replace(
  /\{uniqueGames\.length > 1 && activeGame === "both" && \([\s\S]*?<\/select>\n\s*\)\}/,
  `{uniqueGames.length > 1 && activeGame === "both" && (
                  <MultiSelect 
                    options={uniqueGames}
                    selected={filterGames}
                    onChange={setFilterGames}
                    placeholder="All Games"
                    formatOption={(g) => g === 'MTG' ? 'Magic: The Gathering' : g === 'POKEMON' ? 'Pokémon' : g}
                  />
                )}`
);

content = content.replace(
  /\{uniqueTags\.length > 1 && \([\s\S]*?<\/select>\n\s*\)\}/,
  `{uniqueConditions.length > 1 && (
                  <MultiSelect 
                    options={uniqueConditions}
                    selected={filterConditions}
                    onChange={setFilterConditions}
                    placeholder="All Conditions"
                    formatOption={(c) => c.replace(/_/g, ' ')}
                  />
                )}
                {uniqueVariants.length > 1 && (
                  <MultiSelect 
                    options={uniqueVariants}
                    selected={filterVariants}
                    onChange={setFilterVariants}
                    placeholder="All Variants"
                  />
                )}`
);

fs.writeFileSync('src/app/collection/page.tsx', content);
