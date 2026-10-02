"use client";
import { toast } from "react-toastify";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowLeft, Plus } from "lucide-react";
import { useGameStore } from "@/lib/store";
import { fetchProducts, fetchPrices } from "@/lib/tcgcsv";
import Image from "next/image";
import { proxiedImage } from "@/lib/images";
import { useRouter, useParams } from "next/navigation";
import { addToVault } from "@/app/actions/vault";

export default function SetDetailsPage() {
  const activeGame = useGameStore((state) => state.activeGame);
  const router = useRouter();
  const params = useParams();
  
  const categoryId = Number(params.categoryId);
  const groupId = Number(params.groupId);

  const [products, setProducts] = useState<any[]>([]);
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"singles" | "sealed">("singles");
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeGame) {
      router.push("/");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      const [prodData, priceData] = await Promise.all([
        fetchProducts(categoryId, groupId),
        fetchPrices(categoryId, groupId)
      ]);
      setProducts(prodData);
      setPrices(priceData);
      setLoading(false);
    };

    loadData();
  }, [activeGame, router, categoryId, groupId]);

  const handleAdd = async (product: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddingId(product.productId.toString());
    
    // Find prices from the original prices array
    const pPrices = prices.filter(p => p.productId === product.productId);
    const foilPrice = pPrices.find(p => p.subTypeName === "Holofoil" || p.subTypeName === "Foil")?.marketPrice || null;
    const reversePrice = pPrices.find(p => p.subTypeName === "Reverse Holofoil")?.marketPrice || null;
    const marketPrice = pPrices.find(p => p.subTypeName === "Normal")?.marketPrice || product.displayPrice || 0;

    let notes = "";
    if (product.subTypeName === "Holofoil" || product.subTypeName === "Foil") notes = "Foil";
    if (product.subTypeName === "Reverse Holofoil") notes = "Reverse Holo";

    const res = await addToVault({
      tcgcsvId: product.productId.toString(),
      game: activeGame === "pokemon" ? "pokemon" : "mtg",
      name: product.name,
      setName: "Set", // TCGCSV doesn't provide set name in product payload
      imageUrl: product.imageUrl,
      rarity: getRarity(product),
      marketPrice,
      foilPrice,
      reversePrice,
      notes: notes || undefined
    });

    if (res.success) {
      toast.error(`Added ${product.name} (${product.subTypeName}) to Vault!`);
    } else {
      toast.error(res.error);
    }
    setAddingId(null);
  };

  
  const isSealedProduct = (p: any) => {
    // If it has a Rarity, Card Number, HP, or Oracle Text, it's a single
    const isSingle = p.extendedData?.some((d: any) => 
      ["Rarity", "Number", "Card Type", "HP", "P", "T", "OracleText", "FlavorText"].includes(d.name)
    );
    if (isSingle) return false;
    
    // Fallback checks
    const name = p.name.toLowerCase();
    if (name.includes("booster") || name.includes("box") || name.includes("pack") || name.includes("deck") || name.includes("case") || name.includes("tin") || name.includes("blister") || name.includes("collection") || name.includes("elite trainer")) return true;
    
    return true;
  };

  const getRarity = (p: any) => p.extendedData?.find((d: any) => d.name === "Rarity")?.value || "Common";

  // Explode products based on prices
  const explodedProducts = products.flatMap(p => {
    const pPrices = prices.filter(price => price.productId === p.productId);
    if (pPrices.length === 0) {
      return [{ ...p, displayPrice: 0, subTypeName: "Normal" }];
    }
    return pPrices.map(price => ({
      ...p,
      displayPrice: price.marketPrice || price.midPrice || 0,
      subTypeName: price.subTypeName || "Normal"
    }));
  });

  const filteredProducts = explodedProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const singles = filteredProducts.filter(p => !isSealedProduct(p));
  const sealed = filteredProducts.filter(p => isSealedProduct(p));
  
  const displayItems = activeTab === "singles" ? singles : sealed;

  const brandColor = activeGame === "pokemon" ? "text-yellow-400" : "text-orange-500";
  const brandBorder = activeGame === "pokemon" ? "focus:border-yellow-400" : "focus:border-orange-500";

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-white/10 pb-8">
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-2 text-neutral-500 hover:text-white font-sans text-xs uppercase tracking-widest mb-6 transition-colors">
            <ArrowLeft size={14} /> Back to Sets
          </button>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
            Set <span className={brandColor}>Archive</span>
          </h1>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input 
            type="text" 
            placeholder="Search cards..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`bg-transparent border-b border-white/20 pl-10 pr-4 py-2 text-sm text-white focus:outline-none transition-colors w-64 md:w-80 font-serif italic ${brandBorder}`}
          />
        </div>
      </div>

      
      <div className="flex gap-4 mb-8 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab("singles")}
          className={`font-sans text-xs uppercase tracking-widest pb-2 border-b-2 transition-colors ${activeTab === "singles" ? brandColor + " border-current" : "text-neutral-500 border-transparent hover:text-white"}`}
        >
          Single Cards (${singles.length})
        </button>
        <button 
          onClick={() => setActiveTab("sealed")}
          className={`font-sans text-xs uppercase tracking-widest pb-2 border-b-2 transition-colors ${activeTab === "sealed" ? brandColor + " border-current" : "text-neutral-500 border-transparent hover:text-white"}`}
        >
          Sealed Products (${sealed.length})
        </button>
      </div>

      {loading ? (

        <div className="text-center text-neutral-500 font-serif italic">Loading set archives...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {displayItems.map((product, i) => {
            const price = prices.find(p => p.productId === product.productId);
            
            const isAdding = addingId === product.productId.toString();

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 20) * 0.05, duration: 0.4 }}
                key={`${product.productId}-${product.subTypeName}`}
                className="group relative flex flex-col gap-3"
              >
                <div className="relative aspect-[63/88] rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                  {product.imageUrl ? (
                    <Image src={proxiedImage(product.imageUrl)!} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" unoptimized />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-800 font-serif text-xs">No Image</div>
                  )}
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    <button 
                      onClick={(e) => handleAdd(product, e)}
                      disabled={isAdding}
                      className={`py-3 px-6 bg-white/10 hover:bg-white text-white hover:text-black rounded-full font-sans text-[10px] uppercase tracking-widest border border-white/20 hover:border-white transition-all flex items-center gap-2 ${isAdding ? 'opacity-50' : ''}`}
                    >
                      <Plus size={14} /> {isAdding ? "Adding..." : "Add to Vault"}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-sm text-white truncate">{product.name}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex flex-col gap-1">
    <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-500">
      {getRarity(product)}
    </p>
    {product.subTypeName && product.subTypeName !== "Normal" && (
      <p className="font-sans text-[8px] uppercase tracking-widest text-purple-400">
        {product.subTypeName}
      </p>
    )}
  </div>
                    {product.displayPrice > 0 && (
                      <p className={`font-serif text-xs ${brandColor}`}>${product.displayPrice.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
}
