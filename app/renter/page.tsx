import { redirect } from "next/navigation";
import { requireRenter } from "@/lib/auth";
import DashboardClient from "./DashboardClient";

export default async function RenterDashboard() {
  const userResult = await requireRenter();
  if (!userResult.ok) redirect("/login/renter");

  const supabase = userResult.supabase;

  const { data: renterProfile } = await supabase
    .from("renter_profiles")
    .select("*")
    .eq("user_id", userResult.user.id)
    .maybeSingle();

  if (!renterProfile) {
    redirect("/login/renter");
  }

  const { data } = await supabase.auth.getUser();
  const email = data?.user?.email ?? null;

  return (
    <DashboardClient
      email={email}
      profile={renterProfile}
    />
  );
}
