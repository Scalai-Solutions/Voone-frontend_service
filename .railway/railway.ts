import { defineRailway, github, preserve, project, service } from "railway/iac";

// A per-service partial, matching voone-web's and voone-backend's files.
export const partial = "voone-frontend";

export default defineRailway(() => {
  const app = service("voone-frontend", {
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
      // handlers would act on it while holding STAFF_API_KEY. That is fine on a laptop and
      // not on a public URL.
      //
      // The consequence, stated plainly: src/components/auth/local-login-form.tsx never
      // calls signIn(), so it cannot create the session proxy.ts looks for. The dashboard
      // therefore redirects to a login that cannot complete, and the staff route handlers
      // answer 403. That is deliberate — the staff surface is not ready, and the
      // member-facing page at /alta/[clinic] needs none of it.
      AUTH_ENABLED: "true",

      NEXTAUTH_SECRET: preserve(),
      NEXTAUTH_URL: preserve(),

      // Absolute base for the sign-up URL a clinic's QR code encodes.
      NEXT_PUBLIC_APP_URL: preserve(),

      // STAFF_API_KEY is deliberately NOT set here. The staff surface is closed, so the
      // key would never be used — and an unused credential on a public service is risk
      // without benefit. Set it when the dashboard can actually authenticate someone.
    },
  });

  return project("voone-web", {
    resources: [app],
  });
});
