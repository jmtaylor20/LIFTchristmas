import type { MetadataRoute } from "next";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://liftchristmas.com").replace(/\/$/, "");

// Public pages only. Individual angel pages change every season, so they're left out.
const pages = ["", "/about", "/angels", "/angels/items", "/apply", "/give", "/donate", "/partners"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return pages.map((path) => ({
    url: `${siteUrl}${path || "/"}`,
    lastModified,
    changeFrequency: path === "" || path.startsWith("/angels") ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
