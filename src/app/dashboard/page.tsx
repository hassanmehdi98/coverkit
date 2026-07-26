import { auth, signIn } from "@/auth";
import { Dashboard } from "@/components/dashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    await signIn("google", { redirectTo: "/dashboard" });
  }

  return <Dashboard />;
}
