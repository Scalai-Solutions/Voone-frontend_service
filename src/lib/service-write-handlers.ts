/**
 * The write handlers of /api/staff/treatments and /api/staff/bonos, with their dependencies
 * passed in so the rules can be tested without a framework or a session:
 *
 *  - the guard runs first, and a refusal returns before the request body is touched;
 *  - the clinic slug in the backend path is the session's, never the request's.
 *
 * The route files wire in the real guard (`requireServiceWriteAllowed`), `staffFetch` and
 * `forwardResponse`.
 */
export interface ServiceWriteDeps {
  requireAllowed: () => Promise<
    { session: { clinicSlug: string } } | { response: Response }
  >;
  staffFetch: (
    path: string,
    init: { method: string; body?: string },
  ) => Promise<Response>;
  forwardResponse: (response: Response) => Promise<Response>;
}

type IdContext = { params: Promise<{ id: string }> };

export const serviceWriteHandlers = (
  resource: "treatments" | "bonos",
  deps: ServiceWriteDeps,
) => {
  const base = (slug: string) =>
    `/v1/clinics/${encodeURIComponent(slug)}/${resource}`;

  return {
    POST: async (request: Request): Promise<Response> => {
      const guard = await deps.requireAllowed();

      if ("response" in guard) return guard.response;

      return deps.forwardResponse(
        await deps.staffFetch(base(guard.session.clinicSlug), {
          method: "POST",
          body: await request.text(),
        }),
      );
    },

    PATCH: async (request: Request, context: IdContext): Promise<Response> => {
      const guard = await deps.requireAllowed();

      if ("response" in guard) return guard.response;

      const { id } = await context.params;

      return deps.forwardResponse(
        await deps.staffFetch(
          `${base(guard.session.clinicSlug)}/${encodeURIComponent(id)}`,
          { method: "PATCH", body: await request.text() },
        ),
      );
    },

    DELETE: async (_request: Request, context: IdContext): Promise<Response> => {
      const guard = await deps.requireAllowed();

      if ("response" in guard) return guard.response;

      const { id } = await context.params;

      return deps.forwardResponse(
        await deps.staffFetch(
          `${base(guard.session.clinicSlug)}/${encodeURIComponent(id)}`,
          { method: "DELETE" },
        ),
      );
    },
  };
};
