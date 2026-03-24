import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#14708E",
};

export const metadata: Metadata = {
  title: "Kodex",
  description: "Kodex - Professional crypto trading signals & managed trading",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kodex",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={`${dmSans.variable} h-full`}>
      <head>
        <link rel="apple-touch-icon" href="/assets/images/logo_kodex.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className="h-full antialiased"
        style={{ fontFamily: "var(--font-dm-sans), system-ui, sans-serif" }}
      >
        {children}
      </body>
    </html>
  );
}
