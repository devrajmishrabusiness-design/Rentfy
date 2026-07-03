import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./Navbar";
import RenterAuthDialog from "./renter/RenterAuthDialog";
import { RenterSessionProvider } from "./renter/RenterSessionProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RenterEasy - Verified Rental Properties in Noida & NCR",
  description:
    "Find verified rental apartments, flats, houses, and villas in Noida and NCR. Browse properties from verified real estate agencies on RenterEasy.",

  keywords: [
    "rent property noida",
    "flats for rent noida",
    "apartments for rent noida",
    "rental homes noida",
    "houses for rent noida",
    "renterseasy",
    "property rental marketplace",
    "verified rental properties",
  ],

  metadataBase: new URL("https://renterseasy.in"),

  openGraph: {
    title: "RenterEasy - Verified Rental Properties in Noida & NCR",
    description:
      "Find verified rental properties from trusted agencies.",
    siteName: "RenterEasy",
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
      <body className="min-h-full flex flex-col bg-[var(--brand-background)]">
        <RenterSessionProvider>
          <Navbar />
          {children}
          <RenterAuthDialog />
        </RenterSessionProvider>
      </body>
    </html>
  );
}
