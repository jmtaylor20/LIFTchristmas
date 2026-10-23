import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { wishlistsAreOpen } from "@/lib/season";
import { Notice, PageHero } from "@/components/ui";
import { LangToggle } from "@/components/LangToggle";
import { site } from "@/content/site";
import { dict, longDate, toLang } from "@/content/i18n";
import { addItem, removeItem, submitLists, updateAngelDetails } from "../actions";
import { ThankYouForm } from "./ThankYouForm";
import { InstallApp } from "@/components/InstallApp";

export const metadata = { title: "My family's Christmas page", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function FamilyPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string; lang?: string }>;
}) {
  const { token } = await params;
  const sp = await searchParams;
  const app = await db.application.findUnique({
    where: { accessToken: token },
    include: {
      season: true,
      household: true,
      angels: { include: { child: true, items: { orderBy: { sortOrder: "asc" } } }, orderBy: { ageAtSeason: "desc" } },
      thankYouNotes: {
        select: { id: true, message: true, status: true, createdAt: true, imageKey: true, angel: { select: { child: { select: { firstName: true } } } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!app) notFound();

  const lang = toLang(sp.lang ?? app.language);
  const t = dict[lang].family;
  const f = dict[lang].form;
  const { season } = app;
  const listsOpen = wishlistsAreOpen(season);
  const editable = app.status === "APPROVED" && !app.listSubmittedAt && listsOpen;
  const contact = <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>;
  const statusText =
    app.status === "APPROVED"
      ? app.listSubmittedAt
        ? t.statusApprovedDone
        : t.statusApprovedTodo
      : app.status === "PENDING"
        ? t.statusPending
        : app.status === "WAITLIST"
          ? t.statusWaitlist
          : t.statusDenied;

  return (
    <div lang={lang}>
      <PageHero eyebrow={dict[lang].christmas(season.year)} title={t.title(app.household.parentLastName)}>
        <p>
          {t.status}: <strong>{statusText}</strong>
        </p>
        <div className="mt-4"><LangToggle lang={lang} path={`/family/${token}`} /></div>
      </PageHero>

      <section className="container-page mt-10 max-w-4xl space-y-6">
        <InstallApp app="LIFT Family" lang={lang} />
        {app.status === "PENDING" && <Notice>{t.pending(app.household.email ?? "")}</Notice>}
        {app.status === "WAITLIST" && <Notice tone="warn">{t.waitlist}</Notice>}
        {app.status === "DENIED" && (
          <Notice tone="warn">
            {t.denied} {contact}.
          </Notice>
        )}

        {app.status === "APPROVED" && (
          <>
            {app.pickedUpAt ? (
              <Notice tone="success">{t.pickedUp(longDate(app.pickedUpAt, lang))}</Notice>
            ) : (
              season.pickupInstructions &&
              app.listSubmittedAt && (
                <div className="card bg-dusk-50">
                  <h2 className="text-xl">{t.pickup}</h2>
                  <p className="mt-1 whitespace-pre-line text-black/75">{season.pickupInstructions}</p>
                </div>
              )
            )}

            {editable ? (
              <Notice tone="success">
                <strong>{t.approved}</strong> {t.approvedHow(season.maxItemsPerChild)}
                {season.wishlistDeadline && (
                  <>
                    {" "}
                    {t.listsDue} <strong>{longDate(season.wishlistDeadline, lang)}</strong>.
                  </>
                )}
                <span className="mt-1 block">{t.tip(money(season.perChildBudgetCents))}</span>
              </Notice>
            ) : app.listSubmittedAt ? (
              !app.pickedUpAt && (
                <Notice tone="success">
                  {t.submittedOn(longDate(app.listSubmittedAt, lang))} {t.needChange} {contact}.
                </Notice>
              )
            ) : (
              <Notice tone="warn">{t.pastDeadline}</Notice>
            )}
            {sp.error === "empty" && <Notice tone="error">{t.emptyError}</Notice>}

            {!app.pickedUpAt &&
              app.angels.map((angel) => (
                <div key={angel.id} className="card">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-2xl">{angel.child.firstName}</h2>
                    <p className="text-sm text-black/55">
                      {t.ageLine(angel.gender === "GIRL" ? f.girl : angel.gender === "BOY" ? f.boy : f.childWord, angel.ageAtSeason)}
                      {angel.number != null && <> · Angel #{angel.number}</>}
                    </p>
                  </div>

                  {editable ? (
                    <form action={updateAngelDetails.bind(null, token, angel.id)} className="mt-4 grid gap-3 sm:grid-cols-4">
                      <SmallField label={t.shirt} name="shirtSize" defaultValue={angel.shirtSize} />
                      <SmallField label={t.pants} name="pantsSize" defaultValue={angel.pantsSize} />
                      <SmallField label={t.shoes} name="shoeSize" defaultValue={angel.shoeSize} />
                      <SmallField label={t.interests} name="interests" defaultValue={angel.interests} />
                      <button className="btn-outline btn-sm sm:col-span-4 sm:justify-self-start">{t.saveSizes}</button>
                    </form>
                  ) : (
                    <p className="mt-2 text-sm text-black/65">
                      {t.shirt} {angel.shirtSize || "—"} · {t.pants} {angel.pantsSize || "—"} · {t.shoes} {angel.shoeSize || "—"}
                      {angel.interests && <> · {t.loves} {angel.interests}</>}
                    </p>
                  )}

                  <h3 className="mt-6 text-lg">{t.wishList}</h3>
                  {angel.items.length === 0 && <p className="mt-1 text-sm text-black/55">{t.noItems}</p>}
                  <ul className="mt-2 divide-y divide-black/5">
                    {angel.items.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-3 py-2">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-black/55">
                            {[item.details, item.estPriceCents != null ? t.about(money(item.estPriceCents)) : null].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        {editable && item.status === "NEEDED" && (
                          <form action={removeItem.bind(null, token, item.id)}>
                            <button className="text-xs font-semibold text-star-700">{f.remove}</button>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>

                  {editable && angel.items.length < season.maxItemsPerChild && (
                    <form action={addItem.bind(null, token, angel.id)} className="mt-4 grid gap-3 rounded-xl bg-cream/60 p-4 sm:grid-cols-6">
                      <SmallField label={t.item} name="name" required placeholder={t.itemPh} className="sm:col-span-2" />
                      <SmallField label={t.details} name="details" placeholder={t.detailsPh} className="sm:col-span-2" />
                      <SmallField label={t.price} name="price" placeholder="$" inputMode="decimal" />
                      <SmallField label={t.link} name="url" placeholder="https://" />
                      <button className="btn-green btn-sm sm:col-span-6 sm:justify-self-start">{t.addItem}</button>
                    </form>
                  )}
                </div>
              ))}

            {app.listSubmittedAt && (
              <div className="card">
                <h2 className="text-2xl">{dict[lang].thankYou.title}</h2>
                <p className="mt-1 text-sm text-black/65">{dict[lang].thankYou.intro}</p>
                <div className="mt-4">
                  <ThankYouForm
                    token={token}
                    lang={lang}
                    kids={app.angels.map((a) => ({ angelId: a.id, firstName: a.child.firstName }))}
                  />
                </div>
                {app.thankYouNotes.length > 0 && (
                  <>
                    <h3 className="mt-6 text-lg">{dict[lang].thankYou.yours}</h3>
                    <ul className="mt-2 divide-y divide-black/5 text-sm">
                      {app.thankYouNotes.map((n) => (
                        <li key={n.id} className="flex items-start justify-between gap-3 py-2">
                          <span className="line-clamp-2">
                            {n.angel && <strong>{n.angel.child.firstName}: </strong>}
                            {n.message}
                            {n.imageKey && " 📷"}
                          </span>
                          <span className="shrink-0 text-xs text-black/55">
                            {n.status === "SENT" ? dict[lang].thankYou.delivered : n.status === "HELD" ? dict[lang].thankYou.held : dict[lang].thankYou.waiting}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {editable && (
              <form action={submitLists.bind(null, token)} className="card flex flex-wrap items-center justify-between gap-4 bg-dusk-50">
                <p className="max-w-xl text-sm text-black/70">{t.submitText}</p>
                <button className="btn-primary">{t.submit}</button>
              </form>
            )}
          </>
        )}
        <p className="pt-4 text-center text-xs text-black/45">
          <a href={`/family?other=1&lang=${lang}`} className="text-black/45">{lang === "es" ? "¿No es su familia? Busque su página" : "Not your family? Find your page"}</a>
        </p>
      </section>
    </div>
  );
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
