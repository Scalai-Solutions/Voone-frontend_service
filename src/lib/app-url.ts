import { headers } from "next/headers";

/**
 * The public origin of this app, for building links that leave it — the sign-up URL a
 * clinic's QR code encodes, above all.
 *
 * NEXT_PUBLIC_APP_URL wins when set, which is what keeps a poster printed from a preview
 * deployment pointing at production. Otherwise it is derived from the request, so local
 * development needs no configuration. x-forwarded-* are read first because behind a proxy
 * the Host header is the internal one.
 */
export const getAppOrigin = async (): Promise<string> => {
  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  return host ? `${protocol}://${host}` : "";
};

/** Absolute URL of a clinic's public sign-up page. */
export const getClinicSignupUrl = async (clinicSlug: string): Promise<string> =>
  `${await getAppOrigin()}/alta/${clinicSlug}`;
