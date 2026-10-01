const fs = require('fs');

let content = fs.readFileSync('src/app/search/page.tsx', 'utf8');

// Replace state
content = content.replace(
  'const [addingId, setAddingId] = useState<string | null>(null);',
  `const [addingId, setAddingId] = useState<string | null>(null);
  
  // Vault Modal State
  const [selectedCard, setSelectedCard] = useState<CatalogCard | null>(null);
  const [vaultQuantity, setVaultQuantity] = useState(1);
  const [vaultCondition, setVaultCondition] = useState("NEAR_MINT");
  const [vaultNotes, setVaultNotes] = useState("");
  const [isSubmittingVault, setIsSubmittingVault] = useState(false);`
);

// Replace handleAdd function
const handleAddRegex = /const handleAdd = async \([^]*?setAddingId\(null\);\n  };/g;

const newHandleAdd = `const openAddModal = (card: CatalogCard) => {
    setSelectedCard(card);
    setVaultQuantity(1);
    setVaultCondition("NEAR_MINT");
    setVaultNotes("");
  };

  const handleConfirmAdd = async () => {
    if (!selectedCard) return;
    setIsSubmittingVault(true);

    const gameType = selectedCard.game.toLowerCase() === "pokemon" ? "pokemon" : "mtg";

    const res = await addToVault({
      tcgcsvId: selectedCard.tcgcsvId,
      game: gameType as any,
      name: selectedCard.name,
      setName: selectedCard.setName,
      imageUrl: selectedCard.imageUrl || "",
      rarity: selectedCard.rarity || undefined,
      marketPrice: selectedCard.marketPrice,
      setCode: selectedCard.setCode || undefined,
      number: selectedCard.number || undefined,
      condition: vaultCondition,
      quantity: vaultQuantity,
      notes: vaultNotes
    });

    if (res.success) {
      setAdded((prev) => ({ ...prev, [selectedCard.tcgcsvId]: true }));
      toast.success(\`Added \${vaultQuantity}x \${selectedCard.name} to Vault\`);
      setSelectedCard(null);
    } else {
      toast.error(res.error || "Failed to add to vault");
    }
    
    setIsSubmittingVault(false);
  };`;

content = content.replace(handleAddRegex, newHandleAdd);

// Replace onClick={() => handleAdd(card)}
content = content.replace(
  /onClick=\{\(\) => handleAdd\(card\)\}/g,
  `onClick={() => openAddModal(card)}`
);

// Add Modal JSX right before the </main> closing tag
const modalJSX = `
      {selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-white/20 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setSelectedCard(null)} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors">
              &times;
            </button>
            <h2 className="font-serif text-2xl text-white mb-2 truncate">{selectedCard.name}</h2>
            <p className="font-sans text-[10px] uppercase tracking-widest text-neutral-400 mb-6">{selectedCard.setName}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Quantity</label>
                <input 
                  type="number" 
                  min="1" 
                  max="100" 
                  value={vaultQuantity} 
                  onChange={(e) => setVaultQuantity(parseInt(e.target.value) || 1)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Condition</label>
                <select 
                  value={vaultCondition}
                  onChange={(e) => setVaultCondition(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans focus:outline-none focus:border-white/30"
                >
                  <option value="MINT">Mint (M)</option>
                  <option value="NEAR_MINT">Near Mint (NM)</option>
                  <option value="LIGHTLY_PLAYED">Lightly Played (LP)</option>
                  <option value="MODERATELY_PLAYED">Moderately Played (MP)</option>
                  <option value="HEAVILY_PLAYED">Heavily Played (HP)</option>
                  <option value="DAMAGED">Damaged (DMG)</option>
                </select>
              </div>

              <div>
                <label className="block font-sans text-[10px] uppercase tracking-widest text-neutral-500 mb-2">Tags / Notes (e.g., Foil, Signed)</label>
                <input 
                  type="text" 
                  placeholder="Foil, Signed by artist..."
                  value={vaultNotes} 
                  onChange={(e) => setVaultNotes(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white font-sans focus:outline-none focus:border-white/30"
                />
              </div>

              <button 
                onClick={handleConfirmAdd}
                disabled={isSubmittingVault}
                className="w-full mt-4 py-3 bg-white text-black rounded-lg font-sans text-[10px] uppercase tracking-widest hover:bg-neutral-200 transition-colors disabled:opacity-50"
              >
                {isSubmittingVault ? "Adding..." : "Add to Vault"}
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace('</main>', modalJSX + '\n    </main>');

fs.writeFileSync('src/app/search/page.tsx', content);
