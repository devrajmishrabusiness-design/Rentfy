import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import VerifyAgencyButton from "@/app/VerifyAgencyButton";
import DeletePropertyAdminButton from "@/app/DeletePropertyAdminButton";
import ApprovePropertyButton from "@/app/ApprovePropertyButton";
import RejectPropertyButton from "@/app/RejectPropertyButton";
export default async function AdminPage() {
  const supabase = await createClient();
  const {
  data: { user },
} = await supabase.auth.getUser();

if (
  !user ||
  user.email !== "devrajmishrabusiness@gmail.com"
) {
  redirect("/");
}
  const { data: agencies } = await supabase
    .from("agencies")
    .select("*");

  const { data: properties } = await supabase
    .from("properties")
    .select("*");

  const { data: leads } = await supabase
    .from("leads")
    .select("*");

  const totalAgencies = agencies?.length || 0;
  const totalProperties = properties?.length || 0;
  const totalLeads = leads?.length || 0;

  const verifiedAgencies =
    agencies?.filter(
      (agency) => agency.verified === true
    ).length || 0;

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">

        <h1 className="text-4xl font-bold mb-6">
          Rentfy Admin Dashboard
        </h1>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">

          <div className="bg-white p-6 rounded-xl shadow">
            <h3>Total Agencies</h3>
            <p className="text-3xl font-bold">
              {totalAgencies}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3>Verified Agencies</h3>
            <p className="text-3xl font-bold text-green-600">
              {verifiedAgencies}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3>Total Properties</h3>
            <p className="text-3xl font-bold">
              {totalProperties}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow">
            <h3>Total Leads</h3>
            <p className="text-3xl font-bold text-blue-600">
              {totalLeads}
            </p>
          </div>

        </div>

        {/* Agencies */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">
            Agencies
          </h2>

          {agencies && agencies.length > 0 ? (
            <div className="space-y-3">

              {agencies.map((agency: any) => (
                <div
                  key={agency.id}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-lg">
                      {agency.agency_name}
                    </p>

                    <p>
                      Owner: {agency.owner_name}
                    </p>

                    <p>
                      City: {agency.city}
                    </p>

                    <p>
                      Phone: {agency.phone}
                    </p>

                    <p>
                      Email: {agency.email}
                    </p>
                  </div>

                  <div>
                    {agency.verified ? (
                      <span className="text-green-600 font-bold">
                        ✅ Verified
                     </span>
                    ) : (
                      <VerifyAgencyButton
                        agencyId={agency.id}
                     />
                   )}
                </div>
                </div>
              ))}

            </div>
          ) : (
            <p>No agencies found.</p>
          )}
        </div>

      </div>
      <div className="bg-white rounded-xl shadow p-6 mt-6">
  <h2 className="text-2xl font-semibold mb-4">
    All Properties
  </h2>

  {properties && properties.length > 0 ? (
    <div className="space-y-3">

      {properties.map((property: any) => (
        <div
          key={property.id}
          className="border rounded-lg p-4 flex justify-between items-center"
        >
          <div>
            <p className="font-bold text-lg">
              {property.title}
            </p>

            <p>
              ₹{property.rent}/month
            </p>

            <p>
              {property.location}, {property.city}
            </p>

            <p className="mt-1">
              Status:{" "}
              <span className="font-semibold">
                {property.status}
              </span>
            </p>
          </div>

          <div className="flex gap-2 items-center">
            <ApprovePropertyButton
              propertyId={property.id}
            />

            <RejectPropertyButton
              propertyId={property.id}
            />

            <DeletePropertyAdminButton
              propertyId={property.id}
            />
          </div>
        </div>
      ))}

    </div>
  ) : (
    <p>No properties found.</p>
  )}
</div>

</main>
  );
}