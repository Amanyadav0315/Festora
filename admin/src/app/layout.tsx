import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Event Saman Admin",
  description: "Admin panel for managing Event Saman",
};

// Without this, mobile browsers render at a fake ~980px desktop viewport and scale the page
// down, breaking the drawer-sidebar mobile layout until the user manually zooms.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}