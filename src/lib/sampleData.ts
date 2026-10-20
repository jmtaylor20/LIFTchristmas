import type { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

// Sample families, angels, and ministry needs for trying the site out. Used by `npm run db:seed`
// locally and by Admin → Test Mode → "Load sample data".

const DAY = 24 * 60 * 60 * 1000;
const token = () => randomBytes(18).toString("base64url");

const families = [
  { first: "Sarah", last: "Testfamily", phone: "334-555-0101", kids: [["Emma", "GIRL", "2017-03-04"], ["Liam", "BOY", "2020-07-19"]] },
  { first: "Marcus", last: "Sampleton", phone: "334-555-0102", kids: [["Ava", "GIRL", "2013-11-22"]] },
  { first: "Dana", last: "Demo", phone: "334-555-0103", kids: [["Noah", "BOY", "2015-01-09"], ["Mia", "GIRL", "2019-05-30"]] },
] as const;

/** Creates (or reuses) this year's season and adds sample families. Returns a short summary. */
export async function loadSampleData(db: PrismaClient) {
  const year = new Date().getFullYear();
  const now = Date.now();
  const season =
    (await db.season.findUnique({ where: { year } })) ??
    (await db.season.create({
      data: {
        year,
        isActive: (await db.season.count({ where: { isActive: true } })) === 0,
        // Deadlines in the future so every part of the site is open for testing.
        applicationDeadline: new Date(now + 14 * DAY),
        wishlistDeadline: new Date(now + 21 * DAY),
        giftDeadline: new Date(now + 45 * DAY),
        amazonWishlistUrl: "https://www.amazon.com/hz/wishlist/ls/EXAMPLE",
        venmoHandle: "LIFT-Ministries-Test",
        dropOffInstructions: "TEST: Drop off unwrapped gifts at the fellowship hall, Sundays after service.",
        shippingAddress: "TEST ADDRESS\nP.O. Box 000\nTallassee, AL 36078",
        donationInstructions: "TEST: Make checks payable to LIFT Ministries.",
        pickupInstructions: "TEST: Gift pickup is Saturday, December 19, 9am–noon.",
      },
    }));

  const max = await db.angel.aggregate({ where: { seasonId: season.id }, _max: { number: true } });
  let n = max._max.number ?? 0;
  let angels = 0;
  for (const [index, f] of families.entries()) {
    const email = `${f.first.toLowerCase()}.${f.last.toLowerCase()}@example.com`;
    const digits = f.phone.replace(/\D/g, "");
    const existing = await db.household.findFirst({ where: { phoneDigits: digits } });
    if (existing && (await db.application.findFirst({ where: { seasonId: season.id, householdId: existing.id } }))) continue;
    const h =
      existing ??
      (await db.household.create({
        data: { parentFirstName: f.first, parentLastName: f.last, email, emailNormalized: email, phone: f.phone, phoneDigits: digits, address: "123 Test St", city: "Tallassee", zip: "36078" },
      }));
    // The last family is left pending so approving can be tested too.
    const approved = index < families.length - 1;
    const app = await db.application.create({
      data: {
        seasonId: season.id,
        householdId: h.id,
        accessToken: token(),
        status: approved ? "APPROVED" : "PENDING",
        decidedAt: approved ? new Date() : null,
        listSubmittedAt: approved ? new Date() : null,
        community: "Tallassee",
        address: "123 Test St",
        city: "Tallassee",
        zip: "36078",
        adultsInHome: 1,
        circumstances: "Sample application for testing.",
        agreedToTerms: true,
      },
    });
    for (const [name, gender, dob] of f.kids) {
      const birth = new Date(`${dob}T12:00:00Z`);
      const child = await db.child.create({ data: { householdId: h.id, firstName: name, lastName: f.last, birthDate: birth, gender } });
      await db.angel.create({
        data: {
          seasonId: season.id,
          applicationId: app.id,
          childId: child.id,
          number: approved ? ++n : null,
          ageAtSeason: year - birth.getUTCFullYear(),
          gender,
          shirtSize: "Youth M",
          pantsSize: "10",
          shoeSize: "3Y",
          interests: gender === "GIRL" ? "art, horses, reading" : "football, Legos, trucks",
          items: approved
            ? {
                create: [
                  { name: "Winter coat", details: "Youth M", estPriceCents: 4000, sortOrder: 0 },
                  { name: "Sneakers", details: "Size 3Y", estPriceCents: 3500, sortOrder: 1 },
                  { name: gender === "GIRL" ? "Art kit" : "Lego set", estPriceCents: 2500, sortOrder: 2 },
                  { name: "Pajamas", details: "Youth M", estPriceCents: 1500, sortOrder: 3 },
                  { name: "Children's Bible", estPriceCents: 1200, sortOrder: 4 },
                ],
              }
            : undefined,
        },
      });
      angels++;
    }
  }
  if ((await db.needItem.count({ where: { seasonId: season.id } })) === 0) {
    await db.needItem.createMany({
      data: [
        { seasonId: season.id, name: "Wrapping paper rolls", priceCents: 1299, quantity: 10, url: "https://www.amazon.com/", sortOrder: 1 },
        { seasonId: season.id, name: "Clear packing tape", priceCents: 899, quantity: 6, url: "https://www.amazon.com/", sortOrder: 2 },
        { seasonId: season.id, name: "Large gift bags", details: "Assorted colors", priceCents: 2450, quantity: 4, sortOrder: 3 },
      ],
    });
  }
  return { year: season.year, angels };
}

/** Deletes every record the site holds (used to clear out test data). */
export async function deleteAllData(db: PrismaClient) {
  await db.$transaction([
    db.emailLog.deleteMany(),
    db.sandboxEmail.deleteMany(),
    db.adminLoginAttempt.deleteMany(),
    db.thankYouNote.deleteMany(),
    db.wishItem.deleteMany(),
    db.sponsorship.deleteMany(),
    db.givingStatement.deleteMany(),
    db.loginToken.deleteMany(),
    db.donation.deleteMany(),
    db.inKindGift.deleteMany(),
    db.needItem.deleteMany(),
    db.corporatePartner.deleteMany(),
    db.angel.deleteMany(),
    db.application.deleteMany(),
    db.child.deleteMany(),
    db.household.deleteMany(),
    db.sponsor.deleteMany(),
    db.season.deleteMany(),
  ]);
}
