import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { SandboxBanner } from "@/components/SandboxBanner";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { getActiveSeason } from "@/lib/season";

export const metadata: Metadata = {
  manifest: "/manifests/giving.webmanifest",
  icons: { apple: "/icons/giving-apple.png" },
  appleWebApp: { title: "LIFT Giving", capable: true, statusBarStyle: "default" },
};

// Rendered on every visit so season settings (like a banner's end date) take
// effect on time on every page, including otherwise-static ones like About.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const season = await getActiveSeason().catch(() => null);
  const venmo = season?.venmoHandle;
  return (
    <>
      <SandboxBanner />
      <AnnouncementBanner
        text={season?.announcementUntil && season.announcementUntil < new Date() ? null : season?.announcement}
        link={season?.announcementLink}
      />
      <SiteHeader />
      <main id="main" className="pb-24 has-[>.flush-end]:pb-0">{children}</main>
      <SiteFooter venmo={venmo} />
    </>
  );
}
