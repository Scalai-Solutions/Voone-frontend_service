import type { NextConfig } from "next";

import { legacyHostRedirects } from "./src/lib/legacy-host-redirects.ts";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  // Old-domain visitors (printed QR posters, links on installed wallet cards) go to the new
  // domain. Inert until LEGACY_HOSTS and NEXT_PUBLIC_SITE_URL are both set.
  async redirects() {
    return legacyHostRedirects({
      LEGACY_HOSTS: process.env.LEGACY_HOSTS,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    });
  },
};

export default nextConfig;
