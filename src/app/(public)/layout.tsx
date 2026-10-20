import { SiteFooter, SiteHeader } from "@/components/SiteChrome";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main" className="pb-24 has-[>.flush-end]:pb-0">{children}</main>
      <SiteFooter />
    </>
  );
}
