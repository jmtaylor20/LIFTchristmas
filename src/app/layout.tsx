import type { Metadata } from "next";
import { Cormorant_Garamond, Pinyon_Script, Source_Sans_3 } from "next/font/google";
import { brand, site } from "@/content/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-cormorant", display: "swap" });
const pinyon = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-pinyon", display: "swap" });
const source = Source_Sans_3({ subsets: ["latin"], variable: "--font-source", display: "swap" });

export const metadata: Metadata = {
  title: { default: `${site.name} · ${site.communities}`, template: `%s · ${site.name}` },
  description: site.tagline,
  icons: { icon: brand.angel },
  openGraph: { images: [brand.full] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${pinyon.variable} ${source.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
