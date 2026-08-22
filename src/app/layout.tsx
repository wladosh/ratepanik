import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ratepanik — Das Party-Quiz!",
  description:
    "Ratepanik ist das schnelle Party-Quiz für Freunde. Tritt gegen deine Freunde an und zeige dein Wissen!",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${inter.variable} antialiased`}>
      <body className="min-h-dvh font-sans bg-purple-900 text-white overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
