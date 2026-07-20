import type { MetadataRoute } from "next";
import { CATEGORIES, TOOLS } from "@/lib/registry";
import { SITE_URL } from "./layout";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/ferramentas/`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    ...CATEGORIES.map((c) => ({
      url: `${SITE_URL}/ferramentas/categoria/${c.slug}/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...TOOLS.map((t) => ({
      url: `${SITE_URL}/ferramentas/${t.slug}/`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: t.featured ? 0.8 : 0.6,
    })),
    { url: `${SITE_URL}/sobre/`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacidade/`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
