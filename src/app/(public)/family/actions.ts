"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { normalizeEmail, parseMoneyToCents, phoneDigits, str } from "@/lib/format";
import { getActiveSeason, wishlistsAreOpen } from "@/lib/season";
import { button, esc, layout, notifyAdmin, sendEmail, siteUrl } from "@/lib/email";
import { site } from "@/content/site";

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
      await sendEmail({
        to: app.household.email,
        subject: `Your family's Christmas page — ${site.name}`,
        html: layout(`<p>Hi ${esc(app.household.parentFirstName)},</p><p>Here is your private link:</p>${button(siteUrl(`/family/${app.accessToken}`), "My family's Christmas page")}`),
      });
    }
  }
  // Same response either way so the form can't be used to look people up.
  redirect("/family?sent=1");
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
