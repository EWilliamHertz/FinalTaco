import { getGroup, joinGroup, leaveGroup } from "@/app/actions/group";
import { getCurrentUser } from "@/app/actions/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function GroupDetailsPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const group = await getGroup(id);
  if (!group) notFound();

  const isMember = group.Members.some(m => m.userId === user.id);
  
  const joinGroupAction = joinGroup.bind(null, id);
  const leaveGroupAction = leaveGroup.bind(null, id);

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-2 text-neutral-400 mb-4">
            <Link href="/groups" className="hover:text-white transition-colors">← Back to Groups</Link>
          </div>
          <h1 className="font-serif text-4xl text-white">{group.name}</h1>
          {group.description && <p className="font-sans text-sm text-neutral-300 mt-4 max-w-2xl">{group.description}</p>}
          <div className="font-sans text-xs text-neutral-500 mt-4">
            Created by {group.Creator.username} on {new Date(group.createdAt).toLocaleDateString()}
          </div>
        </div>
        <div>
          {isMember ? (
            <form action={leaveGroupAction}>
              <button type="submit" className="py-3 px-6 border border-white/20 text-white font-sans text-xs uppercase tracking-widest hover:bg-white/5 transition-colors rounded-lg whitespace-nowrap">
                Leave Group
              </button>
            </form>
          ) : (
            <form action={joinGroupAction}>
              <button type="submit" className="py-3 px-6 bg-white text-black font-sans text-xs uppercase tracking-widest hover:bg-neutral-200 transition-colors rounded-lg whitespace-nowrap">
                Join Group
              </button>
            </form>
          )}
        </div>
      </div>

      <div>
        <h2 className="font-serif text-2xl text-white mb-6">Members ({group.Members.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {group.Members.map(member => (
            <div key={member.id} className="flex items-center gap-4 bg-neutral-900/30 border border-white/10 p-4 rounded-xl">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold overflow-hidden">
                {member.User.avatarUrl ? (
                  <img src={member.User.avatarUrl} alt={member.User.username} className="w-full h-full object-cover" />
                ) : (
                  member.User.username[0].toUpperCase()
                )}
              </div>
              <div>
                <div className="text-white font-medium">{member.User.username}</div>
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
