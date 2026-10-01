const fs = require('fs');
let content = fs.readFileSync('src/app/collection/page.tsx', 'utf8');

const marketPulseUI = `          <div className="bg-neutral-900/30 border border-white/5 rounded-2xl p-6 flex flex-col min-h-[300px]">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className={\`w-5 h-5 \${brandColor}\`} />
              <h3 className="font-serif text-white text-lg">Market Pulse</h3>
            </div>

            {vault.length < 50 ? (
              <div className="flex-1 flex flex-col items-center justify-center opacity-50 text-center px-4">
                <Lock className="w-8 h-8 text-neutral-500 mb-3" />
                <p className="font-sans text-[10px] uppercase tracking-[0.2em] text-neutral-400">Unlock at 50 Cards</p>
                <p className="font-serif text-xs text-neutral-500 mt-2">Currently at {vault.length}/50</p>
                <div className="w-full bg-black rounded-full h-1 mt-4 overflow-hidden">
                  <div className={\`h-full \${brandColor} opacity-50\`} style={{ width: \`\${(vault.length / 50) * 100}%\` }} />
                </div>
              </div>
            ) : (
              <div className="space-y-6 flex-1">
                <div>
                  <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-1">Portfolio Value</p>
                  <p className={\`font-serif text-3xl \${brandColor}\`}>
                    \${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-sans text-xs text-neutral-400">Total Cards</span>
                    <span className="font-serif text-white">{displayedCards.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-sans text-xs text-neutral-400">Unique Cards</span>
                    <span className="font-serif text-white">{new Set(displayedCards.map(c => c.cardId)).size}</span>
                  </div>
                </div>

                {displayedCards.length > 0 && (
                  <div className="pt-4 border-t border-white/5">
                    <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-3">Top Asset</p>
                    {(() => {
                      const topCard = [...displayedCards].sort((a, b) => getInstanceValue(b) - getInstanceValue(a))[0];
                      return topCard ? (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-14 bg-black rounded shrink-0 relative overflow-hidden border border-white/10">
                            {topCard.Card.imageUrl && <Image src={proxiedImage(topCard.Card.imageUrl)!} alt={topCard.Card.name} fill className="object-cover" unoptimized />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-serif text-white text-xs truncate">{topCard.Card.name}</h4>
                            <p className={\`font-serif text-[10px] \${brandColor}\`}>
                              \${getInstanceValue(topCard).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>`;

content = content.replace(
  /<div className="bg-neutral-900\/30 border border-white\/5 rounded-2xl p-8 flex flex-col items-center justify-center min-h-\[300px\]">\s*<TrendingUp className=\{`w-12 h-12 \$\{brandColor\} mb-4 opacity-50`\} \/>\s*<p className="font-serif text-neutral-400 italic text-lg mb-2 text-center">Market Pulse<\/p>\s*<p className="font-sans text-\[9px\] text-center uppercase tracking-\[0\.2em\] text-neutral-500">Analytics unlock at 50 cards<\/p>\s*<\/div>/,
  marketPulseUI
);

// We need to import Lock from lucide-react
if (!content.includes('Lock,')) {
  content = content.replace('TrendingUp,', 'TrendingUp, Lock,');
}

fs.writeFileSync('src/app/collection/page.tsx', content);
