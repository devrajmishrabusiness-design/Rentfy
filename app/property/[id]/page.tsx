import ImageGallery from "@/app/ImageGallery";
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

  const { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("id", property.agency_id)
    .single();
  const { data: images } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", property.id);
    
  console.log("PROPERTY ID:", property.id);
  console.log("IMAGES:", images);
  const imageUrls =
  images?.map((img) => img.image_url) || [];
  const phone = agency?.phone || "9084061619";

  const whatsappUrl = `https://wa.me/91${phone}?text=${encodeURIComponent(
    `Hi, I am interested in ${property.title} listed on Rentfy.`
  )}`;

  return (
    <main className="p-8 max-w-4xl mx-auto">
        
      <ImageGallery
        images={imageUrls}
        title={property.title}
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

      <div className="mt-6 space-y-2">
        <p>🏠 {property.property_type}</p>
        <p>🛏️ {property.bedrooms} Bedrooms</p>
        <p>🚿 {property.bathrooms} Bathrooms</p>

        {property.furnishing && (
          <p>🛋️ Furnishing: {property.furnishing}</p>
        )}

        <p>
          🚗 Parking:{" "}
          {property.parking ? "Available" : "Not Available"}
        </p>

        {property.available_from && (
          <p>
            📅 Available From: {property.available_from}
          </p>
        )}

        {property.contact_number && (
          <p>
            📞 Contact Number: {property.contact_number}
          </p>
        )}
      </div>

      <div className="mt-8 p-6 border rounded-xl bg-gray-50">
        <h2 className="text-xl font-bold mb-4">
          Agency Information
        </h2>

        <p>
          <strong>Agency:</strong>{" "}
          {agency?.agency_name || "Rentfy Partner"}
        </p>

        <p>
          <strong>Owner:</strong>{" "}
          {agency?.owner_name || "N/A"}
        </p>

        <p>
          <strong>Phone:</strong>{" "}
          {agency?.phone || "N/A"}
        </p>

        <p>
          <strong>City:</strong>{" "}
          {agency?.city || "N/A"}
        </p>

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