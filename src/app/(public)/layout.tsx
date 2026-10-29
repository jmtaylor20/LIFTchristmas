import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SandboxBanner } from "@/components/SandboxBanner";
import { getActiveSeason } from "@/lib/season";

export const metadata: Metadata = {
  manifest: "/manifests/giving.webmanifest",
  icons: { apple: "/icons/giving-apple.png" },
  appleWebApp: { title: "LIFT Giving", capable: true, statusBarStyle: "default" },
};

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const venmo = (await getActiveSeason().catch(() => null))?.venmoHandle;
  return (
    <>
      <SandboxBanner />
      <SiteHeader />
      <main id="main" className="pb-24 has-[>.flush-end]:pb-0">{children}</main>
      <SiteFooter venmo={venmo} />
    </>
  );
}
