/**
 * Sends the old domain's visitors to the new one, path and query intact, so printed QR
 * posters and links in installed wallet cards keep working after the site moves.
 *
 * It is off until BOTH variables are set, so it can ship before the new domain works and be
 * switched on at cutover:
 *   LEGACY_HOSTS          comma-separated hosts to send away, e.g. "voone.ai,www.voone.ai"
 *   NEXT_PUBLIC_SITE_URL  where they go, e.g. "https://voone.es"
 *
 * Only the listed hosts are matched, so the API and wallet hosts (other subdomains, served by
 * another service) are never touched. A host equal to the destination is skipped: that would
 * redirect the site to itself forever.
 */
export type LegacyHostRedirect = {
  source: string;
  has: { type: "host"; value: string }[];
  destination: string;
  permanent: true;
};

export function legacyHostRedirects(env: {
  LEGACY_HOSTS?: string;
  NEXT_PUBLIC_SITE_URL?: string;
}): LegacyHostRedirect[] {
  const hosts = (env.LEGACY_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);

  if (hosts.length === 0 || !env.NEXT_PUBLIC_SITE_URL) return [];

  let destination: URL;

  try {
    destination = new URL(env.NEXT_PUBLIC_SITE_URL);
  } catch {
    return [];
  }

  if (destination.protocol !== "https:") return [];

  const origin = destination.origin;

  return hosts
    .filter((host) => host !== destination.hostname)
    .map((host) => ({
      source: "/:path*",
      has: [{ type: "host" as const, value: host }],
      destination: `${origin}/:path*`,
      permanent: true as const,
    }));
}
