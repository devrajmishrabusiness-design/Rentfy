import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rentfy - Rental Properties in Noida & NCR",
  description:
    "Find verified rental apartments, flats, houses, and villas in Noida and NCR. Browse properties from verified real estate agencies on Rentfy.",

  keywords: [
    "rent property noida",
    "flats for rent noida",
    "apartments for rent noida",
    "rental homes noida",
    "houses for rent noida",
    "rentfy",
    "property rental marketplace",
    "verified rental properties",
  ],

  metadataBase: new URL("https://rentfy.in"),

  openGraph: {
    title: "Rentfy - Rental Properties in Noida & NCR",
    description:
      "Find verified rental properties from trusted agencies.",
    siteName: "Rentfy",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
