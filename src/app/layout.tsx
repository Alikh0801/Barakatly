import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import { RoutePrefetcher } from "@/components/navigation/RoutePrefetcher";
import { getAppUrl } from "@/lib/auth/urls";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const appUrl = getAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "BARAKATLY — Organik Kənd Məhsulları",
  description:
    "Fermerlərindən birbaşa təzə və organik kənd məhsulları. Yerli fermerləri şüurlu istehlakçılarla birləşdiririk.",
  applicationName: "Barakatly",
  keywords: [
    "Barakatly",
    "organik",
    "fermer",
    "kənd məhsulları",
    "Azərbaycan",
    "təzə meyvə",
    "tərəvəz",
  ],
  authors: [{ name: "Barakatly" }],
  openGraph: {
    type: "website",
    locale: "az_AZ",
    url: appUrl,
    siteName: "Barakatly",
    title: "BARAKATLY — Organik Kənd Məhsulları",
    description:
      "Fermerlərindən birbaşa təzə və organik kənd məhsulları.",
    images: [
      {
        url: "/hero/kend.jpg",
        width: 1200,
        height: 630,
        alt: "Barakatly — fermerdən süfrəyə",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BARAKATLY — Organik Kənd Məhsulları",
    description:
      "Fermerlərindən birbaşa təzə və organik kənd məhsulları.",
    images: ["/hero/kend.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="az"
      className={`${geistSans.variable} ${geistMono.variable} h-full min-h-screen antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-white text-zinc-900">
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <RoutePrefetcher />
        {children}
      </body>
    </html>
  );
}
