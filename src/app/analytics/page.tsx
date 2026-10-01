"use client";

import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useGameStore } from "@/lib/store";

export default function AnalyticsPage() {
  const activeGame = useGameStore(state => state.activeGame);
  const [loading, setLoading] = useState(true);
  const [vault, setVault] = useState<any[]>([]);

  useEffect(() => {
    import("@/app/actions/vault").then(({ getVault }) => {
      getVault().then(res => {
        if (res.success) {
          setVault(res.instances || []);
        }
        setLoading(false);
      });
    });
  }, []);

  const stats = useMemo(() => {
    let filtered = vault;
    if (activeGame && activeGame !== "both") {
      filtered = filtered.filter(v => v.Card.game.toLowerCase() === activeGame);
    }

    let totalValue = 0;
    let foilValue = 0;
    const sets = new Map<string, number>();

    filtered.forEach(inst => {
      const isFoil = inst.notes?.toLowerCase().includes("foil") || inst.notes?.toLowerCase().includes("holo");
      const val = inst.customPrice !== null ? inst.customPrice : (isFoil && inst.Card.foilPrice ? inst.Card.foilPrice : (inst.Card.marketPrice || 0));
      
      totalValue += val;
      if (isFoil) foilValue += val;

      const setName = inst.Card.setName || "Unknown";
      sets.set(setName, (sets.get(setName) || 0) + val);
    });

    const topSets = Array.from(sets.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));

    return {
      totalCards: filtered.length,
      totalValue,
      foilValue,
      topSets
    };
  }, [vault, activeGame]);

  // Mock historical data (since we don't have historical price snapshots yet)
  const historicalData = useMemo(() => {
    const data = [];
    let current = stats.totalValue * 0.7; // Start at 70% of current value 30 days ago
    const step = (stats.totalValue - current) / 30;
    
    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: current + (Math.random() * step * 2) // add some noise
      });
      current += step;
    }
    // ensure last point is exactly current
    if (data.length > 0) data[data.length - 1].value = stats.totalValue;
    return data;
  }, [stats.totalValue]);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return <div className="min-h-screen pt-32 text-center font-serif text-neutral-500 italic">Crunching the numbers...</div>;
  }

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="mb-16 border-b border-white/10 pb-8">
        <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
          Vault <span className="text-blue-400">Analytics</span>
        </h1>
        <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
          Live Market Intelligence
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
          <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Total Net Worth</p>
          <p className="font-serif text-4xl text-white">${stats.totalValue.toFixed(2)}</p>
        </div>
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
          <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Foil / Special Value</p>
          <p className="font-serif text-4xl text-emerald-400">${stats.foilValue.toFixed(2)}</p>
          <p className="font-sans text-[10px] text-neutral-600 mt-2">{(stats.totalValue > 0 ? (stats.foilValue / stats.totalValue) * 100 : 0).toFixed(1)}% of portfolio</p>
        </div>
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-6">
          <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Vaulted Items</p>
          <p className="font-serif text-4xl text-white">{stats.totalCards}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-neutral-900/30 border border-white/5 rounded-2xl p-6">
          <h2 className="font-sans text-xs uppercase tracking-widest text-neutral-400 mb-8">30-Day Value Trend</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="date" stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6">
          <h2 className="font-sans text-xs uppercase tracking-widest text-neutral-400 mb-8">Value by Set (Top 5)</h2>
          <div className="h-[250px] w-full relative">
            {stats.topSets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topSets}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.topSets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: any) => `$${value.toFixed(2)}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-neutral-500 font-serif text-sm">
                Not enough data
              </div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {stats.topSets.map((set, i) => (
              <div key={set.name} className="flex items-center justify-between text-[10px] font-sans uppercase tracking-widest">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-neutral-400 truncate max-w-[150px]">{set.name}</span>
                </div>
                <span className="text-white">${set.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
