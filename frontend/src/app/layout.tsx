import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "Festora",
  description: "Marketplace for event and celebration services in India",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 pb-16 text-gray-900 lg:pb-0">
        <Navbar />
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
