import { getCurrentSession } from "@/lib/auth";
import Landing from "@/components/Landing";
import UserHome from "@/components/UserHome";

// Visitors see the marketing page. People who are signed in go straight to what they can do.
export default async function Home() {
  const session = await getCurrentSession().catch(() => null);
  return session ? <UserHome session={session} /> : <Landing />;
}
