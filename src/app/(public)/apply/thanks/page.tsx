import Link from "next/link";
import { PageHero } from "@/components/ui";

export const metadata = { title: "Application received" };

export default async function Thanks({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return (
    <>
      <PageHero eyebrow="Thank you" title="We received your application">
        <p>Our team will prayerfully review it and email you when a decision has been made.</p>
      </PageHero>
      <section className="container-page mt-10 max-w-2xl">
        <div className="card space-y-4">
          <p>
            We emailed you a private link to your family&rsquo;s Christmas page. Once you&rsquo;re approved, you&rsquo;ll use that
            page to make a wish list for each child.
          </p>
          {t && (
            <>
              <p className="text-sm text-black/60">You can also bookmark it now:</p>
              <Link href={`/family/${t}`} className="btn-green">Go to my family&rsquo;s page</Link>
            </>
          )}
        </div>
      </section>
    </>
  );
}
