"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { normalizeEmail, parseMoneyToCents, phoneDigits, str } from "@/lib/format";
import { getActiveSeason, wishlistsAreOpen } from "@/lib/season";
import { button, esc, layout, notifyAdmin, sendEmail, siteUrl } from "@/lib/email";
import { site } from "@/content/site";
import { randomToken } from "@/lib/tokens";
import { dict, toLang } from "@/content/i18n";

export async function resendFamilyLink(fd: FormData) {
  const lookup = str(fd, "lookup");
  const season = await getActiveSeason();
  if (season && lookup) {
    const digits = phoneDigits(lookup);
    const email = lookup.includes("@") ? normalizeEmail(lookup) : null;
    const app = await db.application.findFirst({
      where: {
        seasonId: season.id,
        household: email ? { emailNormalized: email } : { phoneDigits: digits.length === 10 ? digits : "__none__" },
      },
      include: { household: true },
    });
    if (app?.household.email) {
      const t = dict[toLang(app.language)].email;
      await sendEmail({
        to: app.household.email,
        subject: t.linkSubject(site.name),
        html: layout(t.link(esc(app.household.parentFirstName), button(siteUrl(`/family/${app.accessToken}`), t.pageButton))),
      });
    }
  }
  // Same response either way so the form can't be used to look people up.
  redirect(`/family?sent=1&lang=${toLang(str(fd, "lang"))}`);
}

/** Loads the application for a parent token and checks the list is still editable. */
async function editableApp(token: string) {
  const app = await db.application.findUnique({ where: { accessToken: token }, include: { season: true } });
  if (!app || app.status !== "APPROVED" || app.listSubmittedAt || !wishlistsAreOpen(app.season)) return null;
  return app;
}

async function editableAngel(token: string, angelId: string) {
  const app = await editableApp(token);
  if (!app) return null;
  const angel = await db.angel.findFirst({ where: { id: angelId, applicationId: app.id }, include: { _count: { select: { items: true } } } });
  return angel ? { app, angel } : null;
}

function cleanUrl(raw: string) {
  if (!raw) return null;
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

export async function addItem(token: string, angelId: string, fd: FormData) {
  const found = await editableAngel(token, angelId);
  const name = str(fd, "name").slice(0, 120);
  if (!found || !name) return;
  if (found.angel._count.items >= found.app.season.maxItemsPerChild) return;
  await db.wishItem.create({
    data: {
      angelId,
      name,
      details: str(fd, "details").slice(0, 200) || null,
      url: cleanUrl(str(fd, "url")),
      estPriceCents: parseMoneyToCents(fd.get("price")),
      sortOrder: found.angel._count.items,
    },
  });
  revalidatePath(`/family/${token}`);
}

export async function removeItem(token: string, itemId: string) {
  const app = await editableApp(token);
  if (!app) return;
  await db.wishItem.deleteMany({ where: { id: itemId, status: "NEEDED", angel: { applicationId: app.id } } });
  revalidatePath(`/family/${token}`);
}

export async function updateAngelDetails(token: string, angelId: string, fd: FormData) {
  const found = await editableAngel(token, angelId);
  if (!found) return;
  await db.angel.update({
    where: { id: angelId },
    data: {
      shirtSize: str(fd, "shirtSize") || null,
      pantsSize: str(fd, "pantsSize") || null,
      shoeSize: str(fd, "shoeSize") || null,
      interests: str(fd, "interests").slice(0, 300) || null,
    },
  });
  revalidatePath(`/family/${token}`);
}

export async function submitLists(token: string) {
  const app = await editableApp(token);
  if (!app) return;
  const angels = await db.angel.findMany({ where: { applicationId: app.id }, include: { _count: { select: { items: true } } } });
  if (angels.some((a) => a._count.items === 0)) redirect(`/family/${token}?error=empty`);
  await db.application.update({ where: { id: app.id }, data: { listSubmittedAt: new Date() } });
  const household = await db.household.findUnique({ where: { id: app.householdId } });
  await notifyAdmin(
    "Wish lists submitted",
    `<p>${esc(household?.parentFirstName)} ${esc(household?.parentLastName)} submitted wish lists for ${angels.length} angel${angels.length === 1 ? "" : "s"}. They are now on the Angel Tree.</p>${button(siteUrl(`/admin/applications/${app.id}`), "View")}`,
  );
  revalidatePath(`/family/${token}`);
}

export type ThankYouState = { ok?: boolean; error?: "errEmpty" | "errPhoto" | "errClosed" };

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function submitThankYou(token: string, _prev: ThankYouState, fd: FormData): Promise<ThankYouState> {
  const app = await db.application.findUnique({
    where: { accessToken: token },
    include: { household: true, angels: { select: { id: true, number: true } } },
  });
  if (!app || app.status !== "APPROVED" || !app.listSubmittedAt) return { error: "errClosed" };
  const message = str(fd, "message").slice(0, 2000);
  if (!message) return { error: "errEmpty" };
  const angelId = str(fd, "angelId");
  if (angelId && !app.angels.some((a) => a.id === angelId)) return { error: "errClosed" };

  const photo = fd.get("photo");
  let image: { imageData: Uint8Array<ArrayBuffer>; imageType: string; imageKey: string } | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > 4 * 1024 * 1024 || !IMAGE_TYPES.includes(photo.type)) return { error: "errPhoto" };
    image = { imageData: new Uint8Array(await photo.arrayBuffer()), imageType: photo.type, imageKey: randomToken(18) };
  }

  await db.thankYouNote.create({
    data: { applicationId: app.id, angelId: angelId || null, message, ...(image ?? {}) },
  });
  await notifyAdmin(
    "New thank-you note to review",
    `<p>The ${esc(app.household.parentLastName)} family wrote a thank-you note${image ? " with a photo" : ""}.</p>${button(siteUrl("/admin/thank-yous"), "Review and send")}`,
  );
  revalidatePath(`/family/${token}`);
  return { ok: true };
}

/** A family with no email on file adds one, and we email them their link. */
export async function addFamilyEmail(token: string, fd: FormData) {
  const app = await db.application.findUnique({ where: { accessToken: token }, include: { household: true } });
  if (!app) return;
  const lang = toLang(app.language);
  const email = str(fd, "email").slice(0, 200);
  // Only fills in a missing email; changing one on file goes through the ministry.
  if (app.household.email) redirect(`/family/${token}`);
  if (!/^\S+@\S+\.\S+$/.test(email)) redirect(`/family/${token}?error=email#email`);
  await db.household.update({ where: { id: app.householdId }, data: { email, emailNormalized: normalizeEmail(email) } });
  const t = dict[lang].email;
  await sendEmail({
    to: email,
    subject: t.linkSubject(site.name),
    html: layout(t.link(esc(app.household.parentFirstName), button(siteUrl(`/family/${token}`), t.pageButton))),
  });
  redirect(`/family/${token}?emailSaved=1#email`);
}
