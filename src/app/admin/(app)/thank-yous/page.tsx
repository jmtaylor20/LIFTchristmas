import Link from "next/link";
import { db } from "@/lib/db";
import { getAdminSeason } from "@/lib/season";
import { noteRecipients } from "@/lib/thankyou";
import { formatDateShort } from "@/lib/format";
import { AdminTitle, Empty } from "@/components/admin";
import { Notice } from "@/components/ui";
import { holdThankYou, reopenThankYou, sendThankYou } from "../../actions";

export const metadata = { title: "Thank-you notes" };

export default async function ThankYous({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sent } = await searchParams;
  const season = (await getAdminSeason())!;
  const notes = await db.thankYouNote.findMany({
    where: { application: { seasonId: season.id } },
    select: {
      id: true,
      message: true,
      status: true,
      imageKey: true,
      createdAt: true,
      sentAt: true,
      sentCount: true,
      applicationId: true,
      application: { select: { household: { select: { parentFirstName: true, parentLastName: true } }, angels: { select: { number: true } } } },
      angel: { select: { number: true, child: { select: { firstName: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
  const pending = notes.filter((n) => n.status === "PENDING");
  const done = notes.filter((n) => n.status !== "PENDING");
  const recipients = Object.fromEntries(await Promise.all(pending.map(async (n) => [n.id, await noteRecipients(n.id)] as const)));

  return (
    <>
      <AdminTitle title="Thank-you notes" />
      <p className="mb-4 max-w-2xl text-sm text-black/60">
        Families can write thank-you notes from their family page. Read each one first: you can edit out anything personal, like last names,
        phone numbers, or addresses. Then send it to the child&rsquo;s sponsors.
      </p>
      {sent != null && <div className="mb-4"><Notice tone="success">Sent to {sent} sponsor{sent === "1" ? "" : "s"}.</Notice></div>}

      <h2 className="mb-3 text-xl font-bold">To review ({pending.length})</h2>
      {pending.length === 0 ? (
        <Empty>No notes waiting.</Empty>
      ) : (
        <div className="space-y-4">
          {pending.map((n) => {
            const to = recipients[n.id];
            return (
              <div key={n.id} className="card grid gap-4 md:grid-cols-[1fr_auto]">
                <form action={sendThankYou.bind(null, n.id)} className="space-y-3">
                  <p className="text-sm">
                    From the{" "}
                    <Link href={`/admin/applications/${n.applicationId}`}>{n.application.household.parentLastName} family</Link>
                    {n.angel ? <> · {n.angel.child.firstName} (Angel #{n.angel.number})</> : <> · whole family</>}
                    <span className="text-black/50"> · {formatDateShort(n.createdAt)}</span>
                  </p>
                  <textarea name="message" defaultValue={n.message} className="input min-h-28" />
                  <p className="text-xs text-black/55">
                    Goes to:{" "}
                    {to.length
                      ? to.map((r) => `${r.sponsor.firstName} ${r.sponsor.lastName}`).join(", ")
                      : "nobody yet. These children have no sponsors on record (for example, the ministry bought their gifts)."}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button className="btn-green btn-sm" disabled={to.length === 0}>Save &amp; send to sponsors</button>
                  </div>
                </form>
                <div className="flex flex-col items-end gap-2">
                  {n.imageKey && (
                    <a href={`/card/${n.imageKey}`} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/card/${n.imageKey}`} alt="Card photo" className="max-h-48 rounded-lg border border-black/10" />
                    </a>
                  )}
                  <form action={holdThankYou.bind(null, n.id)}>
                    <button className="text-xs text-black/50 underline">Don&rsquo;t send</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {done.length > 0 && (
        <>
          <h2 className="mt-8 mb-3 text-xl font-bold">Handled</h2>
          <div className="card overflow-x-auto p-0">
            <table className="table">
              <tbody>
                {done.map((n) => (
                  <tr key={n.id}>
                    <td className="whitespace-nowrap">{formatDateShort(n.createdAt)}</td>
                    <td>{n.application.household.parentLastName}{n.angel && ` · Angel #${n.angel.number}`}</td>
                    <td className="max-w-md"><span className="line-clamp-2">{n.message}</span>{n.imageKey && " 📷"}</td>
                    <td className="text-xs whitespace-nowrap">
                      {n.status === "SENT" ? `Sent to ${n.sentCount} · ${formatDateShort(n.sentAt)}` : "Not sent"}
                    </td>
                    <td>
                      {n.status === "HELD" && (
                        <form action={reopenThankYou.bind(null, n.id)}><button className="text-xs underline">Review again</button></form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
