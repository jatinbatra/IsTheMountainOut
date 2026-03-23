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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
