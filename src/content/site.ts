// Editable site copy. Swap in real photos and testimonials here as they come in.
// Photos go in /public/photos and are referenced like "/photos/wrapping-night.jpg".

export const site = {
  name: "LIFT Community Christmas",
  fullName: "LIFT Community Christmas Ministry",
  communities: "Reeltown & Tallassee",
  region: "Reeltown & Tallassee, Alabama",
  tagline: "Sharing the love of Christ with children in our community, one Christmas gift at a time.",
  contactEmail: "christmas@liftchristmas.org",
  contactPhone: "",
  facebookUrl: "",

  verse: {
    text: "For unto you is born this day in the city of David a Saviour, which is Christ the Lord.",
    ref: "Luke 2:11",
  },
  giveVerse: {
    text: "Truly I tell you, whatever you did for one of the least of these brothers and sisters of mine, you did for me.",
    ref: "Matthew 25:40",
  },

  mission: [
    "LIFT Community Christmas is a giving ministry rooted in the Christian faith. Each year, neighbors, churches, and families across Reeltown and Tallassee come together so that children in our community wake up on Christmas morning to gifts chosen just for them.",
    "We believe every child is made in God's image and deserves to know they are loved. Because God gave us the greatest gift in His Son, Jesus, we give joyfully to others.",
  ],

  // Leave src empty to show a placeholder until real photos are added.
  photos: {
    hero: { src: "", alt: "Children opening Christmas gifts" },
    mission: { src: "", alt: "Volunteers wrapping gifts" },
    give: { src: "", alt: "Gifts under the tree" },
  },

  // Set `placeholder: false` and fill in quote/name when testimonials arrive.
  testimonials: [
    { placeholder: true, quote: "", name: "", role: "Parent" },
    { placeholder: true, quote: "", name: "", role: "Sponsor family" },
    { placeholder: true, quote: "", name: "", role: "Volunteer" },
  ],
};

// Logo files live in /public/brand. Until they're added, a star shows instead.
export const brand = {
  // The angel on a transparent or white background (used in the header and as the browser icon).
  angel: "/brand/angel.png",
  // The full "Community Christmas" artwork on the blue sky (used for social sharing).
  full: "/brand/community-christmas.jpg",
};

export const org = {
  legalName: process.env.ORG_LEGAL_NAME || "LIFT Ministries",
  ein: process.env.ORG_EIN || "",
  mailingAddress: process.env.ORG_MAILING_ADDRESS || "",
  // Set ORG_TAX_EXEMPT=true only once the IRS has recognized LIFT Ministries
  // as a 501(c)(3). It switches receipts to tax-deductible wording.
  taxExempt: process.env.ORG_TAX_EXEMPT === "true",
};

/** The fine print printed on every receipt and giving statement. */
export function receiptDisclaimer(plural = false) {
  const these = plural ? "these contributions" : "this contribution";
  return org.taxExempt
    ? `${org.legalName} is a 501(c)(3) tax-exempt organization. No goods or services were provided in exchange for ${these}. Please keep this for your tax records.`
    : `${org.legalName} is not currently recognized by the IRS as a 501(c)(3) tax-exempt organization, so ${these} cannot be claimed as a tax deduction. This record is for your personal records. Thank you for your generosity!`;
}
