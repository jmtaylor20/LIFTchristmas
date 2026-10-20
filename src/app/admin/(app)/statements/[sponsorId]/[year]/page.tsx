import Link from "next/link";
import { notFound } from "next/navigation";
import { buildStatement } from "@/lib/givers";
import { StatementView } from "@/components/StatementView";
import { PrintButton } from "@/components/PrintButton";
import { adminSendStatement } from "../../../../actions";

export const metadata = { title: "Statement" };

export default async function AdminStatement({ params }: { params: Promise<{ sponsorId: string; year: string }> }) {
  const { sponsorId, year: y } = await params;
  const year = Number(y);
  const s = await buildStatement(sponsorId, year);
  if (!s) notFound();
  return (
    <div className="space-y-4">
      <div className="no-print mx-auto flex max-w-2xl justify-between gap-2">
        <Link href={`/admin/statements?year=${year}`} className="text-sm">← Statements</Link>
        <div className="flex gap-2">
          <PrintButton />
          <form action={adminSendStatement.bind(null, sponsorId, year)}><button className="btn-outline btn-sm">Email to {s.sponsor.email}</button></form>
        </div>
      </div>
      <StatementView s={s} />
    </div>
  );
}
