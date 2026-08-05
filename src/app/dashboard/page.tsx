import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { Dashboard } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    // signIn() cannot run in a Server Component (it sets cookies).
    // Hit the Auth.js route handler instead — that can set cookies.
    redirect(
      `/api/auth/signin/google?callbackUrl=${encodeURIComponent("/dashboard")}`,
    );
  }

  return <Dashboard />;
}
