import type { Metadata } from "next";
import "./globals.css";

const SITE_URL = "https://is-the-mountain-out.vercel.app";

export const metadata: Metadata = {
  title: "Is the Mountain Out? | Mt. Rainier Visibility from Seattle",
  description:
    "Real-time prediction of whether Mt. Rainier is visible from Seattle. Uses weather data, cloud cover, and air quality to determine mountain visibility. No cookies, no tracking, 100% free.",
  openGraph: {
    title: "Is the Mountain Out?",
    description:
      "Check if Mt. Rainier is visible from Seattle right now. Live score, webcams, and 7-day forecast.",
    type: "website",
    url: SITE_URL,
    images: [
      {
        url: `${SITE_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: "Mt. Rainier visibility status",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Is the Mountain Out?",
    description:
      "Live Mt. Rainier visibility from Seattle. No cookies, no tracking, 100% free.",
    images: [`${SITE_URL}/api/og`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#050b18" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
