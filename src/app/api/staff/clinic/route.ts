import type { Clinic } from "@/lib/api-client";
import { PERMISSIONS } from "@/lib/auth";
import { parseClinicInfoBody } from "@/lib/clinic-info-fields";
import { staffFetch } from "@/lib/staff-api";
import { requirePermission, requireStaffSession } from "@/lib/staff-guard";

const toCurrentClinic = (clinic: Clinic): Clinic => ({
  ...clinic,
  onboardingCredentials: clinic.onboardingCredentials
    ? {
        email: clinic.onboardingCredentials.email,
        generatedAt: clinic.onboardingCredentials.generatedAt,
        sentAt: clinic.onboardingCredentials.sentAt,
        hasPassword: clinic.onboardingCredentials.hasPassword,
      }
    : null,
});

/**
 * Returns the signed-in clinic's own onboarding summary.
 *
 * The backend currently exposes the rich clinic record on the admin summary endpoint, so
 * this handler scopes the id from the session and strips credential setup URLs before the
 * browser sees the payload.
 */
export async function GET() {
  const guard = await requireStaffSession();

  if ("response" in guard) {
    return guard.response;
  }

  const response = await staffFetch(
    `/v1/admin/clinics/${encodeURIComponent(guard.session.clinicId)}`,
    { method: "GET" }
  );

  if (!response.ok) {
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
    });
  }

  const clinic = (await response.json()) as Clinic;

  return Response.json(toCurrentClinic(clinic));
}
/**
 * Saves the signed-in clinic's own details and billing information (Settings › Información del
 * centro). Clinic-edit permission: the centre's commercial identity is what members' cards and
 * invoices read, so not every signed-in role may change it. The clinic comes from the session —
 * never from the body — so a signed-in member of one clinic cannot edit another's.
 *
 * The backend route behind this is the Voone admin's clinic editor, which also writes the plan,
 * the active flag and the notification quota. So the body is never forwarded as received: it is
 * parsed, anything outside the centre-info/billing allowlist is refused with a 400, and only
 * the parsed fields go on. This request also carries no `x-actor-role: voone_admin`, which the
 * backend requires before it honours the privileged fields (defence in depth).
 */
export async function PATCH(request: Request) {
  const guard = await requirePermission(PERMISSIONS.clinicEdit);

  if ("response" in guard) {
    return guard.response;
  }

  const parsed = parseClinicInfoBody(await request.text());

  if (!parsed.ok) {
    return Response.json({ code: "INVALID_BODY", message: parsed.message }, { status: 400 });
  }

  const response = await staffFetch(
    `/v1/admin/clinics/${encodeURIComponent(guard.session.clinicId)}`,
    { method: "PATCH", body: JSON.stringify(parsed.value) }
  );

  if (!response.ok) {
    const body = await response.text();

    return new Response(body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json" },
    });
  }

  const clinic = (await response.json()) as Clinic;

  return Response.json(toCurrentClinic(clinic));
}