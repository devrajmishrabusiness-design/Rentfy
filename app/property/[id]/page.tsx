import ImageGallery from "@/app/ImageGallery";
import { supabase } from "@/lib/supabase";
import ContactAgencyButton from "@/app/ContactAgencyButton";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const { data: property } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .eq("status", "approved")
    .single();

  if (!property) {
    return {
      title: "Property Not Found | Rentfy",
      description: "The requested property could not be found.",
    };
  }

  return {
    title: `${property.title} | Rentfy`,
    description:
      property.description?.slice(0, 160) ||
      `Rental property in ${property.city} listed on Rentfy.`,

    openGraph: {
      title: `${property.title} | Rentfy`,
      description:
        property.description?.slice(0, 160) ||
        `Rental property in ${property.city} listed on Rentfy.`,
      images: property.image_url ? [property.image_url] : [],
    },
  };
}

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
    .eq("status", "approved")
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
          {property.parking
            ? "Available"
            : "Not Available"}
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

        {agency?.verified && (
          <div className="mt-2 inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full font-semibold">
            ✅ Verified Rentfy Agency
          </div>
        )}

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

        <ContactAgencyButton
          propertyId={property.id}
          agencyId={agency.id}
          whatsappUrl={whatsappUrl}
        />
      </div>
    </main>
  );
}