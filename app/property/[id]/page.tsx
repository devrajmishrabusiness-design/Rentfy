import { supabase } from "@/lib/supabase";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (!property) {
    return <div className="p-8">Property not found</div>;
  }

  const whatsappUrl = `https://web.whatsapp.com/send?phone=919084061619&text=${encodeURIComponent(
    `Hi, I am interested in ${property.title} listed on Rentfy.`
  )}`;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <img
        src={property.image_url}
        alt={property.title}
        className="w-full rounded-lg"
      />

      <h1 className="text-4xl font-bold mt-6">
        {property.title}
      </h1>

      <p className="text-green-600 text-3xl font-bold mt-4">
        ₹{property.rent}/month
      </p>

      <p className="text-gray-500 mt-2">
        📍 {property.location}, {property.city}
      </p>

      <p className="mt-4 text-lg">
        {property.description}
      </p>

      <div className="mt-6">
        <p>🏠 {property.property_type}</p>
        <p>🛏️ {property.bedrooms} Bedrooms</p>
        <p>🚿 {property.bathrooms} Bathrooms</p>
      </div>

      <div className="mt-8 p-4 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-bold mb-3">
          Agency Information
        </h2>

        <p>Agency: Rentfy Properties</p>
        <p>Phone: 9084061619</p>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block mt-4 bg-green-600 text-white py-3 rounded-lg text-center"
        >
          WhatsApp Agency
        </a>
      </div>
    </main>
  );
}