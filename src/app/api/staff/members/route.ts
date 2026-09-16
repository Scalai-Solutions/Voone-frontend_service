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
  phone: z.string(),
  email: z.string().optional(),
});

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
    `/v1/clinics/${encodeURIComponent(guard.session.clinicSlug)}/members`,
    {
      method: "POST",
      body: JSON.stringify({
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || undefined,
        consentMarketing: false,
        consentSource: "staff_entry",
      }),
    }
  );

  return forwardResponse(response);
}
