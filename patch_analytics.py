import re

with open('src/app/analytics/page.tsx', 'r') as f:
    content = f.read()

if 'snapshots' not in content:
    content = content.replace(
        'const [vault, setVault] = useState<any[]>([]);',
        'const [vault, setVault] = useState<any[]>([]);\n  const [snapshots, setSnapshots] = useState<any[]>([]);'
    )
    
    fetch_logic = """
    import("@/app/actions/vault").then(({ getVault }) => {
      getVault().then(res => {
        if (res.success) {
          setVault(res.instances || []);
        }
      });
    });
    
    import("@/app/actions/analytics").then(({ getSnapshots }) => {
      getSnapshots().then(res => {
        if (res.success) {
          setSnapshots(res.snapshots || []);
        }
        setLoading(false);
      });
    });
"""
    content = re.sub(r'import\("@\/app\/actions\/vault"\)\.then\(\(\{ getVault \}\) => \{[\s\S]*?setLoading\(false\);\s*\}\);\s*\}\);', fetch_logic, content)

    chart_logic = """
          {snapshots.length > 1 && (
            <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6 lg:col-span-3">
              <h3 className="font-sans text-xs uppercase tracking-widest text-neutral-500 mb-6">Portfolio Growth (History)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={snapshots.map(s => ({ name: new Date(s.createdAt).toLocaleDateString(), value: s.totalValue }))}>
                    <defs>
                      <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff30" fontSize={10} tickMargin={10} />
                    <YAxis stroke="#ffffff30" fontSize={10} tickFormatter={(v) => `$${v}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#000000', borderColor: '#ffffff20', borderRadius: '8px' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
"""
    # Insert chart before closing main tag
    content = content.replace('</main>', chart_logic + '\n    </main>')

with open('src/app/analytics/page.tsx', 'w') as f:
    f.write(content)
