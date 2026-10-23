import Link from "next/link";
import { requireAdminSeason } from "@/lib/season";
import { AdminTitle } from "@/components/admin";
import { Notice } from "@/components/ui";
import { importApplications } from "../../../actions";

export const metadata = { title: "Import applications" };

export default async function ImportApplications({
  searchParams,
}: {
  searchParams: Promise<{ added?: string; already?: string; left?: string; problems?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const season = await requireAdminSeason();
  const left = Number(sp.left ?? 0);

  return (
    <>
      <AdminTitle title="Import applications">
        <Link href="/admin/applications" className="btn-outline btn-sm">← All applications</Link>
      </AdminTitle>
      <div className="max-w-2xl space-y-4">
        {sp.error === "file" && <Notice tone="error">Choose the CSV file to import.</Notice>}
        {sp.error === "format" && <Notice tone="error">That file doesn&rsquo;t look like the Community Christmas application export.</Notice>}
        {sp.added != null && (
          <Notice tone={left > 0 ? "warn" : "success"}>
            Added {sp.added} application{sp.added === "1" ? "" : "s"} to Christmas {season.year}.
            {Number(sp.already) > 0 && <> {sp.already} were already here and were skipped.</>}
            {left > 0 && <> {left} still to go. Upload the same file again to finish.</>}
          </Notice>
        )}
        {sp.problems && (
          <Notice tone="warn">
            <strong>Not imported:</strong>
            <ul className="mt-1 list-disc pl-5">
              {sp.problems.split("\n").map((p) => <li key={p}>{p}</li>)}
            </ul>
          </Notice>
        )}

        <form action={importApplications} className="card space-y-4">
          <h2 className="text-xl">From the Google Form</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-black/70">
            <li>In the Google Form, open <strong>Responses</strong> and click <strong>Link to Sheets</strong> (or the ⋮ menu → <strong>Download responses (.csv)</strong>).</li>
            <li>In Google Sheets, choose <strong>File → Download → Comma-separated values (.csv)</strong>.</li>
            <li>Upload that file here. Each response becomes a <strong>pending</strong> application for Christmas {season.year}, with its children, sizes, and wish lists.</li>
          </ol>
          <input type="file" name="csv" accept=".csv,text/csv" required className="input" />
          <button className="btn-green">Import applications</button>
          <p className="text-xs text-black/55">
            Uploading the same file again is safe: responses already imported are skipped, so you can re-import a newer export
            to add late applications. Photo IDs and pay stubs stay in the form owner&rsquo;s Google Drive and open from each
            application. Children are marked girl or boy only when the parent&rsquo;s sizes say so (for example
            &ldquo;Women&rsquo;s 9&rdquo;); set the rest on each application before approving.
          </p>
        </form>
      </div>
    </>
  );
}
