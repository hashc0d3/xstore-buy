import type { MetadataRoute } from "next";
import { defaultStoreData } from "@/lib/store";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://xstore55.ru").replace(/\/$/, "");
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9
    },
    {
      url: `${baseUrl}/info`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7
    },
    {
      url: `${baseUrl}/policy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${baseUrl}/offer`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.3
    },
    {
      url: `${baseUrl}/assessment`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5
    }
  ];

  const categoryPages: MetadataRoute.Sitemap = defaultStoreData.categories.map((category) => ({
    url: `${baseUrl}/catalog/${category.slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8
  }));

  return [...staticPages, ...categoryPages];
}
