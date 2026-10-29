// Editable site copy. Swap in real photos and testimonials here as they come in.
// Photos go in /public/photos and are referenced like "/photos/wrapping-night.jpg".

export const site = {
  name: "LIFT Community Christmas",
  fullName: "LIFT Ministries Community Christmas",
  // LIFT stands for Living In Faith Together.
  ministry: "LIFT Ministries",
  ministryMotto: "Living In Faith Together",
  ministryLogo: "/brand/lift-ministries-logo.png",
  communities: "East Central Alabama",
  region: "East Central Alabama",
  tagline: "Sharing the love of Christ with children in our community, one Christmas gift at a time.",
  motto: "Neighbors lifting neighbors.",
  contactEmail: "liftministriesal@gmail.com",
  contactPhone: "(334) 328-1513",
  facebookUrl: "https://www.facebook.com/LIFTMinistries",
  // From the Community Christmas flyer.
  helpLine:
    "Lift Ministries Community Christmas is here to help families in our community during the holiday season. If you are in need of assistance this year, please complete the application below.",
  thanksLine: "Thank you for allowing us to be a part of blessing families in our community this Christmas!",

  verse: {
    text: "For unto you is born this day in the city of David a Saviour, which is Christ the Lord.",
    ref: "Luke 2:11",
  },
  giveVerse: {
    text: "Truly I tell you, whatever you did for one of the least of these brothers and sisters of mine, you did for me.",
    ref: "Matthew 25:40",
  },

  mission: [
    "LIFT Community Christmas is a ministry of LIFT Ministries (Living In Faith Together), rooted in the Christian faith. Each year, neighbors, churches, businesses, and families across East Central Alabama come together to help families in our community during the holiday season, so children wake up on Christmas morning to gifts chosen just for them.",
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

// Original artwork (from the brand kit). Keep proportions; never put text over it.
export const brand = {
  // Angel on a white background: show it on white.
  angel: "/brand/angel.jpg",
  // Full "Community Christmas" artwork on the Christmas-blue sky.
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
