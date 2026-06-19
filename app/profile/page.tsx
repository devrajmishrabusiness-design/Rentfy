import { createClient } from "@/lib/supabase-server";
import EditAgencyProfile from "@/app/EditAgencyProfile";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="p-8">
        <h1>Please login first</h1>
      </main>
    );
  }

  const { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!agency) {
    return (
      <main className="p-8">
        <h1>Agency not found</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow p-6">
        <h1 className="text-3xl font-bold mb-6">
          Edit Agency Profile
        </h1>

        <EditAgencyProfile agency={agency} />

        <div className="mt-8 border-t pt-6">
          <h2 className="text-xl font-bold mb-4">
            Account Information
          </h2>

          <div className="space-y-3">
            <p>
              <strong>Email:</strong> {agency.email}
            </p>

            <p>
              <strong>Agency ID:</strong> {agency.id}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}