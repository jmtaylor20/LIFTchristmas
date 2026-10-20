import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { isSandbox } from "@/lib/sandbox";
import { AdminTitle, Empty } from "@/components/admin";
import { Notice } from "@/components/ui";
import { clearOutbox, deleteAllDataAction, loadSampleDataAction } from "../../actions";

export const metadata = { title: "Test mode" };

export default async function Sandbox({
  searchParams,
}: {
  searchParams: Promise<{ loaded?: string; wiped?: string; error?: string; email?: string }>;
}) {
  if (!isSandbox()) redirect("/admin");
  const sp = await searchParams;
  const emails = await db.sandboxEmail.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const open = emails.find((e) => e.id === sp.email) ?? emails[0];

  return (
    <>
      <AdminTitle title="Test mode" />
      <div className="mb-5 space-y-3">
        <Notice tone="warn">
          <strong>The site is in test mode.</strong> Try anything. No real emails are sent; each one appears in the Test Outbox below.
          When you&rsquo;re done, delete all test data, then turn test mode off in Netlify (<code>SANDBOX_MODE</code>).
        </Notice>
        {sp.loaded && <Notice tone="success">Loaded sample data: {sp.loaded} new angels.</Notice>}
        {sp.wiped && <Notice tone="success">All data deleted. The site is empty and ready for a fresh start.</Notice>}
        {sp.error === "confirm" && <Notice tone="error">Type DELETE (in capitals) to confirm.</Notice>}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <form action={loadSampleDataAction} className="card space-y-3">
          <h2 className="text-xl">Load sample data</h2>
          <p className="text-sm text-black/65">
            Adds a season for this year if there isn&rsquo;t one, with open deadlines, plus sample families: two approved with
            wish lists already on the Angel Tree, and one waiting for you to approve.
          </p>
          <button className="btn-green">Load sample data</button>
        </form>
        <form action={deleteAllDataAction} className="card space-y-3 border-star-100 bg-star-50/50">
          <h2 className="text-xl">Delete all test data</h2>
          <p className="text-sm text-black/65">
            Permanently deletes <strong>everything</strong>: seasons, families, angels, givers, gifts, notes, partners, and test
            emails. Use this when testing is done, before going live. It can&rsquo;t be undone.
          </p>
          <input name="confirm" placeholder="Type DELETE to confirm" autoComplete="off" className="input" />
          <button className="btn-primary">Delete everything</button>
        </form>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="card p-0">
          <div className="flex items-center justify-between border-b border-dusk-100 px-4 py-3">
            <h2 className="text-lg">Test Outbox ({emails.length})</h2>
            {emails.length > 0 && (
              <form action={clearOutbox}><button className="text-xs text-black/50 underline">Clear</button></form>
            )}
          </div>
          {emails.length === 0 ? (
            <div className="p-4"><Empty>No emails yet. Apply, sponsor, or give, and they&rsquo;ll show up here.</Empty></div>
          ) : (
            <ul className="max-h-[640px] divide-y divide-dusk-100 overflow-y-auto">
              {emails.map((e) => (
                <li key={e.id}>
                  <a
                    href={`/admin/sandbox?email=${e.id}`}
                    className={`block px-4 py-3 text-sm no-underline ${open?.id === e.id ? "bg-dusk-50" : "hover:bg-cream"}`}
                  >
                    <span className="block font-semibold text-ink">{e.subject}</span>
                    <span className="block text-xs text-black/55">
                      To {e.to} · {e.createdAt.toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card p-0">
          <p className="border-b border-dusk-100 px-5 py-3 text-sm text-black/60">
            {open ? <>To <strong>{open.to}</strong>: {open.subject}</> : "Select an email"}
          </p>
          {open && (
            <iframe
              title="Email"
              className="h-[700px] w-full rounded-b-2xl"
              // Links open in a new tab so sign-in links and family links can be followed.
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              srcDoc={open.html.replace("<head>", '<head><base target="_blank">').replace("<html>", '<html><head><base target="_blank"></head>')}
            />
          )}
        </div>
      </div>
    </>
  );
}
