"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  
  if (pathname === "/" || pathname === "/select") return null;

  return (
    <footer className="w-full border-t border-white/5 py-8 mt-20">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-serif text-xl uppercase tracking-widest text-neutral-400">Hatake.Social</span>
          <span className="font-sans text-[9px] uppercase tracking-[0.2em] text-neutral-600 mt-1">The Ultimate TCG Vault</span>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/about" className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">About</Link>
          <Link href="/terms" className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">Terms</Link>
          <Link href="/privacy" className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 hover:text-white transition-colors">Privacy</Link>
          
          <a 
            href="https://www.hatake.shop" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-4 px-6 py-2 border border-white/10 hover:border-white/40 bg-neutral-900/50 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-all rounded-full font-sans text-[10px] uppercase tracking-widest flex items-center gap-2"
          >
            B2B Platform
          </a>
        </div>
      </div>
    </footer>
  );
}
