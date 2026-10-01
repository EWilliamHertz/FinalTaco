const fs = require('fs');

let proContent = fs.readFileSync('src/app/profile/[username]/ProfileVaultClient.tsx', 'utf8');

proContent = proContent.replace(
  /\{uniqueTags\.length > 0 && \([\s\S]*?<\/select>\n\s*\)\}/,
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

// We also need to remove activeTag usage if it's still there
// wait, we replaced the useMemo for filteredVault already so activeTag should be unused, 
// let's just make sure activeTag state is gone.

fs.writeFileSync('src/app/profile/[username]/ProfileVaultClient.tsx', proContent);

