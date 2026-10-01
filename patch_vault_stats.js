const fs = require('fs');
let content = fs.readFileSync('src/app/actions/vault.ts', 'utf8');

// Replace value calculation in getVaultStats
content = content.replace(
  /const value = instances\.reduce\(\(acc, inst\) => \{[\s\S]*?\}, 0\);/,
  \`const value = instances.reduce((acc, inst) => {
      if (inst.customPrice && inst.customPrice > 0) return acc + inst.customPrice;
      const isReverse = inst.notes?.includes("Reverse Holo");
      if (isReverse && inst.Card.reversePrice && inst.Card.reversePrice > 0) return acc + inst.Card.reversePrice;
      const isFoil = inst.notes?.includes("Foil");
      if (isFoil && inst.Card.foilPrice && inst.Card.foilPrice > 0) return acc + inst.Card.foilPrice;
      return acc + (inst.Card.marketPrice || 0);
    }, 0);\`
);

// We must ensure reversePrice is selected from DB!
content = content.replace(
  /select: \{ marketPrice: true, foilPrice: true \}/,
  \`select: { marketPrice: true, foilPrice: true, reversePrice: true }\`
);

fs.writeFileSync('src/app/actions/vault.ts', content);
