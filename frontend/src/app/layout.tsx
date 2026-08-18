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
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

// Without this, mobile browsers render at a fake ~980px desktop viewport and scale the page
// down to fit — which is what makes the site look "zoomed in" on load and only match its
// mobile (lg:hidden) layout after the user manually pinch-zooms.
//
// viewportFit: "cover" opts into drawing under the status bar / notch (rather than the
// browser/WebView reserving that space itself), which is what makes env(safe-area-inset-*)
// resolve to a real, non-zero value instead of 0 — needed for the Android WebView app, where
// the status bar otherwise overlaps the orange navbar. Regular mobile browsers are unaffected
// since they already reserve the status bar area on their own.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
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
