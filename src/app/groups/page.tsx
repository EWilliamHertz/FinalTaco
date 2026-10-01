import { getGroups, createGroup } from "@/app/actions/group";
import Link from "next/link";
import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function GroupsPage() {
  const groups = await getGroups();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-white">Community Groups</h1>
          <p className="font-sans text-xs uppercase tracking-widest text-neutral-400 mt-2">Join collectors and share your passion</p>
        </div>
      </div>

      <div className="bg-neutral-900/30 border border-white/10 rounded-2xl p-6">
        <h2 className="font-serif text-xl text-white mb-4">Create a Group</h2>
        <form action={createGroup} className="space-y-4">
          <div className="space-y-2">
            <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">Name</label>
            <input 
              name="name" 
              required 
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-sans focus:outline-none focus:border-white/30 transition-colors"
              placeholder="E.g. Vintage Pokemon Collectors"
            />
          </div>
          <div className="space-y-2">
            <label className="font-sans text-[10px] uppercase tracking-widest text-neutral-400">Description</label>
            <textarea 
              name="description" 
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-sans focus:outline-none focus:border-white/30 transition-colors min-h-[100px]"
              placeholder="What is this group about?"
            />
          </div>
          <button type="submit" className="py-3 px-6 bg-white text-black font-sans text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors rounded-lg">
            Create Group
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(group => (
          <Link href={`/groups/${group.id}`} key={group.id} className="block bg-neutral-900/30 border border-white/10 p-6 rounded-2xl hover:bg-white/5 transition-colors">
            <h2 className="font-serif text-xl text-white">{group.name}</h2>
            <p className="text-neutral-400 font-sans text-sm mt-2 line-clamp-2">{group.description}</p>
            <div className="mt-4 flex items-center gap-2">
              <span className="font-sans text-[10px] uppercase tracking-widest text-neutral-500 bg-white/10 px-2 py-1 rounded">
                {group._count.Members} Members
              </span>
            </div>
          </Link>
        ))}
        {groups.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-12 text-neutral-500 font-sans">
            No groups found. Be the first to create one!
          </div>
        )}
      </div>
    </div>
  );
}
