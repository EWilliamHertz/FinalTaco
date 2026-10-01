import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/app/actions/auth";
import Link from "next/link";
import { Trophy, Star, Medal } from "lucide-react";

export default async function LeaderboardPage() {
  const users = await prisma.user.findMany({
    select: {
      username: true,
      avatarUrl: true,
      reputationScore: true,
      _count: { select: { CardInstances: true, Posts: true } }
    },
    orderBy: { reputationScore: "desc" },
    take: 50
  });

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[1000px] mx-auto">
      <div className="mb-12 border-b border-white/10 pb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
            Global <span className="text-yellow-500">Rankings</span>
          </h1>
          <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
            Top collectors and traders
          </p>
        </div>
        <Trophy className="w-16 h-16 text-yellow-500/20" />
      </div>

      <div className="bg-neutral-900/50 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-black/50">
              <th className="p-4 font-sans text-[10px] uppercase tracking-widest text-neutral-500">Rank</th>
              <th className="p-4 font-sans text-[10px] uppercase tracking-widest text-neutral-500">Collector</th>
              <th className="p-4 font-sans text-[10px] uppercase tracking-widest text-neutral-500 text-center">Reputation</th>
              <th className="p-4 font-sans text-[10px] uppercase tracking-widest text-neutral-500 text-right">Vault Size</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u.username} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {i === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                    {i === 1 && <Medal className="w-4 h-4 text-neutral-300" />}
                    {i === 2 && <Medal className="w-4 h-4 text-orange-600" />}
                    <span className="font-serif text-white ml-2">{i + 1}</span>
                  </div>
                </td>
                <td className="p-4">
                  <Link href={`/profile/${u.username}`} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black overflow-hidden border border-white/10 group-hover:border-white/30 transition-colors">
                      {u.avatarUrl && <img src={u.avatarUrl} alt="avatar" className="w-full h-full object-cover" />}
                    </div>
                    <span className="font-serif text-white group-hover:text-yellow-400 transition-colors">{u.username}</span>
                  </Link>
                </td>
                <td className="p-4 text-center">
                  <span className="font-sans text-xs bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded-full border border-yellow-500/20">
                    {u.reputationScore}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <span className="font-serif text-neutral-400">{u._count.CardInstances} Cards</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
