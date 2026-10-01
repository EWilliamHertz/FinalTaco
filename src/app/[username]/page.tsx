import { redirect } from "next/navigation";

/**
 * Visit any collector's profile directly via /[username] — e.g. /earlybirdie.
 * Redirects to the existing profile page, which renders a 404 for unknown
 * usernames. Reserved app paths (feed, market, ...) take precedence over
 * this dynamic segment automatically.
 */
export default async function UsernamePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  redirect(`/profile/${encodeURIComponent(username)}`);
}
