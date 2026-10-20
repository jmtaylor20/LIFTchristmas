import type { Metadata } from "next";
import { Gelasio, Source_Sans_3 } from "next/font/google";
import { brand, site } from "@/content/site";
import "./globals.css";

// Gelasio is a Georgia-compatible serif, so headlines match the brand kit on every device.
const gelasio = Gelasio({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-gelasio", display: "swap" });
const source = Source_Sans_3({ subsets: ["latin"], variable: "--font-source", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${site.name} · ${site.communities}`, template: `%s · ${site.name}` },
  description: site.tagline,
  openGraph: { images: [brand.full] },
  themeColor: "#6b8fa5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${gelasio.variable} ${source.variable}`}>
      <body className="min-h-screen scroll-smooth">{children}</body>
    </html>
  );
}
