import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { AchievementToastProvider } from "@/lib/achievement-toast-context";
import { LocaleProvider } from "@/lib/i18n-context";
import { PhoneShell } from "@/components/phone-shell";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["700"],
});

export const metadata: Metadata = {
  title: "Ratepanik — Das Party-Quiz!",
  description:
    "Ratepanik ist das schnelle Party-Quiz für Freunde. Tritt gegen deine Freunde an und zeige dein Wissen!",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className={`${jakarta.variable} ${spaceGrotesk.variable} antialiased`}>
      <body className="min-h-dvh font-sans bg-[var(--rp-nb-cream)] text-[var(--rp-nb-text)] overflow-x-hidden">
        <LocaleProvider>
          <AuthProvider>
            <AchievementToastProvider>
              <PhoneShell>{children}</PhoneShell>
            </AchievementToastProvider>
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
