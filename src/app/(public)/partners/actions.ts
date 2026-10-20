"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { money, parseMoneyToCents, str } from "@/lib/format";
import { getActiveSeason } from "@/lib/season";
import { recognitionFields, upsertGiver } from "@/lib/givers";
import { button, esc, notifyAdmin, siteUrl } from "@/lib/email";
import { randomToken } from "@/lib/tokens";

export type PartnerState = { error?: string };

const LOGO_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];

function cleanWebsite(raw: string) {
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * A business signs up as a Christmas partner: their gift is recorded as
 * "waiting to confirm" like any other, and their logo waits for the owner's
 * approval before it can appear on the home page.
 */
export async function becomePartner(_prev: PartnerState, fd: FormData): Promise<PartnerState> {
  const season = await getActiveSeason();
  if (!season) return { error: "Partner sign-up opens when this Christmas season begins." };

  const businessName = str(fd, "businessName").slice(0, 120);
  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const email = str(fd, "email");
  if (!businessName || !firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) {
    return { error: "Please enter your business name, your name, and a valid email." };
  }
  const amountCents = parseMoneyToCents(fd.get("amount"));
  if (!amountCents || amountCents < 10_000) return { error: "Partner gifts start at $100 (Bronze)." };
  const method = str(fd, "method") as "VENMO" | "CHECK" | "CASH";
  if (!["VENMO", "CHECK", "CASH"].includes(method) || (method === "VENMO" && !season.venmoHandle)) {
    return { error: "Please choose how you'll give." };
  }

  const logo = fd.get("logo");
  if (!(logo instanceof File) || logo.size === 0) return { error: "Please upload your logo." };
  if (logo.size > 3 * 1024 * 1024 || !LOGO_TYPES.includes(logo.type)) {
    return { error: "Your logo should be a PNG, JPG, WebP, or SVG under 3 MB." };
  }
  // SVGs can carry scripts, so they're stored but only served as images with a locked-down policy.
  const logoData = new Uint8Array(await logo.arrayBuffer());

  const giver = await upsertGiver({
    firstName,
    lastName,
    email,
    phone: str(fd, "phone") || null,
    organization: businessName,
    ...recognitionFields(fd),
  });
  const message = str(fd, "message").slice(0, 500) || null;
  const data = {
    businessName,
    website: cleanWebsite(str(fd, "website")),
    logoData,
    logoType: logo.type,
    logoKey: randomToken(18),
    pledgeCents: amountCents,
    message,
    // A new logo always needs a fresh look from the owner.
    status: "PENDING" as const,
  };
  await db.corporatePartner.upsert({
    where: { seasonId_sponsorId: { seasonId: season.id, sponsorId: giver.id } },
    create: { seasonId: season.id, sponsorId: giver.id, ...data },
    update: data,
  });
  const donation = await db.donation.create({
    data: {
      seasonId: season.id,
      sponsorId: giver.id,
      donorName: businessName,
      donorEmail: email,
      amountCents,
      method,
      status: "PENDING",
      note: `Business partner gift${message ? ` · ${message}` : ""}`.slice(0, 300),
    },
  });

  await notifyAdmin(
    `New business partner: ${businessName}`,
    `<p><strong>${esc(businessName)}</strong> (${esc(firstName)} ${esc(lastName)}, ${esc(email)}) signed up as a Christmas partner with a <strong>${money(amountCents)}</strong> gift by ${method.toLowerCase()}.</p><p>Approve their logo, and mark the gift received when it arrives.</p>${button(siteUrl("/admin/partners"), "Review partner")}`,
  );
  redirect(`/donate/thanks?d=${donation.id}&partner=1`);
}
