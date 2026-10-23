export function money(cents: number | null | undefined, opts: { cents?: boolean } = {}) {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : value % 1 === 0 ? 0 : 2,
  });
}

/** Parse "$12.50" / "12" into cents. Returns null for blank or invalid input. */
export function parseMoneyToCents(input: FormDataEntryValue | null | undefined): number | null {
  if (input == null) return null;
  const cleaned = String(input).replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function formatDate(d: Date | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!d) return "—";
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
    ...opts,
  });
}

export function formatDateShort(d: Date | null | undefined) {
  return formatDate(d, { month: "short", day: "numeric", year: "numeric" });
}

export function normalizeEmail(email: string | null | undefined) {
  const e = (email ?? "").trim().toLowerCase();
  return e || null;
}

export function phoneDigits(phone: string | null | undefined) {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
}

export function ageOn(birthDate: Date, on: Date) {
  let age = on.getUTCFullYear() - birthDate.getUTCFullYear();
  const m = on.getUTCMonth() - birthDate.getUTCMonth();
  if (m < 0 || (m === 0 && on.getUTCDate() < birthDate.getUTCDate())) age--;
  return age;
}

export function str(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export function optStr(fd: FormData, key: string) {
  return str(fd, key) || null;
}

/** Date-only input ("2026-11-15") → end of that day, US Central. */
export function parseDeadline(value: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T23:59:59-06:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toDateInput(d: Date | null | undefined) {
  if (!d) return "";
  return d.toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
}

export function genderLabel(g: "GIRL" | "BOY" | null | undefined) {
  return g === "GIRL" ? "Girl" : g === "BOY" ? "Boy" : "Child";
}

/** "age 7", or "under 1" for babies. */
export function ageText(age: number) {
  return age < 1 ? "under 1" : `age ${age}`;
}
