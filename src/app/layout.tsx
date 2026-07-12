import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BARAKATLY — Organik Kənd Məhsulları",
  description: "Fermerlərindən birbaşa təzə və organik kənd məhsulları",
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
      <body className="min-h-screen flex flex-col bg-white">{children}</body>
    </html>
  );
}
