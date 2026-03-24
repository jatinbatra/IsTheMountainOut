import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Is the Mountain Out? | Mt. Rainier Visibility from Seattle",
  description:
    "Real-time prediction of whether Mt. Rainier is visible from Seattle. Uses weather data, cloud cover, and air quality to determine mountain visibility.",
  openGraph: {
    title: "Is the Mountain Out?",
    description:
      "Check if Mt. Rainier is visible from Seattle right now.",
    type: "website",
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
