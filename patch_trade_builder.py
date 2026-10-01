import re

with open('src/app/trades/new/TradeBuilderClient.tsx', 'r') as f:
    content = f.read()

# Add imports for autocomplete
if 'searchUsers' not in content:
    content = content.replace(
        'import { getUserProfile } from "@/app/actions/user";',
        'import { getUserProfile, searchUsers } from "@/app/actions/user";\nimport { useEffect } from "react";'
    )

# Add search state
search_state = """
  const [targetUsername, setTargetUsername] = useState("");
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (targetUsername.trim().length > 1) {
      searchUsers(targetUsername).then(users => {
        setUserSuggestions(users);
        setShowSuggestions(true);
      });
    } else {
      setUserSuggestions([]);
      setShowSuggestions(false);
    }
  }, [targetUsername]);
"""
content = re.sub(r'const \[targetUsername, setTargetUsername\] = useState\(""\);', search_state, content)

# Update form for autocomplete
form_ui = """
      <div className="max-w-md mx-auto mt-20">
        <h2 className="font-serif text-2xl text-white mb-6">Select Trading Partner</h2>
        <form onSubmit={handleLoadUser} className="flex flex-col gap-4 relative">
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="Username..." 
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className="flex-1 bg-neutral-900/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white/30 font-serif"
            />
            <button 
              type="submit" 
              disabled={loadingUser || !targetUsername.trim()}
              className="px-6 py-3 bg-white text-black hover:bg-neutral-200 transition-colors rounded-lg font-sans text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loadingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : "Next"}
            </button>
          </div>
          {showSuggestions && userSuggestions.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-neutral-900 border border-white/10 rounded-lg overflow-hidden z-50 shadow-xl">
              {userSuggestions.map(su => (
                <div 
                  key={su.username} 
                  className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3"
                  onClick={() => {
                    setTargetUsername(su.username);
                    setShowSuggestions(false);
                  }}
                >
                  <div className="w-6 h-6 rounded-full bg-black overflow-hidden">
                    {su.avatarUrl && <img src={su.avatarUrl} alt="avatar" className="w-full h-full object-cover" />}
                  </div>
                  <span className="font-serif text-white">{su.username}</span>
                </div>
              ))}
            </div>
          )}
        </form>
      </div>
"""
content = re.sub(r'<div className="max-w-md mx-auto mt-20">[\s\S]*?<\/div>', form_ui, content, count=1)

# Center the search text
content = content.replace(
    'className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white font-sans text-xs focus:outline-none focus:border-white/30"',
    'className="w-full bg-black/50 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-white font-sans text-xs text-center focus:outline-none focus:border-white/30"'
)

# Update renderVault to group cards
render_vault_replacement = """
  const renderVault = (instances: any[], isMine: boolean) => {
    const selectedSet = isMine ? offeredIds : requestedIds;
    const setFn = isMine ? setOfferedIds : setRequestedIds;

    // Group by Card.id
    const groupsMap: Record<string, any[]> = {};
    instances.forEach(v => {
      const key = v.Card.id;
      if (!groupsMap[key]) groupsMap[key] = [];
      groupsMap[key].push(v);
    });
    const groups = Object.values(groupsMap);

    const handleToggleGroup = (group: any[]) => {
      const currentlySelected = group.filter(v => selectedSet.has(v.id));
      setFn(prev => {
        const next = new Set(prev);
        if (currentlySelected.length === group.length) {
          // Deselect all
          group.forEach(v => next.delete(v.id));
        } else {
          // Select one more
          const unselected = group.find(v => !next.has(v.id));
          if (unselected) next.add(unselected.id);
        }
        return next;
      });
    };

    if (viewMode === "grid") {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {groups.map(group => {
            const instance = group[0];
            const selectedCount = group.filter(v => selectedSet.has(v.id)).length;
            
            return (
              <div 
                key={instance.id}
                onClick={() => handleToggleGroup(group)}
                className={`relative aspect-[63/88] rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${selectedCount > 0 ? 'border-emerald-400 scale-95 opacity-100' : 'border-white/10 hover:border-white/30 opacity-70 hover:opacity-100'}`}
              >
                {instance.Card.imageUrl ? (
                  <Image src={proxiedImage(instance.Card.imageUrl)!} alt={instance.Card.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full bg-neutral-900 flex items-center justify-center p-4 text-center">
                    <span className="font-serif text-xs text-white">{instance.Card.name}</span>
                  </div>
                )}
                
                {group.length > 1 && (
                  <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md text-white px-1.5 py-0.5 rounded text-[10px] font-bold z-10 border border-white/20">
                    {group.length}x
                  </div>
                )}

                {selectedCount > 0 && (
                  <div className="absolute inset-0 bg-emerald-500/20 flex flex-col items-center justify-center z-20">
                    <div className="bg-emerald-500 text-black px-2 py-1 rounded font-sans text-[10px] uppercase tracking-widest font-bold">
                      {selectedCount} Selected
                    </div>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md p-2 z-30">
                  <p className="font-serif text-[10px] text-white truncate">{instance.Card.name}</p>
                  <p className="font-serif text-[10px] text-emerald-400">${(instance.customPrice || instance.Card.marketPrice || 0).toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {groups.map(group => {
          const instance = group[0];
          const selectedCount = group.filter(v => selectedSet.has(v.id)).length;
          
          return (
            <div 
              key={instance.id}
              onClick={() => handleToggleGroup(group)}
              className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${selectedCount > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-neutral-900/50 border-white/5 hover:border-white/20'}`}
            >
              <div className={`w-6 h-6 rounded border flex items-center justify-center ${selectedCount > 0 ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-neutral-500'}`}>
                {selectedCount > 0 ? <span className="text-[10px] font-bold">{selectedCount}</span> : null}
              </div>
              {group.length > 1 && (
                <div className="text-[10px] font-bold text-neutral-400 w-6 text-center">{group.length}x</div>
              )}
              <div className="flex-1 min-w-0 flex items-center gap-4">
                <span className="font-serif text-white truncate w-1/3">{instance.Card.name}</span>
                <span className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 w-1/4 truncate">{instance.Card.setName} ({instance.Card.setCode})</span>
                <span className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 w-1/4">#{instance.Card.number || "?"}</span>
                <span className="font-serif text-emerald-400 text-right w-20">${((instance.customPrice || instance.Card.marketPrice || 0) * group.length).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
"""

content = re.sub(r'const renderVault = \(instances: any\[\], isMine: boolean\) => \{[\s\S]*?  const totalOfferedValue =', render_vault_replacement + '\n  const totalOfferedValue =', content)

with open('src/app/trades/new/TradeBuilderClient.tsx', 'w') as f:
    f.write(content)
