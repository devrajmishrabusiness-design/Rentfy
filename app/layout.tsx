import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";
import { RenterSessionProvider } from "./renter/RenterSessionProvider";
import { ToastProvider } from "./Toast";
import { ConfirmProvider } from "./ConfirmDialog";
import { FocusManager } from "./FocusManager";

const RenterAuthDialog = dynamic(() => import("./renter/RenterAuthDialog"));

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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-[var(--brand-primary)] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
        >
          Skip to content
        </a>
        <ToastProvider>
          <ConfirmProvider>
            <RenterSessionProvider>
              <header role="banner">
                <Navbar />
              </header>
              <main id="main-content" tabIndex={-1} role="main">
                {children}
              </main>
              <BottomNav />
              <RenterAuthDialog />
            </RenterSessionProvider>
          </ConfirmProvider>
        </ToastProvider>
        <FocusManager />
      </body>
    </html>
  );
}