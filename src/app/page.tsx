import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import Landing from "@/components/Landing";
import UserHome from "@/components/UserHome";

// Visitors see the marketing page and learners see their home. The admin account is for managing the site,
// so it goes straight to the dashboard.
export default async function Home() {
  const session = await getCurrentSession().catch(() => null);
  if (session?.role === "admin") redirect("/admin");
  return session ? <UserHome session={session} /> : <Landing />;
}
