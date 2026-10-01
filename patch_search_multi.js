const fs = require('fs');
let content = fs.readFileSync('src/app/search/page.tsx', 'utf8');

content = content.replace(
  'import { addToVault } from "@/app/actions/vault";',
  'import { addToVault } from "@/app/actions/vault";\nimport { MultiSelect } from "@/components/MultiSelect";'
);

content = content.replace(
  /const \[filterGame, setFilterGame\] = useState<string>\("ALL"\);\n\s*const \[filterSet, setFilterSet\] = useState<string>\("ALL"\);\n\s*const \[filterRarity, setFilterRarity\] = useState<string>\("ALL"\);/,
  `const [filterGames, setFilterGames] = useState<Set<string>>(new Set());
  const [filterSets, setFilterSets] = useState<Set<string>>(new Set());
  const [filterRarities, setFilterRarities] = useState<Set<string>>(new Set());`
);


content = content.replace(
  /if \(filterGame !== "ALL"\) res = res\.filter\(r => \(r as any\)\.game\?\.toLowerCase\(\) === filterGame\.toLowerCase\(\)\);\n\s*if \(filterSet !== "ALL"\) res = res\.filter\(r => r\.setName === filterSet\);\n\s*if \(filterRarity !== "ALL"\) res = res\.filter\(r => r\.rarity === filterRarity\);/,
  `if (filterGames.size > 0) res = res.filter(r => (r as any).game && filterGames.has((r as any).game.toUpperCase()));
    if (filterSets.size > 0) res = res.filter(r => filterSets.has(r.setName));
    if (filterRarities.size > 0) res = res.filter(r => r.rarity && filterRarities.has(r.rarity));`
);

content = content.replace(/\[results, filterGame, filterSet, filterRarity, sortBy\]/, `[results, filterGames, filterSets, filterRarities, sortBy]`);


content = content.replace(
  /const uniqueGames = useMemo\(\(\) => Array\.from\(new Set\(results\.map\(r => \(r as any\)\.game\?\.toLowerCase\(\) \|\| ""\)\)\)\.filter\(Boolean\), \[results\]\);/,
  `const uniqueGames = useMemo(() => Array.from(new Set(results.map(r => (r as any).game?.toUpperCase() || ""))).filter(Boolean), [results]);`
);


// UI
content = content.replace(
  /\{uniqueGames\.length > 1 && \([\s\S]*?<\/select>\n\s*\)\}/,
  `{uniqueGames.length > 1 && (
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
  /\{uniqueSets\.length > 1 && \([\s\S]*?<\/select>\n\s*\)\}/,
  `{uniqueSets.length > 1 && (
                    <MultiSelect 
                      options={uniqueSets}
                      selected={filterSets}
                      onChange={setFilterSets}
                      placeholder="All Sets"
                    />
                  )}`
);

content = content.replace(
  /\{uniqueRarities\.length > 1 && \([\s\S]*?<\/select>\n\s*\)\}/,
  `{uniqueRarities.length > 1 && (
                    <MultiSelect 
                      options={uniqueRarities}
                      selected={filterRarities}
                      onChange={setFilterRarities}
                      placeholder="All Rarities"
                    />
                  )}`
);

fs.writeFileSync('src/app/search/page.tsx', content);
