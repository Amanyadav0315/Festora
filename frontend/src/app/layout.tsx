import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SessionGuard } from "@/components/SessionGuard";
import { AppShell } from "@/components/AppShell";
import { CompareBar } from "@/components/CompareBar";

export const metadata: Metadata = {
  title: "Event Saman",
  description: "Marketplace for event and celebration services in India",
};

// Without this, mobile browsers render at a fake ~980px desktop viewport and scale the page
// down to fit — which is what makes the site look "zoomed in" on load and only match its
// mobile (lg:hidden) layout after the user manually pinch-zooms.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionGuard />
          <Navbar />
          <AppShell>{children}</AppShell>
          <CompareBar />
          <MobileBottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
