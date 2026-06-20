import { supabase } from "@/lib/supabase";
import PropertyList from "./PropertyList";
import Navbar from "./Navbar";
import Link from "next/link";

export default async function Home() {
  const { data: properties } = await supabase
     .from("properties")
     .select(`
      *,
      agencies!inner (
       verified
      )
    `)
      .eq("agencies.verified", true)
      .eq("status", "approved");
  return (
    <main className="min-h-screen bg-gray-100">
      <Navbar />
      {/* Hero Section */}
      <section className="bg-blue-600 text-white py-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">
            Find Your Perfect Rental Home
          </h1>

          <p className="text-xl mb-8">
            Apartments, Flats, Villas and Houses from
            verified agencies.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              href="/login"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold"
            >
              Agency Login
            </Link>
            
            <Link
               href="/signup"
               className="bg-purple-600 text-white px-6 py-3 rounded-lg"
              > 
               Agency Signup
            </Link>
            <Link
              href="/dashboard"
              className="bg-green-600 px-6 py-3 rounded-lg font-semibold"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="bg-white rounded-xl shadow p-6 text-center">
          <h2 className="text-3xl font-bold">
            {properties?.length || 0}
          </h2>

          <p className="text-gray-600">
            Active Rental Listings
          </p>
        </div>
      </section>

      {/* Listings */}
      <section className="max-w-6xl mx-auto px-6 pb-12">
        <h2 className="text-3xl font-bold mb-6">
          Available Properties
        </h2>

        <PropertyList properties={properties || []} />
      </section>
    </main>
  );
}