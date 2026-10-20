import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export const metadata: Metadata = {
  manifest: "/manifests/giving.webmanifest",
  icons: { apple: "/icons/giving-apple.png" },
  appleWebApp: { title: "LIFT Giving", capable: true, statusBarStyle: "default" },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="pb-24 has-[>.flush-end]:pb-0">{children}</main>
      <SiteFooter />
    </>
  );
}
