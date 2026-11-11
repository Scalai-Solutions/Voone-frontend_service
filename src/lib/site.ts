/**
 * The public origin of the marketing site, for canonical links, the sitemap and structured data.
 * NEXT_PUBLIC_SITE_URL wins when set; otherwise the production domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://voone.ai").replace(/\/$/, "");

/** Where "Solicitar demostración" goes. */
export const DEMO_URL = "https://calendly.com/business-voone/call";
