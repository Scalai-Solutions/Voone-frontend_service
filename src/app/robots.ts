import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";

/** The marketing pages are public; everything behind a login or a clinic's own links is not. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/api", "/login", "/set-password", "/alta", "/wallet", "/legal"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
