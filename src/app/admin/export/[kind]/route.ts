import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/auth";
import { getAdminSeason } from "@/lib/season";

function csv(rows: (string | number | null | undefined)[][]) {
  return rows
    .map((r) =>
      r
        .map((v) => {
          let s = v == null ? "" : String(v);
          // Prevent spreadsheet formula injection from user-entered text.
          if (/^[=+\-@]/.test(s)) s = `'${s}`;
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
}

const dollars = (c: number | null | undefined) => (c == null ? "" : (c / 100).toFixed(2));

export async function GET(_req: Request, { params }: { params: Promise<{ kind: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const season = await getAdminSeason();
  if (!season) return NextResponse.json({ error: "no season" }, { status: 404 });
  const { kind } = await params;
  let rows: (string | number | null | undefined)[][] = [];

  if (kind === "angels") {
    const items = await db.wishItem.findMany({
      where: { angel: { seasonId: season.id, application: { status: "APPROVED" } } },
      include: { angel: { include: { child: true, application: { include: { household: true } } } }, sponsorship: { include: { sponsor: true } } },
      orderBy: [{ angel: { number: "asc" } }, { sortOrder: "asc" }],
    });
    rows = [["Angel #", "Child", "Gender", "Age", "Shirt", "Pants", "Shoes", "Parent", "Phone", "Item", "Details", "Est $", "Status", "Sponsor", "Sponsor email", "Sponsor phone", "Ministry $ spent"]];
    for (const i of items) {
      const a = i.angel;
      const h = a.application.household;
      const sp = i.sponsorship?.sponsor;
      rows.push([a.number, `${a.child.firstName} ${a.child.lastName}`, a.gender, a.ageAtSeason, a.shirtSize, a.pantsSize, a.shoeSize, `${h.parentFirstName} ${h.parentLastName}`, h.phone, i.name, i.details, dollars(i.estPriceCents), i.status, sp ? `${sp.firstName} ${sp.lastName}` : "", sp?.email, sp?.phone, dollars(i.ministryCostCents)]);
    }
  } else if (kind === "sponsors") {
    const ss = await db.sponsorship.findMany({
      where: { seasonId: season.id, status: { not: "CANCELLED" } },
      include: { sponsor: true, angel: true, items: true },
      orderBy: { createdAt: "asc" },
    });
    rows = [["Sponsor", "Email", "Phone", "Organization", "Angel #", "Type", "Status", "Items", "Signed up"]];
    for (const s of ss) {
      rows.push([`${s.sponsor.firstName} ${s.sponsor.lastName}`, s.sponsor.email, s.sponsor.phone, s.sponsor.organization, s.angel.number, s.type, s.status, s.items.map((i) => i.name).join("; "), s.createdAt.toISOString().slice(0, 10)]);
    }
    const ds = await db.donation.findMany({ where: { seasonId: season.id, status: "PAID" } });
    rows.push([], ["Donor", "Email", "Amount", "Method", "Date", "Note"]);
    for (const d of ds) rows.push([d.donorName, d.donorEmail, dollars(d.amountCents), d.method, d.createdAt.toISOString().slice(0, 10), d.note]);
  } else if (kind === "applications") {
    const apps = await db.application.findMany({ where: { seasonId: season.id }, include: { household: true, angels: true }, orderBy: { createdAt: "asc" } });
    rows = [["Parent", "Phone", "Email", "Address", "Community", "Children", "Status", "Applied", "Lists submitted"]];
    for (const a of apps) {
      rows.push([`${a.household.parentFirstName} ${a.household.parentLastName}`, a.household.phone, a.household.email, `${a.address}, ${a.city} ${a.zip}`, a.community, a.angels.length, a.status, a.createdAt.toISOString().slice(0, 10), a.listSubmittedAt?.toISOString().slice(0, 10)]);
    }
  } else {
    return NextResponse.json({ error: "unknown export" }, { status: 404 });
  }

  return new NextResponse(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="lift-${kind}-${season.year}.csv"`,
    },
  });
}
