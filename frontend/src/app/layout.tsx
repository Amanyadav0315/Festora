import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export const metadata: Metadata = {
  title: "Festora",
  description: "Marketplace for event and celebration services in India",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-gray-50 pb-16 text-gray-900 lg:pb-0">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Navbar />
          {children}
          <MobileBottomNav />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
