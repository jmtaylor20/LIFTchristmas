import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { currentGiver } from "@/lib/auth";
import { buildStatement } from "@/lib/givers";
import { StatementView } from "@/components/StatementView";
import { Notice } from "@/components/ui";
import { PrintButton } from "@/components/PrintButton";
import { emailMyStatement } from "../../actions";

export const metadata = { title: "Giving statement", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyStatement({
  params,
  searchParams,
}: {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ emailed?: string }>;
}) {
  const giver = await currentGiver();
  if (!giver) redirect("/account");
  const year = Number((await params).year);
  if (!Number.isInteger(year)) notFound();
  const { emailed } = await searchParams;
  const s = await buildStatement(giver.id, year);
  if (!s) notFound();

  return (
    <section className="container-page mt-8 space-y-4">
      <div className="no-print mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-3">
        <Link href="/account" className="text-sm text-dusk-700">← My giving</Link>
        <div className="flex gap-2">
          <PrintButton />
          <form action={emailMyStatement.bind(null, year)}>
            <button className="btn-outline btn-sm">Email it to me</button>
          </form>
        </div>
      </div>
      {emailed && <div className="no-print mx-auto max-w-2xl"><Notice tone="success">Sent to {giver.email}.</Notice></div>}
      {s.isEmpty && (
        <div className="no-print mx-auto max-w-2xl">
          <Notice>Nothing has been received for {year} yet. Gifts appear here once the ministry marks them received.</Notice>
        </div>
      )}
      <StatementView s={s} />
    </section>
  );
}
