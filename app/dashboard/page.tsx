import LogoutButton from "../LogoutButton";
import Link from "next/link";
import DeleteButton from "../DeleteButton";
import { createClient } from "@/lib/supabase-server";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("USER:", user);

  if (!user) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-red-600">
          USER IS NULL
        </h1>
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
        <h1 className="text-2xl font-bold text-red-600">
          Agency not found
        </h1>
      </main>
    );
  }

  const { data: properties, error } = await supabase
    .from("properties")
    .select("*")
    .eq("agency_id", agency.id);

  const totalProperties = properties?.length || 0;

  const totalRentValue =
   properties?.reduce(
    (sum: number, property: any) =>
      sum + (property.rent || 0),
    0
  ) || 0;
  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-red-600">
          Error Loading Properties
        </h1>
        <p>{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">
            Agency Dashboard
          </h1>

          <div className="flex gap-3">
            <Link
              href="/profile"
              className="bg-purple-600 text-white px-4 py-2 rounded"
            >
              Profile
            </Link>

            <LogoutButton />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">

       <div className="bg-white p-6 rounded-xl shadow">
         <h3 className="text-gray-500">
           Total Properties
        </h3>

        <p className="text-3xl font-bold">
          {totalProperties}
        </p>
      </div>

     <div className="bg-white p-6 rounded-xl shadow">
       <h3 className="text-gray-500">
          Total Rent Value
         </h3>

        <p className="text-3xl font-bold text-green-600">
          ₹{totalRentValue.toLocaleString()}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-gray-500">
          Agency
        </h3>

        <p className="text-xl font-bold">
          {agency.agency_name}
        </p>
      </div>

    </div>

    <Link
      href="/add-property"
      className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg mb-6"
    >
      + Add New Property
    </Link>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">
            All Properties
          </h2>

          {properties && properties.length > 0 ? (
            <div className="space-y-4">
              {properties.map((property: any) => (
                <div
                  key={property.id}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-bold text-lg">
                      {property.title}
                    </h3>

                    <p>₹{property.rent}/month</p>

                    <p>
                      {property.location}, {property.city}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/property/${property.id}`}
                      className="bg-green-600 text-white px-4 py-2 rounded"
                    >
                      View
                    </Link>

                    <Link
                      href={`/edit-property/${property.id}`}
                      className="bg-yellow-500 text-white px-4 py-2 rounded"
                    >
                      Edit
                    </Link>

                    <DeleteButton id={property.id} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No properties found.</p>
          )}
        </div>
      </div>
    </main>
  );
}