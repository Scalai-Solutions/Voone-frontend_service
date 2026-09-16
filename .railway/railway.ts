import { defineRailway, github, preserve, project, service } from "railway/iac";

// A per-service partial, matching voone-backend's file.
//
// The service is named voone-web because that is the one holding the voone.ai domain and
// its certificate. It was already building from this repository — which is how the staff
// dashboard came to be served on the public marketing domain, unconfigured and with its
// auth gate off. Configuring that service in place rather than moving the domain avoids a
// DNS change: voone.ai needs a CNAME to a per-domain Railway target, and re-adding the
// domain elsewhere may issue a different one, which would take the domain down until
// Cloudflare caught up.
export const partial = "voone-web";

export default defineRailway(() => {
  const app = service("voone-web", {
    // Built from the repository rather than an uploaded snapshot, so a deploy is
    // reproducible from a commit and pushes to main deploy themselves.
    source: github("Scalai-Solutions/Voone-frontend_service"),

    build: "npm run build",
    start: "npm run start",

    // "/" is the marketing landing page, which needs no backend — so this is a liveness
    // check rather than a readiness one, and the app is not marked unhealthy just because
    // the API is briefly unreachable.
    healthcheckPath: "/",

    // Every variable is named here, because this file is authoritative: one that is not
    // declared gets DELETED by `railway config apply`. Secrets are preserve(), so they are
    // set once with `railway variable set --stdin` and never committed.
    env: {
      // Stops at /api: the paths in src/lib/api-client.ts carry their own /v1, and the
      // backend mounts its v1 router at /api/v1.
      NEXT_PUBLIC_VOONE_API_URL: "https://voone-backend-production.up.railway.app/api",

      // Required. With this unset, src/lib/auth.ts builds a session from a client-set
      // cookie — so anyone could assert the voone_admin role, and the /api/staff route
      // handlers would act on it while holding STAFF_API_KEY. Fine on a laptop, unsafe on
      // a public URL.
      AUTH_ENABLED: "true",

      NEXTAUTH_SECRET: preserve(),
      NEXTAUTH_URL: preserve(),

      // Absolute base for the sign-up URL a clinic's QR code encodes.
      NEXT_PUBLIC_APP_URL: preserve(),

      // The single operator account the credentials provider checks against. Not per-user
      // authentication — the User model has no password column — but enough that the
      // browser no longer grants itself a role. Both halves are preserved rather than
      // committed: an email is half a credential.
      VOONE_DEV_AUTH_EMAIL: preserve(),
      VOONE_DEV_AUTH_PASSWORD: preserve(),

      // A second account, because one cannot be both: the clinic dashboard requires an
      // owner/manager/staff role and the admin area requires voone_admin, which
      // isDashboardRole excludes. The admin account has no clinic, so requireStaffSession
      // refuses it — Voone staff cannot perform a clinic own writes by accident.
      VOONE_ADMIN_AUTH_EMAIL: preserve(),
      VOONE_ADMIN_AUTH_PASSWORD: preserve(),

      // Not secret: the role and clinic that account is scoped to. The clinic id matches
      // the seed's pinned value, which is also what the production clinic row uses, so
      // template writes address the right clinic.
      VOONE_DEV_AUTH_ROLE: "owner",
      VOONE_DEV_AUTH_CLINIC_SLUG: "aurea",
      VOONE_DEV_AUTH_CLINIC_ID: "00000000-0000-4000-8000-0000000a0001",

      // Now set, because the dashboard can authenticate someone. The browser never sees
      // it: the /api/staff route handlers hold it server-side and take the clinic from the
      // session, so a signed-in operator cannot act on another clinic.
      STAFF_API_KEY: preserve(),
    },
  });

  return project("voone-web", {
    resources: [app],
  });
});
