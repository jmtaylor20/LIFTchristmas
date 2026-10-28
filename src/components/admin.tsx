import type { ApplicationStatus, ItemStatus } from "@prisma/client";

export function AdminTitle({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 sm:mb-6">
      <h1 className="text-[1.7rem] leading-tight sm:text-3xl">{title}</h1>
      {children && <div className="no-print flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, sub, tone = "default" }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: "default" | "red" | "green" | "gold" }) {
  const tones = { default: "text-dusk-800", red: "text-star-700", green: "text-dusk-600", gold: "text-gold-500" };
  return (
    <div className="card p-4">
      <p className="text-xs font-semibold tracking-wide text-black/55 uppercase">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold sm:text-3xl ${tones[tone]}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-black/55">{sub}</p>}
    </div>
  );
}

const appTones: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  APPROVED: "bg-emerald-100 text-emerald-900",
  WAITLIST: "bg-sky-100 text-sky-900",
  DENIED: "bg-black/10 text-black/60",
};

export function AppBadge({ status }: { status: ApplicationStatus }) {
  return <span className={`badge ${appTones[status]}`}>{status.charAt(0) + status.slice(1).toLowerCase()}</span>;
}

const itemTones: Record<ItemStatus, [string, string]> = {
  NEEDED: ["bg-star-50 text-star-700", "Needed"],
  CLAIMED: ["bg-amber-100 text-amber-900", "Committed"],
  RECEIVED: ["bg-emerald-100 text-emerald-900", "Received"],
  MINISTRY: ["bg-sky-100 text-sky-900", "Ministry buying"],
};

export function ItemBadge({ status }: { status: ItemStatus }) {
  const [cls, label] = itemTones[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="card text-center text-sm text-black/55">{children}</div>;
}
