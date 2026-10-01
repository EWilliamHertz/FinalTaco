import { getCurrentUser } from "@/app/actions/auth";
import { notFound } from "next/navigation";
import { TradeBuilderClient } from "./TradeBuilderClient";

export default async function NewTradePage() {
  const user = await getCurrentUser();
  if (!user) return notFound();

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1400px] mx-auto">
      <div className="mb-12 border-b border-white/10 pb-8">
        <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
          New <span className="text-emerald-400">Trade</span>
        </h1>
        <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
          Propose a trade with another collector
        </p>
      </div>

      <TradeBuilderClient currentUser={user} />
    </main>
  );
}
