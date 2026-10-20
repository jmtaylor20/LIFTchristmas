import { PageHero } from "@/components/ui";
import { resendFamilyLink } from "./actions";

export const metadata = { title: "Find my family's page" };

export default async function FamilyLookup({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  return (
    <>
      <PageHero eyebrow="Families" title="Get your private link again">
        <p>Enter the email or phone number you applied with and we&rsquo;ll email your family&rsquo;s link.</p>
      </PageHero>
      <section className="container-page mt-10 max-w-lg">
        {sent ? (
          <div className="card">
            <p>If we found an application for this season, we just emailed the link to the address on file. Please check your inbox (and spam folder).</p>
          </div>
        ) : (
          <form action={resendFamilyLink} className="card space-y-4">
            <label className="block">
              <span className="label">Email or phone number</span>
              <input name="lookup" required className="input" />
            </label>
            <button className="btn-green">Email me my link</button>
          </form>
        )}
      </section>
    </>
  );
}
