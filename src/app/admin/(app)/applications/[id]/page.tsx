import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { wishlistsAreOpen } from "@/lib/season";
import { ageText, formatDate, genderLabel, money, phoneDigits } from "@/lib/format";
import { siteUrl } from "@/lib/email";
import { AdminTitle, AppBadge, ItemBadge } from "@/components/admin";
import { Notice } from "@/components/ui";
import { decideApplication, lockLists, setChildGender, setFamilyEmail, unlockLists } from "../../../actions";
import { dict, toLang } from "@/content/i18n";

export const metadata = { title: "Application" };

export default async function ApplicationDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const app = await db.application.findUnique({
    where: { id },
    include: {
      season: true,
      household: {
        include: {
          applications: { include: { season: true }, orderBy: { season: { year: "desc" } } },
          children: { include: { angels: { include: { season: true } } } },
        },
      },
      angels: { include: { child: true, items: { orderBy: { sortOrder: "asc" } } }, orderBy: { ageAtSeason: "desc" } },
      documents: { select: { id: true, kind: true, contentType: true, url: true }, orderBy: { kind: "asc" } },
    },
  });
  if (!app) notFound();
  const h = app.household;
  const otherApproved = h.applications.filter((a) => a.status === "APPROVED" && a.id !== app.id);
  const atCap = otherApproved.length >= app.season.approvalCapYears;
  const portal = siteUrl(`/family/${app.accessToken}`);
  const digits = phoneDigits(h.phone);
  const smsHref =
    digits.length === 10 ? `sms:+1${digits}?&body=${encodeURIComponent(dict[toLang(app.language)].family.smsText(h.parentFirstName, portal))}` : null;
  const listsOpen = wishlistsAreOpen(app.season);
  const unknownGender = app.angels.filter((a) => !a.gender).length;
  const yn = (v: boolean | null) => (v == null ? null : v ? "Yes" : "No");

  return (
    <>
      <AdminTitle title={`${h.parentFirstName} ${h.parentLastName}`}>
        <Link href="/admin/applications" className="btn-outline btn-sm">← All applications</Link>
      </AdminTitle>
      <div className="mb-4 space-y-3">
        {sp.saved === "email" && <Notice tone="success">Email saved, and we emailed the family their link.</Notice>}
        {sp.saved && sp.saved !== "email" && <Notice tone="success">Saved.</Notice>}
        {sp.error === "email" && <Notice tone="error">That email address doesn&rsquo;t look right.</Notice>}
        {sp.error === "cap" && (
          <Notice tone="error">
            This family has already been approved {otherApproved.length} years, which meets the {app.season.approvalCapYears}-year cap. To
            make an exception, use &ldquo;Override the cap&rdquo; below.
          </Notice>
        )}
        {sp.error === "override" && <Notice tone="error">That override password isn&rsquo;t right. The family was not approved.</Notice>}
        {app.capOverrideAt && (
          <Notice>Approved past the {app.season.approvalCapYears}-year cap by override on {formatDate(app.capOverrideAt)}.</Notice>
        )}
        {unknownGender > 0 && (
          <Notice tone="warn">
            Set <strong>boy or girl</strong> for {unknownGender} child{unknownGender === 1 ? "" : "ren"} below. Sponsors see it on the Angel Tree.
          </Notice>
        )}
        {app.priorHelp && app.priorHelpYears && (
          <Notice>
            <strong>Helped before (as the family told us):</strong> {app.priorHelpYears}. Check this against the {app.season.approvalCapYears}-year cap.
          </Notice>
        )}
        {atCap && !sp.error && (
          <Notice tone="warn">
            <strong>Approval cap reached:</strong> approved in {otherApproved.map((a) => a.season.year).join(", ")} ({otherApproved.length} of {app.season.approvalCapYears} years).
          </Notice>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl">Application · Christmas {app.season.year}</h2>
              <AppBadge status={app.status} />
            </div>
            {app.source === "import" && <p className="mt-1 text-xs text-black/50">Imported from the Google Form</p>}
            <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <D k="Phone" v={h.phone} />
              <D k="Email" v={h.email ?? "None given"} />
              <D k="Address" v={[app.address, app.city !== "" && !app.address.toLowerCase().includes(app.city.toLowerCase()) ? app.city : null, app.zip && !app.address.includes(app.zip) ? app.zip : null].filter(Boolean).join(", ")} />
              <D k="Community" v={app.community} />
              <D k="Job / employer" v={app.employer} />
              <D k="At this job" v={app.jobLength} />
              <D k="Helped by Community Christmas before" v={[yn(app.priorHelp), app.priorHelpYears].filter(Boolean).join(" · ") || null} />
              <D k="Help from another agency" v={[yn(app.otherAgencyHelp), app.assistancePrograms].filter(Boolean).join(" · ") || null} />
              {app.adultsInHome != null && <D k="Adults in home" v={String(app.adultsInHome)} />}
              {app.monthlyIncomeCents != null && <D k="Monthly income" v={money(app.monthlyIncomeCents)} />}
              {app.churchHome && <D k="Church home" v={app.churchHome} />}
              {app.referredBy && <D k="Referred by" v={app.referredBy} />}
              <D k="Applied" v={formatDate(app.createdAt)} />
              <D k="Signed" v={app.signatureName ? `${app.signatureName}${app.signedAt ? `, ${formatDate(app.signedAt)}` : ""}` : null} />
            </dl>
            <h3 className="mt-5 text-sm font-semibold text-black/60 uppercase">Documents</h3>
            {app.documents.length === 0 ? (
              <p className="mt-1 text-sm text-black/55">None attached.</p>
            ) : (
              <ul className="mt-1 flex flex-wrap gap-2 text-sm">
                {app.documents.map((d) => (
                  <li key={d.id}>
                    <a href={d.url ?? `/admin/document/${d.id}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                      {d.kind === "PHOTO_ID" ? "Photo ID" : "Income proof"} ↗
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {app.documents.some((d) => d.url) && (
              <p className="mt-1 text-xs text-black/50">These open in Google Drive. Sign in with an account the form&rsquo;s owner has shared them with.</p>
            )}
            {app.circumstances && (
              <>
                <h3 className="mt-5 text-sm font-semibold text-black/60 uppercase">Their story</h3>
                <p className="mt-1 whitespace-pre-line text-sm">{app.circumstances}</p>
              </>
            )}
          </div>

          <div className="card">
            <h2 className="text-xl">Children</h2>
            <div className="mt-3 space-y-4">
              {app.angels.map((a) => {
                const pastYears = a.child.id ? h.children.find((c) => c.id === a.child.id)?.angels.filter((x) => x.seasonId !== app.seasonId).map((x) => x.season.year) : [];
                return (
                  <div key={a.id} className="rounded-xl border border-black/5 p-4">
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-semibold">
                        {a.child.firstName} {a.child.lastName} · {genderLabel(a.gender)}, {ageText(a.ageAtSeason)}
                        <Link href={`/admin/angels/${a.id}`} className="ml-2 text-sm">{a.number != null ? `Angel #${a.number}` : "Edit list"} →</Link>
                      </p>
                      <span className="text-xs text-black/50">
                        {a.child.birthDate && <>Born {formatDate(a.child.birthDate, { timeZone: "UTC" })}</>}
                        {pastYears && pastYears.length > 0 && <> · also served {pastYears.join(", ")}</>}
                      </span>
                    </div>
                    <p className="text-xs text-black/55">
                      Clothing {a.shirtSize || "—"}{a.pantsSize && <> · Pants {a.pantsSize}</>} · Shoes {a.shoeSize || "—"}
                      {a.child.race && <> · {a.child.race}</>} {a.interests && <>· {a.interests}</>}
                    </p>
                    <form key={a.gender ?? "unset"} action={setChildGender.bind(null, a.id)} className="mt-2 flex items-center gap-2 text-sm">
                      <select name="gender" defaultValue={a.gender ?? ""} className={`input w-auto py-1 ${a.gender ? "" : "border-star-300 bg-star-50"}`}>
                        <option value="" disabled>Boy or girl?</option>
                        <option value="GIRL">Girl</option>
                        <option value="BOY">Boy</option>
                      </select>
                      <button className="btn-outline btn-sm">Save</button>
                    </form>
                    {a.items.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm">
                        {a.items.map((i) => (
                          <li key={i.id} className="flex justify-between gap-2">
                            <span>{i.name}{i.details && <span className="text-black/50"> — {i.details}</span>}</span>
                            <ItemBadge status={i.status} />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
            {app.status === "APPROVED" && (
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                {app.listSubmittedAt ? (
                  <>
                    <span>Lists submitted {formatDate(app.listSubmittedAt)}.</span>
                    {listsOpen ? (
                      <form action={unlockLists.bind(null, app.id)}><button className="btn-outline btn-sm">Unlock so parent can edit</button></form>
                    ) : (
                      <span className="text-black/55">Locked after the wish-list deadline. Use &ldquo;Edit list&rdquo; on a child to make changes.</span>
                    )}
                  </>
                ) : (
                  <>
                    <span>Lists not submitted yet.</span>
                    <form action={lockLists.bind(null, app.id)}><button className="btn-outline btn-sm">Mark lists submitted (publish)</button></form>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <form action={decideApplication.bind(null, app.id)} className="card space-y-3">
            <h2 className="text-xl">Decision</h2>
            <div className="grid grid-cols-2 gap-2">
              {(["APPROVED", "WAITLIST", "DENIED", "PENDING"] as const).map((s) => (
                <label key={s} className="flex items-center gap-2 rounded-lg border border-black/10 px-3 py-2 text-sm has-checked:border-dusk-600 has-checked:bg-dusk-50">
                  <input type="radio" name="status" value={s} defaultChecked={app.status === s} className="accent-dusk-700" disabled={s === "APPROVED" && atCap && app.status !== "APPROVED"} />
                  {s === "APPROVED" ? "Approve" : s === "WAITLIST" ? "Waitlist" : s === "DENIED" ? "Deny" : "Pending"}
                </label>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="notify" defaultChecked className="h-4 w-4 accent-dusk-700" /> Email the family about this decision
            </label>
            {!h.email && (
              <p className="text-xs text-star-800">
                No email on file, so no email will go out. Call or text {h.phone} with the decision, or tap &ldquo;Text family their link&rdquo; below so they can check their status.
              </p>
            )}
            <textarea name="message" placeholder="Optional personal note to include in the email" className="input min-h-16" />
            <textarea name="adminNotes" defaultValue={app.adminNotes ?? ""} placeholder="Private notes (only admins see these)" className="input min-h-16" />
            <button className="btn-green w-full">Save decision</button>
          </form>

          {atCap && app.status !== "APPROVED" && (
            <form action={decideApplication.bind(null, app.id)} className="card space-y-3 border-star-100 bg-star-50/60">
              <h2 className="text-xl">Override the cap</h2>
              <p className="text-sm text-black/65">
                This family has reached the {app.season.approvalCapYears}-year limit. To approve them anyway, enter the override
                password. The override is recorded on this application.
              </p>
              <input type="hidden" name="status" value="APPROVED" />
              <input
                name="overridePassword"
                type="password"
                required
                autoComplete="off"
                autoCapitalize="characters"
                placeholder="Override password"
                className="input"
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="notify" defaultChecked className="h-4 w-4 accent-dusk-700" /> Email the family that they&rsquo;re approved
              </label>
              <textarea name="message" placeholder="Optional personal note to include in the email" className="input min-h-16" />
              <button className="btn-primary w-full">Approve with override</button>
            </form>
          )}

          <div className="card space-y-3 text-sm">
            <h2 className="text-lg">Family&rsquo;s private link</h2>
            <p className="text-xs text-black/55">
              Their family page shows their status, wish lists, and pickup details. It needs no password, so send it only to the parent.
            </p>
            {smsHref && (
              <a href={smsHref} className="btn-green w-full">
                Text family their link
              </a>
            )}
            <input readOnly value={portal} aria-label="Family's private link" className="input font-mono text-xs" />
            <form action={setFamilyEmail.bind(null, app.id)} className="space-y-2 border-t border-black/5 pt-3">
              <label className="block">
                <span className="label">{h.email ? "Parent's email" : "Add the parent's email"}</span>
                <input name="email" type="email" required defaultValue={h.email ?? ""} placeholder="parent@example.com" className="input" />
              </label>
              <button className="btn-outline btn-sm">{h.email ? "Save & email their link again" : "Save & email their link"}</button>
              <p className="text-xs text-black/50">Once they have an email on file, they get decision, reminder, and pickup emails automatically.</p>
            </form>
          </div>

          <div className="card">
            <h2 className="text-lg">History</h2>
            <p className="text-sm text-black/60">
              Approved {otherApproved.length + (app.status === "APPROVED" ? 1 : 0)} of {app.season.approvalCapYears} allowed years
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {h.applications.map((a) => (
                <li key={a.id} className="flex justify-between">
                  <Link href={`/admin/applications/${a.id}`}>{a.season.year}</Link>
                  <AppBadge status={a.status} />
                </li>
              ))}
            </ul>
            <Link href={`/admin/families/${h.id}`} className="mt-3 inline-block text-sm text-star-700">Full family record →</Link>
          </div>

        </div>
      </div>
    </>
  );
}

function D({ k, v }: { k: string; v: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs text-black/50">{k}</dt>
      <dd>{v || "—"}</dd>
    </div>
  );
}
