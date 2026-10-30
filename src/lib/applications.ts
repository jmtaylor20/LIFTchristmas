import { createHash } from "node:crypto";
import type { DocumentKind, Gender, Prisma } from "@prisma/client";
import { findHousehold } from "./households";
import { normalizeEmail, phoneDigits } from "./format";
import { randomToken } from "./tokens";

type Tx = Prisma.TransactionClient;

export { MAX_CHILDREN, MAX_DOCUMENT_BYTES, WISHES_PER_CHILD } from "./applicationLimits";

// Imported wish lists are free text; keep at most this many items per child.
const MAX_IMPORTED_WISHES = 8;

export type NewChild = {
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender | null;
  clothing: string | null;
  shoe: string | null;
  race: string | null;
  wishes: { name: string; details?: string | null }[];
};

export type NewApplication = {
  seasonId: string;
  parentFirstName: string;
  parentLastName: string;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  zip: string;
  employer: string | null;
  jobLength: string | null;
  hasJob?: boolean | null;
  lookingForWork?: boolean | null;
  annualIncomeCents?: number | null;
  priorHelp: boolean | null;
  priorHelpYears: string | null;
  otherAgencyHelp: boolean | null;
  agencyNames: string | null;
  signatureName: string | null;
  signedAt: Date | null;
  language: string;
  children: NewChild[];
  documents: { kind: DocumentKind; data?: Uint8Array<ArrayBuffer>; contentType?: string; url?: string }[];
  source?: "web" | "import";
  importKey?: string;
  createdAt?: Date;
  // Imported lists came in with the application, so they count as submitted.
  listsSubmitted?: boolean;
};

/** Communities the ministry serves by name; anything else is labeled with its city. */
export function communityFor(city: string, address = "") {
  const text = `${address} ${city}`;
  if (/reeltown/i.test(text)) return "Reeltown";
  if (/tallassee/i.test(text)) return "Tallassee";
  return city.trim() || "Other";
}

/** "7", "6 almost 7", "1.5", "21 months", "2 months" → whole years (babies are 0). */
export function parseAge(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*(months?|mos?\b|m\b)?/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Math.floor(m[2] ? n / 12 : n);
}

/** Creates the household (or finds the returning one), the application, each child, and their wish lists. */
export async function createApplication(tx: Tx, a: NewApplication) {
  const householdData = {
    parentFirstName: a.parentFirstName,
    parentLastName: a.parentLastName,
    phone: a.phone,
    phoneDigits: phoneDigits(a.phone),
    address: a.address,
    city: a.city,
    zip: a.zip,
    ...(a.email ? { email: a.email, emailNormalized: normalizeEmail(a.email) } : {}),
  };
  let household = await findHousehold(tx, a.email, a.phone);
  if (household) {
    const existing = await tx.application.findUnique({
      where: { seasonId_householdId: { seasonId: a.seasonId, householdId: household.id } },
    });
    if (existing) return { duplicate: true as const, appId: existing.id };
    household = await tx.household.update({ where: { id: household.id }, data: householdData });
  } else {
    household = await tx.household.create({ data: householdData });
  }

  const accessToken = randomToken();
  const app = await tx.application.create({
    data: {
      seasonId: a.seasonId,
      householdId: household.id,
      accessToken,
      community: communityFor(a.city, a.address),
      address: a.address,
      city: a.city,
      zip: a.zip,
      employer: a.employer,
      jobLength: a.jobLength,
      hasJob: a.hasJob ?? null,
      lookingForWork: a.lookingForWork ?? null,
      annualIncomeCents: a.annualIncomeCents ?? null,
      priorHelp: a.priorHelp,
      priorHelpYears: a.priorHelpYears,
      otherAgencyHelp: a.otherAgencyHelp,
      assistancePrograms: a.agencyNames,
      signatureName: a.signatureName,
      signedAt: a.signedAt,
      agreedToTerms: true,
      language: a.language,
      source: a.source ?? "web",
      importKey: a.importKey,
      listSubmittedAt: a.listsSubmitted && a.children.some((c) => c.wishes.length > 0) ? (a.createdAt ?? new Date()) : null,
      ...(a.createdAt ? { createdAt: a.createdAt } : {}),
    },
  });

  // Re-use child records from earlier years so each child's history carries over.
  const knownKids = await tx.child.findMany({ where: { householdId: household.id } });
  for (const c of a.children) {
    const match = knownKids.find((k) => k.firstName.trim().toLowerCase() === c.firstName.trim().toLowerCase());
    const child = match
      ? await tx.child.update({
          where: { id: match.id },
          data: { gender: c.gender ?? match.gender, race: c.race ?? match.race, lastName: c.lastName || match.lastName },
        })
      : await tx.child.create({
          data: { householdId: household.id, firstName: c.firstName, lastName: c.lastName, gender: c.gender, race: c.race },
        });
    await tx.angel.create({
      data: {
        seasonId: a.seasonId,
        applicationId: app.id,
        childId: child.id,
        ageAtSeason: c.age,
        gender: c.gender ?? child.gender,
        shirtSize: c.clothing,
        shoeSize: c.shoe,
        items: { create: c.wishes.map((w, i) => ({ name: w.name, details: w.details ?? null, sortOrder: i })) },
      },
    });
  }

  for (const d of a.documents) {
    await tx.applicationDocument.create({
      data: { applicationId: app.id, kind: d.kind, data: d.data, contentType: d.contentType, url: d.url },
    });
  }
  return { duplicate: false as const, appId: app.id, accessToken };
}

// ---------------------------------------------------------------------------
// Importing responses exported from the Google Form (File → Download → CSV).

/** Minimal RFC 4180 CSV parser (quoted fields may contain commas, quotes, and newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

const CITIES = [
  "Tallassee", "Reeltown", "Eclectic", "Wetumpka", "Notasulga", "Dadeville", "Titus", "Prattville", "Auburn", "Opelika",
  "Jackson's Gap", "Jacksons Gap", "Montgomery", "Tuskegee", "Alexander City", "Millbrook", "Deatsville", "Waverly", "Camp Hill",
];

/** Pulls the city and ZIP out of a one-line address like "530 Derry St Tallassee Alabama 36078". */
export function splitAddress(raw: string) {
  const address = raw.replace(/\s*\n\s*/g, ", ").replace(/\s+/g, " ").trim();
  const city = CITIES.find((c) => new RegExp(`\\b${c.replace("'", "'?")}\\b`, "i").test(address))?.replace("Jacksons Gap", "Jackson's Gap") ?? "";
  const zip = address.match(/\b(\d{5})(?:-\d{4})?\b(?!.*\b\d{5}\b)/)?.[1] ?? "";
  return { address, city, zip };
}

/** A parent's own size labels ("Women's 9", "girls 14/16", "Men's 7") say whether the child is a girl or boy. */
function genderFromText(...texts: string[]): Gender | null {
  const t = texts.join(" ").toLowerCase();
  const girl = /\b(girl|girls|women|women's|women’s|womens|woman's|woman’s|ladies|lady|she|her)\b|\(girl\)/.test(t);
  const boy = /\b(boy|boys|men|men's|men’s|mens|he|his|husky)\b|\(boy\)/.test(t);
  return girl === boy ? null : girl ? "GIRL" : "BOY";
}

/** Splits a free-text wish list into items: one per line, or comma-separated when written on one line. */
export function splitWishes(text: string): { name: string; details?: string | null }[] {
  const clean = (s: string) =>
    s
      .replace(/^\s*(?:\d+\s*[.)]+\s*\)?|[•\-*–]\s*)/, "")
      .trim()
      .replace(/[.,;]+$/, "")
      .trim();
  let parts = text.split(/\r?\n/).map(clean).filter(Boolean);
  if (parts.length === 1 && parts[0].includes(",")) {
    const pieces = splitTopLevelCommas(parts[0]).map(clean).filter(Boolean);
    if (pieces.every((p) => p.length <= 120)) parts = pieces;
  }
  return parts.slice(0, MAX_IMPORTED_WISHES).map((p) =>
    p.length > 140 ? { name: `${p.slice(0, 120).replace(/\s+\S*$/, "")}…`, details: p } : { name: p },
  );
}

/** Splits on commas that aren't inside parentheses: "art (paint, brushes), candles" → 2 parts. */
function splitTopLevelCommas(text: string) {
  const out: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

/** "https://drive.google.com/u/4/open?usp=forms_web&id=ABC" → "https://drive.google.com/open?id=ABC". */
function driveLink(url: string) {
  const id = url.match(/[?&]id=([\w-]+)/)?.[1];
  return id ? `https://drive.google.com/open?id=${id}` : url.trim();
}

/** "2026/10/20 8:19:28 AM EST" → Date. */
function formTimestamp(text: string) {
  const m = text.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[4]) % 12;
  if (m[7].toUpperCase() === "PM") h += 12;
  const pad = (n: string | number) => String(n).padStart(2, "0");
  const d = new Date(`${m[1]}-${pad(m[2])}-${pad(m[3])}T${pad(h)}:${m[5]}:${m[6]}-05:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function splitName(full: string) {
  const parts = full.replace(/\s+/g, " ").trim().split(" ");
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts.slice(0, -1).join(" "), last: parts[parts.length - 1] };
}

const yesNo = (v: string) => (/^\s*yes/i.test(v) ? true : /^\s*no\b/i.test(v) ? false : null);
const blank = (v: string | undefined) => {
  const t = (v ?? "").trim();
  return !t || /^(n\/?a|na|none|no|0|o)$/i.test(t) ? null : t;
};

export type ImportRow = { row: number; data?: Omit<NewApplication, "seasonId">; error?: string };

/** Turns a Google Form CSV export into applications ready to create. */
export function parseGoogleFormCsv(text: string): ImportRow[] {
  const [header, ...rows] = parseCsv(text);
  if (!header) return [];
  const h = header.map((c) => c.replace(/\s+/g, " ").trim().toLowerCase());
  const col = (test: (c: string) => boolean) => h.findIndex(test);
  const idx = {
    timestamp: col((c) => c === "timestamp"),
    name: col((c) => c.includes("parent") && c.includes("full name")),
    address: col((c) => c.startsWith("address")),
    phone: col((c) => c.includes("phone")),
    employer: col((c) => c.includes("employer")),
    jobLength: col((c) => c.includes("how long")),
    photoId: col((c) => c.includes("photo id") || c.includes("driver")),
    income: col((c) => c.includes("pay stub") || c.includes("income")),
    priorHelp: col((c) => c.includes("received help from community christmas")),
    priorYears: col((c) => c.startsWith("if yes")),
    agency: col((c) => c.includes("receiving help from another agency") && !c.includes("list")),
    agencyNames: col((c) => c.includes("agency names")),
    printed: col((c) => c.includes("printed name")),
    signature: col((c) => c.includes("signature")),
    date: col((c) => c === "date"),
  };
  if (idx.name < 0 || idx.phone < 0) throw new Error("This doesn't look like the Community Christmas application export.");

  // Each child's columns start at a "Child Name" column; classify the rest by keyword.
  type ChildCols = Partial<Record<"name" | "age" | "clothing" | "shoe" | "race" | "wish", number>>;
  const kids: ChildCols[] = [];
  h.forEach((c, i) => {
    if (/child name/.test(c)) kids.push({ name: i });
    else if (kids.length && !c.includes("agreement") && !c.includes("printed") && !c.includes("signature") && c !== "date") {
      const k = kids[kids.length - 1];
      const key = c.includes("wish") ? "wish" : c.includes("race") ? "race" : c.includes("shoe") ? "shoe" : c.includes("clothing") ? "clothing" : c.includes("age") ? "age" : null;
      if (key && k[key] == null) k[key] = i;
    }
  });

  return rows.map((r, n) => {
    const get = (i: number | undefined) => (i == null || i < 0 ? "" : (r[i] ?? "").trim());
    const rowNum = n + 2;
    const full = get(idx.name);
    const phone = get(idx.phone);
    if (!full || !phone) return { row: rowNum, error: "Missing the parent's name or phone number." };
    const { first, last } = splitName(full);
    const { address, city, zip } = splitAddress(get(idx.address));
    const createdAt = formTimestamp(get(idx.timestamp)) ?? undefined;

    const children: NewChild[] = [];
    for (const k of kids) {
      const rawName = get(k.name);
      if (!blank(rawName)) continue;
      const tag = rawName.match(/\((girl|boy)\)/i)?.[1]?.toUpperCase() as Gender | undefined;
      const { first: cf, last: cl } = (() => {
        const parts = rawName.replace(/\((girl|boy)\)/i, "").replace(/\s+/g, " ").trim().split(" ");
        return { first: parts[0], last: parts.slice(1).join(" ") };
      })();
      const clothing = blank(get(k.clothing));
      const shoe = blank(get(k.shoe));
      children.push({
        firstName: cf,
        lastName: cl,
        age: parseAge(get(k.age)) ?? 0,
        gender: tag ?? genderFromText(clothing ?? "", shoe ?? ""),
        clothing,
        shoe,
        race: blank(get(k.race)),
        wishes: splitWishes(get(k.wish)),
      });
    }
    if (children.length === 0) return { row: rowNum, error: `${full}: no children listed.` };

    const docs: NewApplication["documents"] = [];
    if (get(idx.photoId)) docs.push({ kind: "PHOTO_ID", url: driveLink(get(idx.photoId)) });
    if (get(idx.income)) docs.push({ kind: "INCOME", url: driveLink(get(idx.income)) });
    const signed = get(idx.date);

    return {
      row: rowNum,
      data: {
        parentFirstName: first,
        parentLastName: last,
        email: null,
        phone,
        address,
        city,
        zip,
        employer: get(idx.employer) || null,
        jobLength: get(idx.jobLength) || null,
        priorHelp: yesNo(get(idx.priorHelp)),
        priorHelpYears: blank(get(idx.priorYears)),
        otherAgencyHelp: yesNo(get(idx.agency)),
        agencyNames: blank(get(idx.agencyNames)),
        signatureName: get(idx.signature) || get(idx.printed) || null,
        signedAt: /^\d{4}-\d{2}-\d{2}$/.test(signed) ? new Date(`${signed}T12:00:00-05:00`) : null,
        language: "en",
        children,
        documents: docs,
        source: "import",
        importKey: createHash("sha256").update(`${get(idx.timestamp)}|${full}|${phoneDigits(phone)}`).digest("hex").slice(0, 40),
        createdAt,
        listsSubmitted: true,
      },
    };
  });
}
