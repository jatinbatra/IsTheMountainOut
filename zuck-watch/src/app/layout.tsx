import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ZUCK WATCH · Is His Yacht in Seattle?",
  description:
    "Real-time tracker: is Mark Zuckerberg's superyacht Laetitia currently on Lake Union in Seattle? No cookies. No tracking. We just want to see the boat.",
  openGraph: {
    title: "ZUCK WATCH",
    description: "Is his yacht in Seattle right now?",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
