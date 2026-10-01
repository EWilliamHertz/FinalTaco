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
    
    const res = await addToVault({
      tcgcsvId: product.productId.toString(),
      game: activeGame === "pokemon" ? "pokemon" : "mtg",
      name: product.name,
      setName: "Set", // TCGCSV doesn't provide set name in product payload, we could pass it from the previous page via query param, but hardcoding for now
      imageUrl: product.imageUrl,
      rarity: product.rarityName,
    });

    if (res.success) {
      // Show success animation or toast
      toast.error(`Added ${product.name} to Vault!`);
    } else {
      toast.error(res.error);
    }
    setAddingId(null);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
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

      {loading ? (
        <div className="text-center text-neutral-500 font-serif italic">Loading set archives...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredProducts.map((product, i) => {
            const price = prices.find(p => p.productId === product.productId);
            const marketPrice = price?.marketPrice || price?.midPrice || 0;
            const isAdding = addingId === product.productId.toString();

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % 20) * 0.05, duration: 0.4 }}
                key={product.productId}
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
                    <p className="font-sans text-[9px] uppercase tracking-widest text-neutral-500">
                      {product.rarityName || "Common"}
                    </p>
                    {marketPrice > 0 && (
                      <p className={`font-serif text-xs ${brandColor}`}>${marketPrice.toFixed(2)}</p>
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
