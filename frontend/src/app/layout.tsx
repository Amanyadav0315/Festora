import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SessionGuard } from "@/components/SessionGuard";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Festora",
  description: "Marketplace for event and celebration services in India",
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
          <MobileBottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
