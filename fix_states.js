const fs = require('fs');

let colContent = fs.readFileSync('src/app/collection/page.tsx', 'utf8');
colContent = colContent.replace(
  /const \[filterGame, setFilterGame\] = useState<"ALL" \| "POKEMON" \| "MTG">("ALL");\n\s*const \[filterTag, setFilterTag\] = useState\("ALL"\);/,
  `const [filterGames, setFilterGames] = useState<Set<string>>(new Set());
  const [filterConditions, setFilterConditions] = useState<Set<string>>(new Set());
  const [filterVariants, setFilterVariants] = useState<Set<string>>(new Set());`
);
fs.writeFileSync('src/app/collection/page.tsx', colContent);

let proContent = fs.readFileSync('src/app/profile/[username]/ProfileVaultClient.tsx', 'utf8');
proContent = proContent.replace(
  /const \[activeGame, setActiveGame\] = useState<"ALL" \| "POKEMON" \| "MTG">("ALL");\n\s*const \[activeTag, setActiveTag\] = useState<string>\("ALL"\);/,
  `const [activeGames, setActiveGames] = useState<Set<string>>(new Set());
  const [filterConditions, setFilterConditions] = useState<Set<string>>(new Set());
  const [filterVariants, setFilterVariants] = useState<Set<string>>(new Set());`
);

// Also uniqueTags in ProfileVaultClient needs to be removed from the UI block since it was replaced by uniqueConditions and uniqueVariants
proContent = proContent.replace(
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

fs.writeFileSync('src/app/profile/[username]/ProfileVaultClient.tsx', proContent);

