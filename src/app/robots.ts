import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://liftchristmas.com").replace(/\/$/, "");

// Keep private areas (admin, giver accounts, family links) and thank-you pages out of search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/account", "/family", "/api", "/card", "/partner-logo", "/apply/thanks", "/angels/thanks", "/donate/thanks"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
