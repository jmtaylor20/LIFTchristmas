import Link from "next/link";
import { site } from "@/content/site";
import Image from "next/image";
import { brand } from "@/content/site";
import { PageHero, Photo } from "@/components/ui";
import { Testimonials } from "@/components/Testimonials";

export const metadata = { title: "About" };

export default function About() {
  return (
    <>
      <PageHero eyebrow="About us" title={site.fullName}>
        <p>A Christ-centered giving ministry serving children and families in {site.region}.</p>
      </PageHero>
      <section className="container-page mt-12">
        <div className="card flex flex-col items-center gap-6 sm:flex-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={site.ministryLogo} alt={`${site.ministry}: ${site.ministryMotto}`} className="h-36 w-auto" />
          <div>
            <p className="eyebrow">Who we are</p>
            <h2 className="mt-2 text-3xl">
              {site.ministry}: <em className="text-dusk-600">{site.ministryMotto}</em>
            </h2>
            <p className="mt-2 text-black/70">
              Community Christmas is an outreach of {site.ministry}. LIFT stands for <strong>Living In Faith Together</strong>, and
              each Christmas we live that out by helping families in our community during the holiday season.
            </p>
            <p className="mt-3 font-display text-dusk-700 italic">{site.thanksLine}</p>
          </div>
        </div>
      </section>
      <section className="container-page mt-12 grid gap-10 md:grid-cols-2">
        <div className="prose-lift">
          {site.mission.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <h2 className="mt-10 mb-3 text-3xl">How it works</h2>
          <ol className="list-decimal space-y-2 pl-5 text-black/75 marker:font-semibold marker:text-gold-500">
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
        <div className="space-y-6">
          <Image src={brand.angel} alt="A small angel in a pale blue robe playing a trumpet" width={828} height={938} className="mx-auto h-auto w-full max-w-sm" />
          <div className="aspect-[4/3]">
            <Photo {...site.photos.mission} />
          </div>
        </div>
      </section>
      <Testimonials />
    </>
  );
}
