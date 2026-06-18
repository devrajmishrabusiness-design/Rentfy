import { supabase } from "@/lib/supabase";
import PropertyList from "./PropertyList";

export default async function Home() {
  const { data: properties } = await supabase
    .from("properties")
    .select("*");

  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Rentfy
      </h1>

      <PropertyList properties={properties || []} />
    </main>
  );
}