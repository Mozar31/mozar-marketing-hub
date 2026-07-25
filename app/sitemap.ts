import type { MetadataRoute } from "next";
import { CATEGORIES, TOOLS } from "@/lib/registry";
import { GUIAS } from "@/lib/guides";
import { IAS } from "@/lib/ai-directory";
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
    { url: `${SITE_URL}/ias/`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...IAS.map((i) => ({
      url: `${SITE_URL}/ias/${i.slug}/`,
      lastModified: new Date(i.verificado),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    { url: `${SITE_URL}/guias/`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...GUIAS.map((g) => ({
      url: `${SITE_URL}/guias/${g.slug}/`,
      lastModified: new Date(g.atualizado),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    { url: `${SITE_URL}/novidades/`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/sobre/`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacidade/`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
