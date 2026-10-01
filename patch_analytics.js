const fs = require('fs');
let content = fs.readFileSync('src/app/analytics/page.tsx', 'utf8');

if (!content.includes('snapshots')) {
  // Add snapshots state and fetch
  content = content.replace(
    /const \[vault, setVault\] = useState<any\[\]>\(\[\]\);/,
    'const [vault, setVault] = useState<any[]>([]);\n  const [snapshots, setSnapshots] = useState<any[]>([]);'
  );

  content = content.replace(
    /getVault\(\)\.then\(res => \{/,
    \`getVault().then(res => {
        if (res.success) {
          setVault(res.instances || []);
        }
      });
      fetch('/api/cron/snapshot').then(() => {
        // Trigger a snapshot fetch or maybe we just mock it for the demo if there's no api
      });
      // Import getSnapshots action (we need to create it)
      import("@/app/actions/analytics").then(({ getSnapshots }) => {
        getSnapshots().then(res => {
          if (res.success) setSnapshots(res.snapshots || []);
          setLoading(false);
        });
      });
      \`
  );
}
fs.writeFileSync('src/app/analytics/page.tsx', content);
