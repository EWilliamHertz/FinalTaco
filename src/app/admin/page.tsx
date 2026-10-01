import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.email !== "swagyser9@gmail.com") {
    redirect("/");
  }

  return <AdminClient />;
}
