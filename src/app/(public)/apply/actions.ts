"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { findHousehold } from "@/lib/households";
import { ageOn, normalizeEmail, parseMoneyToCents, phoneDigits, str } from "@/lib/format";
import { applicationsAreOpen, getActiveSeason } from "@/lib/season";
import { randomToken } from "@/lib/tokens";
import { button, esc, layout, notifyAdmin, sendEmail, siteUrl } from "@/lib/email";
import { site } from "@/content/site";
import { dict, toLang } from "@/content/i18n";

export type ApplyState = { error?: string };

export async function submitApplication(_prev: ApplyState, fd: FormData): Promise<ApplyState> {
  const lang = toLang(str(fd, "lang"));
  const t = dict[lang];
  const season = await getActiveSeason();
  if (!season || !applicationsAreOpen(season)) return { error: t.errors.closed };

  const parent = {
    parentFirstName: str(fd, "parentFirstName"),
    parentLastName: str(fd, "parentLastName"),
    phone: str(fd, "phone"),
    email: str(fd, "email"),
    address: str(fd, "address"),
    city: str(fd, "city"),
    zip: str(fd, "zip"),
    community: str(fd, "community"),
  };
  if (Object.values(parent).some((v) => !v)) return { error: t.errors.parent };
  if (phoneDigits(parent.phone).length !== 10) return { error: t.errors.phone };
  if (!/^\S+@\S+\.\S+$/.test(parent.email)) return { error: t.errors.email };
  const circumstances = str(fd, "circumstances").slice(0, 2000);
  if (!circumstances) return { error: t.errors.need };
  if (fd.get("agree") !== "on") return { error: t.errors.agree };
  const adultsInHome = Math.max(1, Math.min(20, Number(str(fd, "adultsInHome")) || 1));

  // Children arrive as parallel arrays, one entry per child block.
  const firstNames = fd.getAll("childFirstName").map(String);
  const christmas = new Date(Date.UTC(season.year, 11, 25));
  const children = firstNames.map((_, i) => {
    const at = (k: string) => String(fd.getAll(k)[i] ?? "").trim();
    return {
      firstName: at("childFirstName"),
      lastName: at("childLastName"),
      birthDate: new Date(`${at("childBirthDate")}T12:00:00Z`),
      gender: at("childGender"),
      shirtSize: at("childShirt") || null,
      pantsSize: at("childPants") || null,
      shoeSize: at("childShoe") || null,
      interests: at("childInterests").slice(0, 300) || null,
    };
  });
  if (children.length === 0) return { error: t.errors.noChildren };
  for (const c of children) {
    if (!c.firstName || !c.lastName || Number.isNaN(c.birthDate.getTime()) || (c.gender !== "GIRL" && c.gender !== "BOY")) {
      return { error: t.errors.child };
    }
    const age = ageOn(c.birthDate, christmas);
    if (age < 0 || age > 17) return { error: t.errors.age(c.firstName) };
  }

  const accessToken = randomToken();
  const result = await db.$transaction(async (tx) => {
    let household = await findHousehold(tx, parent.email, parent.phone);
    if (household) {
      const existing = await tx.application.findUnique({
        where: { seasonId_householdId: { seasonId: season.id, householdId: household.id } },
      });
      if (existing) return { duplicate: true as const };
      household = await tx.household.update({
        where: { id: household.id },
        data: {
          parentFirstName: parent.parentFirstName,
          parentLastName: parent.parentLastName,
          email: parent.email,
          emailNormalized: normalizeEmail(parent.email),
          phone: parent.phone,
          phoneDigits: phoneDigits(parent.phone),
          address: parent.address,
          city: parent.city,
          zip: parent.zip,
        },
      });
    } else {
      household = await tx.household.create({
        data: {
          parentFirstName: parent.parentFirstName,
          parentLastName: parent.parentLastName,
          email: parent.email,
          emailNormalized: normalizeEmail(parent.email),
          phone: parent.phone,
          phoneDigits: phoneDigits(parent.phone),
          address: parent.address,
          city: parent.city,
          zip: parent.zip,
        },
      });
    }

    const app = await tx.application.create({
      data: {
        seasonId: season.id,
        householdId: household.id,
        accessToken,
        community: parent.community,
        address: parent.address,
        city: parent.city,
        zip: parent.zip,
        adultsInHome,
        monthlyIncomeCents: parseMoneyToCents(fd.get("monthlyIncome")),
        assistancePrograms: fd.getAll("assistance").map(String).join(", ") || null,
        circumstances,
        churchHome: str(fd, "churchHome") || null,
        referredBy: str(fd, "referredBy") || null,
        agreedToTerms: true,
        language: lang,
      },
    });

    // Re-use child records from earlier years so each child's history carries over.
    const knownKids = await tx.child.findMany({ where: { householdId: household.id } });
    for (const c of children) {
      const match = knownKids.find(
        (k) => k.firstName.toLowerCase() === c.firstName.toLowerCase() && k.birthDate.toISOString().slice(0, 10) === c.birthDate.toISOString().slice(0, 10),
      );
      const child =
        match ??
        (await tx.child.create({
          data: { householdId: household.id, firstName: c.firstName, lastName: c.lastName, birthDate: c.birthDate, gender: c.gender as "GIRL" | "BOY" },
        }));
      await tx.angel.create({
        data: {
          seasonId: season.id,
          applicationId: app.id,
          childId: child.id,
          ageAtSeason: ageOn(c.birthDate, christmas),
          gender: c.gender as "GIRL" | "BOY",
          shirtSize: c.shirtSize,
          pantsSize: c.pantsSize,
          shoeSize: c.shoeSize,
          interests: c.interests,
        },
      });
    }
    return { duplicate: false as const, appId: app.id };
  });

  if (result.duplicate) {
    return { error: t.errors.duplicate };
  }

  const link = siteUrl(`/family/${accessToken}`);
  await sendEmail({
    to: parent.email,
    subject: t.email.receivedSubject(site.name),
    html: layout(t.email.received(esc(parent.parentFirstName), button(link, t.email.pageButton), esc(site.name))),
  });
  await notifyAdmin(
    "New sponsorship application",
    `<p>${esc(parent.parentFirstName)} ${esc(parent.parentLastName)} (${esc(parent.community)}) applied with ${children.length} child${children.length === 1 ? "" : "ren"}${lang === "es" ? " (in Spanish)" : ""}.</p>${button(siteUrl(`/admin/applications/${result.appId}`), "Review application")}`,
  );

  redirect(`/apply/thanks?t=${encodeURIComponent(accessToken)}&lang=${lang}`);
}
