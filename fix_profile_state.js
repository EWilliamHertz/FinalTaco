const fs = require('fs');

let proContent = fs.readFileSync('src/app/profile/[username]/ProfileVaultClient.tsx', 'utf8');

proContent = proContent.replace(
  /const \[activeGame, setActiveGame\] = useState<"ALL" \| "POKEMON" \| "MTG">("ALL");\n\s*const \[activeTag, setActiveTag\] = useState<string>\("ALL"\);/,
  `const [activeGames, setActiveGames] = useState<Set<string>>(new Set());
  const [filterConditions, setFilterConditions] = useState<Set<string>>(new Set());
  const [filterVariants, setFilterVariants] = useState<Set<string>>(new Set());`
);

// Also remove uniqueTags useMemo
proContent = proContent.replace(
  /const uniqueTags = useMemo\(\(\) => \{[\s\S]*?\}, \[vault\]\);/,
  ''
);

fs.writeFileSync('src/app/profile/[username]/ProfileVaultClient.tsx', proContent);

