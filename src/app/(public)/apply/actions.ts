"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { communityFor, createApplication, MAX_CHILDREN, MAX_DOCUMENT_BYTES, parseAge, WISHES_PER_CHILD, type NewApplication, type NewChild } from "@/lib/applications";
import { phoneDigits, str } from "@/lib/format";
import { applicationsAreOpen, getActiveSeason } from "@/lib/season";
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
  };
  if (Object.values(parent).some((v) => !v)) return { error: t.errors.parent };
  if (phoneDigits(parent.phone).length !== 10) return { error: t.errors.phone };
  if (!/^\S+@\S+\.\S+$/.test(parent.email)) return { error: t.errors.email };

  const employer = str(fd, "employer").slice(0, 200);
  const jobLength = str(fd, "jobLength").slice(0, 200);
  const priorHelp = str(fd, "priorHelp");
  const otherAgency = str(fd, "otherAgencyHelp");
  if (!employer || !jobLength || !priorHelp || !otherAgency) return { error: t.errors.work };

  const documents: NewApplication["documents"] = [];
  for (const [key, kind] of [["photoId", "PHOTO_ID"], ["incomeProof", "INCOME"]] as const) {
    const file = fd.get(key);
    if (!(file instanceof File) || file.size === 0) return { error: t.errors.docs };
    const okType = file.type.startsWith("image/") || file.type === "application/pdf";
    if (!okType || file.size > MAX_DOCUMENT_BYTES) return { error: t.errors.docType };
    documents.push({ kind, data: new Uint8Array(await file.arrayBuffer()), contentType: file.type });
  }

  if (fd.get("agree") !== "on") return { error: t.errors.agree };
  const printedName = str(fd, "printedName");
  const signatureName = str(fd, "signatureName");
  if (!printedName || !signatureName) return { error: t.errors.signature };

  // Children arrive as parallel arrays, one entry per child block; wishes come
  // WISHES_PER_CHILD to a child, in order.
  const firstNames = fd.getAll("childFirstName").map(String);
  const wishes = fd.getAll("childWish").map((v) => String(v).trim().slice(0, 200));
  if (firstNames.length === 0) return { error: t.errors.noChildren };
  if (firstNames.length > MAX_CHILDREN) return { error: t.errors.tooMany };
  const children: NewChild[] = [];
  for (let i = 0; i < firstNames.length; i++) {
    const at = (k: string) => String(fd.getAll(k)[i] ?? "").trim();
    const gender = at("childGender");
    const age = parseAge(at("childAge"));
    const firstName = at("childFirstName");
    if (!firstName || !at("childLastName") || age == null || (gender !== "GIRL" && gender !== "BOY")) return { error: t.errors.child };
    if (age > 18) return { error: t.errors.age(firstName) };
    children.push({
      firstName,
      lastName: at("childLastName"),
      age,
      gender,
      clothing: at("childClothing").slice(0, 100) || null,
      shoe: at("childShoe").slice(0, 50) || null,
      race: at("childRace").slice(0, 100) || null,
      wishes: wishes
        .slice(i * WISHES_PER_CHILD, (i + 1) * WISHES_PER_CHILD)
        .filter(Boolean)
        .map((name) => ({ name })),
    });
  }

  const result = await db.$transaction(
    (tx) =>
      createApplication(tx, {
        seasonId: season.id,
        ...parent,
        employer,
        jobLength,
        priorHelp: priorHelp === "yes",
        priorHelpYears: str(fd, "priorHelpYears").slice(0, 300) || null,
        otherAgencyHelp: otherAgency === "yes",
        agencyNames: str(fd, "agencyNames").slice(0, 300) || null,
        signatureName: printedName === signatureName ? signatureName : `${signatureName} (printed: ${printedName})`,
        signedAt: new Date(),
        language: lang,
        children,
        documents,
      }),
    { timeout: 20000 },
  );
  const accessToken = result.duplicate ? null : result.accessToken;
  const community = communityFor(parent.city, parent.address);

  if (result.duplicate || !accessToken) {
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
    `<p>${esc(parent.parentFirstName)} ${esc(parent.parentLastName)} (${esc(community)}) applied with ${children.length} child${children.length === 1 ? "" : "ren"}${lang === "es" ? " (in Spanish)" : ""}.</p>${button(siteUrl(`/admin/applications/${result.appId}`), "Review application")}`,
  );

  redirect(`/apply/thanks?t=${encodeURIComponent(accessToken)}&lang=${lang}`);
}
