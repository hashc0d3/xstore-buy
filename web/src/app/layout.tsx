import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CookieConsent } from "@/components/cookie-consent";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sotik77.ru"),
  applicationName: "SOTIK77",
  title: {
    default: "SOTIK77",
    template: "%s | SOTIK77"
  },
  description: "SOTIK77 - магазин оригинальной техники, Trade-In и выкуп устройств в Москве.",
  alternates: {
    canonical: "https://sotik77.ru"
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://sotik77.ru",
    siteName: "SOTIK77",
    title: "SOTIK77",
    description: "Магазин оригинальной техники, Trade-In и выкуп устройств в Москве."
  },
  twitter: {
    card: "summary_large_image",
    title: "SOTIK77",
    description: "Магазин оригинальной техники, Trade-In и выкуп устройств в Москве."
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
