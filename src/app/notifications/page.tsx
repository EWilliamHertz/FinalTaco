import { getNotifications } from "@/app/actions/notification";
import { getCurrentUser } from "@/app/actions/auth";
import { notFound } from "next/navigation";
import { NotificationClient } from "./NotificationClient";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return notFound();

  const res = await getNotifications();
  const notifications = res.notifications || [];

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 lg:px-12 max-w-[800px] mx-auto">
      <div className="mb-12 border-b border-white/10 pb-8">
        <h1 className="font-serif text-4xl md:text-5xl text-white font-light uppercase tracking-widest mb-3">
          Your <span className="text-yellow-500">Alerts</span>
        </h1>
        <p className="font-sans text-neutral-400 text-sm tracking-[0.2em] uppercase">
          Stay up to date with your network
        </p>
      </div>

      <NotificationClient initialNotifications={notifications} />
    </main>
  );
}
