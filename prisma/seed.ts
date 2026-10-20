// Demo data for local development: `npm run db:seed`. Do not run against production.
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "crypto";

const db = new PrismaClient();
const token = () => randomBytes(18).toString("base64url");

async function main() {
  const year = new Date().getFullYear();
  if (await db.season.findUnique({ where: { year } })) {
    console.log(`Season ${year} already exists; skipping demo data.`);
    return;
  }
  const season = await db.season.create({
    data: {
      year,
      isActive: true,
      applicationDeadline: new Date(`${year}-11-15T23:59:59-06:00`),
      wishlistDeadline: new Date(`${year}-11-25T23:59:59-06:00`),
      giftDeadline: new Date(`${year}-12-12T23:59:59-06:00`),
      amazonWishlistUrl: "https://www.amazon.com/hz/wishlist/ls/EXAMPLE",
      venmoHandle: "LIFT-Ministries-Demo",
      dropOffInstructions: "Drop off unwrapped gifts at the church fellowship hall, Sundays after service or weekdays 9–noon.",
      shippingAddress: "P.O. Box 000\nTallassee, AL 36078",
      donationInstructions: "Make checks payable to LIFT Ministries and mail to P.O. Box 000, Tallassee, AL 36078, or bring cash or a check to the fellowship hall.",
      pickupInstructions: "Gift pickup is Saturday, December 19, 9am–noon at the fellowship hall. Please bring a photo ID.",
    },
  });

  const families = [
    { first: "Sarah", last: "Johnson", phone: "334-555-0101", kids: [["Emma", "GIRL", "2017-03-04"], ["Liam", "BOY", "2020-07-19"]] },
    { first: "Marcus", last: "Williams", phone: "334-555-0102", kids: [["Ava", "GIRL", "2013-11-22"]] },
    { first: "Dana", last: "Brown", phone: "334-555-0103", kids: [["Noah", "BOY", "2015-01-09"], ["Mia", "GIRL", "2019-05-30"]] },
  ] as const;

  let n = 0;
  for (const f of families) {
    const email = `${f.first.toLowerCase()}@example.com`;
    const h = await db.household.create({
      data: {
        parentFirstName: f.first,
        parentLastName: f.last,
        email,
        emailNormalized: email,
        phone: f.phone,
        phoneDigits: f.phone.replace(/\D/g, ""),
        address: "123 Main St",
        city: "Tallassee",
        zip: "36078",
      },
    });
    const app = await db.application.create({
      data: {
        seasonId: season.id,
        householdId: h.id,
        accessToken: token(),
        status: "APPROVED",
        decidedAt: new Date(),
        listSubmittedAt: new Date(),
        community: "Tallassee",
        address: "123 Main St",
        city: "Tallassee",
        zip: "36078",
        adultsInHome: 1,
        circumstances: "Demo application.",
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
          number: ++n,
          ageAtSeason: year - birth.getUTCFullYear(),
          gender,
          shirtSize: "Youth M",
          pantsSize: "10",
          shoeSize: "3Y",
          interests: gender === "GIRL" ? "art, horses, reading" : "football, Legos, trucks",
          items: {
            create: [
              { name: "Winter coat", details: "Youth M", estPriceCents: 4000, sortOrder: 0 },
              { name: "Sneakers", details: "Size 3Y", estPriceCents: 3500, sortOrder: 1 },
              { name: gender === "GIRL" ? "Art kit" : "Lego set", estPriceCents: 2500, sortOrder: 2 },
              { name: "Pajamas", details: "Youth M", estPriceCents: 1500, sortOrder: 3 },
              { name: "Children's Bible", estPriceCents: 1200, sortOrder: 4 },
            ],
          },
        },
      });
    }
  }
  console.log(`Seeded season ${year} with ${n} angels.`);
}

main().finally(() => db.$disconnect());
