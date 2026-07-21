import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const { data: properties } = await supabase
    .from("properties")
    .select("id")
    .eq("status", "approved");

  const propertyUrls =
    properties?.map((property) => ({
      url: `https://rentereasy.in/property/${property.id}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })) || [];

  return [
    {
      url: "https://rentereasy.in",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: "https://rentereasy.in/login",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://rentereasy.in/signup",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: "https://rentereasy.in/rent/noida",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },

    ...propertyUrls,
  ];
}
