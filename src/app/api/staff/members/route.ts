import { z } from "zod";

import { forwardResponse, staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

/**
 * Staff member entry.
 *
 * The clinic comes from the session, never the body — so a signed-in member of one clinic
 * cannot enrol someone into another by editing a payload. consentMarketing and
 * consentSource are set here rather than accepted: staff cannot consent to marketing on a
 * client's behalf, and a caller must not be able to describe its own provenance.
 */
const bodySchema = z.object({
  name: z.string(),
  email: z.string(),
  phone: z.string().optional(),
});

const frontendOrigin = (request: Request): string => {
  const configured = process.env.NEXT_PUBLIC_APP_URL;

  if (configured) return configured.replace(/\/$/, "");

  const url = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(/:$/, "");

  return `${protocol}://${host}`.replace(/\/$/, "");
};

const withFrontendPassLink = (payload: unknown, request: Request): unknown => {
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("wallet" in payload) ||
    typeof payload.wallet !== "object" ||
    payload.wallet === null ||
    !("code" in payload.wallet) ||
    typeof payload.wallet.code !== "string" ||
    !payload.wallet.code
  ) {
    return payload;
  }

  return {
    ...payload,
    wallet: {
      ...payload.wallet,
      addToWalletUrl: `${frontendOrigin(request)}/wallet/add/${encodeURIComponent(payload.wallet.code)}`,
    },
  };
};

export async function GET() {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const response = await staffFetch(
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members`,
    { method: "GET" }
  );

  return forwardResponse(response);
}

export async function POST(request: Request) {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json(
      { code: "BAD_REQUEST", message: "Invalid request body" },
      { status: 400 }
    );
  }

  // Field-by-field rather than a spread: a key the client invents must not reach the
  // backend just because it was in the payload.
  const response = await staffFetch(
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members/pass`,
    {
      method: "POST",
      body: JSON.stringify({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || undefined,
      }),
    }
  );

  if (!response.ok) {
    return forwardResponse(response);
  }

  const payload = await response.json();

  return Response.json(withFrontendPassLink(payload, request));
}
