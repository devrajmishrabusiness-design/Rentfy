import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import AdminDashboardClient from "./AdminDashboardClient";
import type { Agency, Property, Lead } from "../types";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const userResult = await requireUser();
  if (!userResult.ok) {
    if (userResult.status === 403) {
      redirect("/verify-email?redirect=/admin");
    }
    redirect("/");
  }

  const { supabase } = userResult;

  const { data: agencyRow } = await supabase
    .from("agency_profiles")
    .select("is_admin")
    .eq("auth_user_id", userResult.user.id)
    .maybeSingle();

  if (!agencyRow?.is_admin) {
    redirect("/");
  }

  const { data: agencies } = await supabase
    .from("agency_profiles")
    .select("id, agency_name, verified, is_admin, owner_name, city, email, phone")
    .returns<Agency[]>();

  const { data: properties } = await supabase
    .from("properties")
    .select("id, title, rent, location, city, status")
    .order("created_at", { ascending: false })
    .returns<Property[]>();

  const { count: totalLeads } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true });

  const { count: totalRenters } = await supabase
    .from("renter_profiles")
    .select("*", { count: "exact", head: true });

  const totalAgencies = agencies?.length || 0;
  const verifiedAgencies = agencies?.filter((agency) => agency.verified === true).length || 0;
  const pendingProperties = properties?.filter((p) => p.status === "pending").length || 0;
  const totalProperties = properties?.length || 0;

  return (
    <AdminDashboardClient
      agency={agencies?.[0]}
      agencies={agencies ?? []}
      properties={properties ?? []}
      leads={[]}
      totalAgencies={totalAgencies}
      verifiedAgencies={verifiedAgencies}
      totalProperties={totalProperties}
      pendingProperties={pendingProperties}
      totalLeads={totalLeads ?? 0}
      totalRenters={totalRenters ?? 0}
    />
  );
}
