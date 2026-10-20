import Link from "next/link";
import { site } from "@/content/site";
import { PageHero, Photo } from "@/components/ui";
import { Testimonials } from "@/components/Testimonials";

export const metadata = { title: "About" };

export default function About() {
  return (
    <>
      <PageHero eyebrow="About us" title={site.fullName}>
        <p>A Christ-centered giving ministry serving children and families in {site.region}.</p>
      </PageHero>
      <section className="container-page mt-12 grid gap-10 md:grid-cols-2">
        <div className="prose-lift">
          {site.mission.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <h2 className="mt-8 mb-3 text-2xl font-bold">How it works</h2>
          <ol className="list-decimal space-y-2 pl-5 text-black/75">
            <li>Parents and guardians apply for Christmas sponsorship before the application deadline.</li>
            <li>Our team prayerfully reviews each application.</li>
            <li>Approved families build a wish list for each child. Each child becomes an &ldquo;angel&rdquo; on our Angel Tree. Names are never shown publicly.</li>
            <li>Neighbors, churches, and businesses sponsor angels, shop the Amazon wish list, or give money.</li>
            <li>Gifts are gathered, sorted, and given to families before Christmas.</li>
          </ol>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/give" className="btn-primary">Ways to give</Link>
            <Link href="/apply" className="btn-outline">Apply for help</Link>
          </div>
        </div>
        <div className="aspect-[4/5]">
          <Photo {...site.photos.mission} />
        </div>
      </section>
      <Testimonials />
    </>
  );
}
