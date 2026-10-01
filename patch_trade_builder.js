const fs = require('fs');
let content = fs.readFileSync('src/app/trades/new/TradeBuilderClient.tsx', 'utf8');

content = content.replace(
  /if \(targetVaultRes\.success && myVaultRes\.success\) \{[\s\S]*?setTheirVault\(targetVaultRes\.instances \|\| \[\]\);/m,
  \`if (Array.isArray(targetVaultRes) && myVaultRes.success) {
        setTargetUser(profileRes);
        setTheirVault(targetVaultRes);\`);

fs.writeFileSync('src/app/trades/new/TradeBuilderClient.tsx', content);
