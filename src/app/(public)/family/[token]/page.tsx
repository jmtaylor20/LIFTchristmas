import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { formatDate, genderLabel, money } from "@/lib/format";
import { wishlistsAreOpen } from "@/lib/season";
import { Notice, PageHero } from "@/components/ui";
import { site } from "@/content/site";
import { addItem, removeItem, submitLists, updateAngelDetails } from "../actions";

export const metadata = { title: "My family's Christmas page", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function FamilyPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { token } = await params;
  const { error } = await searchParams;
  const app = await db.application.findUnique({
    where: { accessToken: token },
    include: {
      season: true,
      household: true,
      angels: { include: { child: true, items: { orderBy: { sortOrder: "asc" } } }, orderBy: { ageAtSeason: "desc" } },
    },
  });
  if (!app) notFound();

  const { season } = app;
  const listsOpen = wishlistsAreOpen(season);
  const editable = app.status === "APPROVED" && !app.listSubmittedAt && listsOpen;

  return (
    <>
      <PageHero eyebrow={`Christmas ${season.year}`} title={`The ${app.household.parentLastName} family`}>
        <StatusLine status={app.status} submitted={!!app.listSubmittedAt} />
      </PageHero>

      <section className="container-page mt-10 max-w-4xl space-y-6">
        {app.status === "PENDING" && (
          <Notice>
            Thank you for applying! Our team is reviewing applications now. We&rsquo;ll email {app.household.email} when a
            decision is made. You can come back to this page any time.
          </Notice>
        )}
        {app.status === "WAITLIST" && (
          <Notice tone="warn">
            Your application is on our waiting list. We&rsquo;ll contact you if a spot opens up. Thank you for your patience.
          </Notice>
        )}
        {app.status === "DENIED" && (
          <Notice tone="warn">
            We&rsquo;re sorry, we aren&rsquo;t able to sponsor your family this year. If you have questions, please email{" "}
            <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
          </Notice>
        )}

        {app.status === "APPROVED" && (
          <>
            {editable ? (
              <Notice tone="success">
                <strong>Good news: you&rsquo;re approved!</strong> Please add up to {season.maxItemsPerChild} wish-list items for
                each child, then press <em>Submit wish lists</em> at the bottom.
                {season.wishlistDeadline && <> Lists are due by <strong>{formatDate(season.wishlistDeadline)}</strong>.</>}
                <span className="mt-1 block">
                  Tip: a sponsor usually spends about {money(season.perChildBudgetCents)} per child. Include a mix of needs
                  (clothes, shoes, coats) and wants, and add a few lower-priced items.
                </span>
              </Notice>
            ) : app.listSubmittedAt ? (
              <Notice tone="success">
                Your wish lists were submitted on {formatDate(app.listSubmittedAt)}. Your children are on our Angel Tree. Need
                to change something? Email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.
              </Notice>
            ) : (
              <Notice tone="warn">The wish-list deadline has passed. Please contact us if you need help.</Notice>
            )}
            {error === "empty" && <Notice tone="error">Every child needs at least one item before you submit.</Notice>}

            {app.angels.map((angel) => (
              <div key={angel.id} className="card">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-2xl font-bold">{angel.child.firstName}</h2>
                  <p className="text-sm text-black/55">
                    {genderLabel(angel.gender)}, age {angel.ageAtSeason}
                    {angel.number != null && <> · Angel #{angel.number}</>}
                  </p>
                </div>

                {editable ? (
                  <form action={updateAngelDetails.bind(null, token, angel.id)} className="mt-4 grid gap-3 sm:grid-cols-4">
                    <SmallField label="Shirt" name="shirtSize" defaultValue={angel.shirtSize} />
                    <SmallField label="Pants" name="pantsSize" defaultValue={angel.pantsSize} />
                    <SmallField label="Shoes" name="shoeSize" defaultValue={angel.shoeSize} />
                    <SmallField label="Interests" name="interests" defaultValue={angel.interests} />
                    <button className="btn-outline btn-sm sm:col-span-4 sm:justify-self-start">Save sizes &amp; interests</button>
                  </form>
                ) : (
                  <p className="mt-2 text-sm text-black/65">
                    Shirt {angel.shirtSize || "—"} · Pants {angel.pantsSize || "—"} · Shoes {angel.shoeSize || "—"}
                    {angel.interests && <> · Loves {angel.interests}</>}
                  </p>
                )}

                <h3 className="mt-6 text-lg font-bold">Wish list</h3>
                {angel.items.length === 0 && <p className="mt-1 text-sm text-black/55">No items yet.</p>}
                <ul className="mt-2 divide-y divide-black/5">
                  {angel.items.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-3 py-2">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-black/55">
                          {[item.details, item.estPriceCents != null ? `about ${money(item.estPriceCents)}` : null].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      {editable && item.status === "NEEDED" && (
                        <form action={removeItem.bind(null, token, item.id)}>
                          <button className="text-xs font-semibold text-copper-700">Remove</button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>

                {editable && angel.items.length < season.maxItemsPerChild && (
                  <form action={addItem.bind(null, token, angel.id)} className="mt-4 grid gap-3 rounded-xl bg-cream/60 p-4 sm:grid-cols-6">
                    <SmallField label="Item" name="name" required placeholder="e.g. Winter coat" className="sm:col-span-2" />
                    <SmallField label="Size / color / details" name="details" placeholder="Youth L, blue" className="sm:col-span-2" />
                    <SmallField label="About how much?" name="price" placeholder="$" inputMode="decimal" />
                    <SmallField label="Link (optional)" name="url" placeholder="https://" />
                    <button className="btn-green btn-sm sm:col-span-6 sm:justify-self-start">+ Add item</button>
                  </form>
                )}
              </div>
            ))}

            {editable && (
              <form action={submitLists.bind(null, token)} className="card flex flex-wrap items-center justify-between gap-4 bg-dusk-50">
                <p className="max-w-xl text-sm text-black/70">
                  When every child&rsquo;s list is ready, submit it. Your children will appear on our Angel Tree by angel number,
                  age, and wish list only. We never show names publicly. You won&rsquo;t be able to change lists after this.
                </p>
                <button className="btn-primary">Submit wish lists</button>
              </form>
            )}
          </>
        )}
      </section>
    </>
  );
}

function StatusLine({ status, submitted }: { status: string; submitted: boolean }) {
  const text =
    status === "APPROVED"
      ? submitted
        ? "Approved · wish lists submitted"
        : "Approved · please make your wish lists"
      : status === "PENDING"
        ? "Application received · under review"
        : status === "WAITLIST"
          ? "On the waiting list"
          : "Not approved this year";
  return <p>Status: <strong>{text}</strong></p>;
}

function SmallField({
  label,
  className = "",
  defaultValue,
  ...props
}: { label: string; className?: string; defaultValue?: string | null } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue">) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium text-black/60">{label}</span>
      <input className="input" defaultValue={defaultValue ?? ""} {...props} />
    </label>
  );
}
