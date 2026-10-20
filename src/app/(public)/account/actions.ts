"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { normalizeEmail, str } from "@/lib/format";
import { sendLoginLink, sendStatement, upsertGiver } from "@/lib/givers";
import { clearGiverSession, currentGiver, setGiverSession } from "@/lib/auth";
import { sha256 } from "@/lib/tokens";

export async function requestLogin(fd: FormData) {
  const email = normalizeEmail(str(fd, "email"));
  if (email) {
    const giver = await db.sponsor.findUnique({ where: { emailNormalized: email } });
    if (giver) await sendLoginLink(giver.id, giver.email, giver.firstName);
  }
  redirect("/account?sent=1");
}

export async function createProfile(fd: FormData) {
  const firstName = str(fd, "firstName");
  const lastName = str(fd, "lastName");
  const email = str(fd, "email");
  if (!firstName || !lastName || !/^\S+@\S+\.\S+$/.test(email)) redirect("/account?error=missing");
  // Existing profiles are not overwritten by an unverified sign-up.
  const existing = await db.sponsor.findUnique({ where: { emailNormalized: normalizeEmail(email)! } });
  const giver =
    existing ??
    (await upsertGiver({ firstName, lastName, email, phone: str(fd, "phone") || null, organization: str(fd, "organization") || null }));
  await sendLoginLink(giver.id, giver.email, giver.firstName);
  redirect("/account?sent=1");
}

export async function verifyLogin(fd: FormData) {
  const token = str(fd, "token");
  const row = token ? await db.loginToken.findUnique({ where: { tokenHash: sha256(token) } }) : null;
  if (!row || row.usedAt || row.expiresAt < new Date()) redirect("/account?error=expired");
  await db.loginToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  await setGiverSession(row.sponsorId);
  redirect("/account");
}

export async function logout() {
  await clearGiverSession();
  redirect("/account");
}

export async function updateProfile(fd: FormData) {
  const giver = await currentGiver();
  if (!giver) redirect("/account");
  await db.sponsor.update({
    where: { id: giver.id },
    data: {
      firstName: str(fd, "firstName") || giver.firstName,
      lastName: str(fd, "lastName") || giver.lastName,
      phone: str(fd, "phone") || null,
      organization: str(fd, "organization") || null,
      anonymous: fd.get("anonymous") === "on",
      displayName: str(fd, "displayName").slice(0, 80) || null,
    },
  });
  revalidatePath("/account");
}

export async function emailMyStatement(year: number) {
  const giver = await currentGiver();
  if (!giver) redirect("/account");
  await sendStatement(giver.id, year);
  redirect(`/account/statements/${year}?emailed=1`);
}

export async function saveTracking(sponsorshipId: string, fd: FormData) {
  const giver = await currentGiver();
  if (!giver) redirect("/account");
  await db.sponsorship.updateMany({
    where: { id: sponsorshipId, sponsorId: giver.id },
    data: { trackingInfo: str(fd, "trackingInfo").slice(0, 500) || null },
  });
  revalidatePath("/account");
}
