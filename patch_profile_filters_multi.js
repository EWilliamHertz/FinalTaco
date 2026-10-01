const fs = require('fs');
let content = fs.readFileSync('src/app/profile/[username]/ProfileVaultClient.tsx', 'utf8');

// Add import
content = content.replace(
  'import { proxiedImage } from "@/lib/images";',
  'import { proxiedImage } from "@/lib/images";\nimport { MultiSelect } from "@/components/MultiSelect";'
);

// Update state
content = content.replace(
  /const \[activeGame, setActiveGame\] = useState<"ALL" \| "POKEMON" \| "MTG">("ALL");\n  const \[activeTag, setActiveTag\] = useState<string>\("ALL"\);/,
  `const [activeGames, setActiveGames] = useState<Set<string>>(new Set());
  const [filterConditions, setFilterConditions] = useState<Set<string>>(new Set());
  const [filterVariants, setFilterVariants] = useState<Set<string>>(new Set());`
);

// Update fetch
content = content.replace(
  /getUserVault\(username, activeGame === "ALL" \? undefined : activeGame\)\.then\(data => \{/,
  `getUserVault(username, undefined).then(data => {`
);

// Fix dependencies
content = content.replace(
  /\[username, activeGame\]/,
  `[username]`
);


// Replace uniqueTags with uniqueConditions and uniqueVariants
content = content.replace(
  /const uniqueTags = useMemo\(\(\) => \{[\s\S]*?return Array\.from\(tags\)\.sort\(\);\n  \}, \[vault\]\);/,
  `const uniqueConditions = useMemo(() => {
    const conditions = new Set<string>();
    vault.forEach(instance => {
      if (instance.condition) conditions.add(instance.condition);
    });
    return Array.from(conditions).sort();
  }, [vault]);

  const uniqueVariants = useMemo(() => {
    const variants = new Set<string>();
    vault.forEach(instance => {
      if (instance.notes) {
        instance.notes.split(",").forEach((note: string) => {
          const t = note.trim();
          if (t) variants.add(t);
        });
      }
    });
    return Array.from(variants).sort();
  }, [vault]);`
);


// Update filter logic
content = content.replace(
  /const filteredVault = useMemo\(\(\) => \{\s*if \(activeTag === "ALL"\) return vault;\s*return vault\.filter\(instance => \{\s*const notes = instance\.notes \? instance\.notes\.toLowerCase\(\) : "";\s*const cond = instance\.condition \? instance\.condition\.toLowerCase\(\) : "";\s*const tagLower = activeTag\.toLowerCase\(\);\s*return notes\.includes\(tagLower\) \|\| cond === tagLower;\s*\}\);\s*\}, \[vault, activeTag\]\);/,
  `const filteredVault = useMemo(() => {
    let filtered = [...vault];
    if (activeGames.size > 0) {
      filtered = filtered.filter(c => activeGames.has(c.Card.game.toUpperCase()));
    }
    if (filterConditions.size > 0) {
      filtered = filtered.filter(c => c.condition && filterConditions.has(c.condition));
    }
    if (filterVariants.size > 0) {
      filtered = filtered.filter(c => {
        if (!c.notes) return false;
        const notesArr = c.notes.split(",").map((n: string) => n.trim());
        return Array.from(filterVariants).some(v => notesArr.includes(v));
      });
    }
    return filtered;
  }, [vault, activeGames, filterConditions, filterVariants]);`
);


// UI
content = content.replace(
  /\{uniqueGames\.length > 1 && \([\s\S]*?<\/select>\n\s*\)\}/,
  `{uniqueGames.length > 1 && (
            <MultiSelect 
              options={uniqueGames}
              selected={activeGames}
              onChange={setActiveGames}
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

fs.writeFileSync('src/app/profile/[username]/ProfileVaultClient.tsx', content);
