import type { MetadataRoute } from "next";

const routes = [
  "",
  "/guide",
  "/glossary",
  "/machines",
  "/roadmap",
  "/disclaimer",
  "/privacy",
  "/contact",
  "/simulate",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";
  const now = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: now,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
