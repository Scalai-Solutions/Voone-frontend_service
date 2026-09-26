import type { Clinic } from "@/lib/api-client";
import { staffFetch } from "@/lib/staff-api";
import { requireStaffSession } from "@/lib/staff-guard";

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