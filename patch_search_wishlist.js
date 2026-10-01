const fs = require('fs');

let content = fs.readFileSync('src/app/search/page.tsx', 'utf8');

content = content.replace(
  'import { addToVault } from "@/app/actions/vault";',
  'import { addToVault } from "@/app/actions/vault";\nimport { toggleWishlist } from "@/app/actions/wishlist";'
);

// We need to add a function to handle wishlist toggle
const wishlistAction = `
  const handleWishlistToggle = async (e: React.MouseEvent, cardId: string) => {
    e.stopPropagation();
    const res = await toggleWishlist(cardId);
    if (res.success) {
      toast.success(res.added ? "Added to Wishlist" : "Removed from Wishlist");
    } else {
      toast.error(res.error || "Failed to update wishlist");
    }
  };
`;

content = content.replace(
  /const handleConfirmAdd = async \(\) => \{/,
  wishlistAction + '\n  const handleConfirmAdd = async () => {'
);


// Add a heart icon or a button to the card in the results grid
const heartIconUI = `
                  <div className="absolute top-2 left-2 z-10">
                    <button 
                      onClick={(e) => handleWishlistToggle(e, card.tcgcsvId)}
                      className="p-1.5 bg-black/80 hover:bg-black text-neutral-400 hover:text-pink-500 rounded-full transition-colors backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>
                  </div>
`;

content = content.replace(
  /<div className="relative aspect-\[63\/88\] rounded-xl overflow-hidden border border-white\/10 group-hover:border-white\/30 transition-colors mb-3">/,
  '<div className="relative aspect-[63/88] rounded-xl overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors mb-3">' + heartIconUI
);

fs.writeFileSync('src/app/search/page.tsx', content);

