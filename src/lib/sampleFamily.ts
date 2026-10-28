import type { Season } from "@prisma/client";

// A made-up family for showing the family page (/family/sample) without a real
// application. Nothing here is stored, so it never reaches the Angel Tree,
// the admin lists, or the totals.
export const SAMPLE_FAMILY_TOKEN = "sample";

export function sampleFamily(season: Season, step: "lists" | "ready") {
  const now = new Date();
  const item = (id: string, name: string, details: string | null, priceCents: number | null) => ({
    id,
    angelId: "",
    name,
    details,
    url: null,
    estPriceCents: priceCents,
    sortOrder: 0,
    status: "NEEDED" as const,
    sponsorshipId: null,
    ministryCostCents: null,
    receivedAt: null,
    createdAt: now,
    updatedAt: now,
  });
  const angel = (id: string, number: number, firstName: string, gender: "GIRL" | "BOY", age: number, sizes: [string, string, string], items: ReturnType<typeof item>[]) => ({
    id,
    seasonId: season.id,
    applicationId: "sample",
    childId: `${id}-child`,
    number,
    ageAtSeason: age,
    gender,
    shirtSize: sizes[0],
    pantsSize: sizes[1],
    shoeSize: sizes[2],
    interests: null,
    hidden: true,
    createdAt: now,
    updatedAt: now,
    child: { id: `${id}-child`, householdId: "sample", firstName, lastName: "Sample", birthDate: null, gender, race: null, createdAt: now },
    items,
  });
  return {
    id: "sample",
    seasonId: season.id,
    season,
    householdId: "sample",
    household: {
      id: "sample",
      parentFirstName: "Jordan",
      parentLastName: "Sample",
      email: "sample@example.com",
      emailNormalized: "sample@example.com",
      phone: "(334) 555-0100",
      phoneDigits: "3345550100",
      address: null,
      city: null,
      zip: null,
      adminNotes: null,
      createdAt: now,
      updatedAt: now,
    },
    status: "APPROVED" as const,
    accessToken: SAMPLE_FAMILY_TOKEN,
    language: "en",
    listSubmittedAt: step === "ready" ? now : null,
    pickedUpAt: null,
    angels: [
      angel("sample-1", 101, "Emma", "GIRL", 8, ["Youth M (10/12)", "10", "2Y"], [
        item("s1", "Art kit", "Markers, colored pencils, sketchbook", 2500),
        item("s2", "Winter coat", "Youth M, purple", 4000),
        item("s3", "Barbie Dreamhouse", null, null),
      ]),
      angel("sample-2", 102, "Noah", "BOY", 5, ["5T", "5T", "12C"], [
        item("s4", "Hot Wheels track set", null, 3000),
        item("s5", "Bike with training wheels", "16 inch", 9000),
      ]),
    ],
    thankYouNotes: [],
  };
}
