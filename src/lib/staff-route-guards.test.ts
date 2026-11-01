import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { changeRequestForward } from "./change-request-forward.ts";
import { gateServiceWrite } from "./change-request-guard.ts";
import { readCappedText } from "./read-capped-body.ts";
import { serviceWriteHandlers } from "./service-write-handlers.ts";
import { staffHeaders } from "./staff-headers.ts";

/**
 * Handler-level rules, tested with the real handler logic and fake dependencies (the route files
 * only wire in the session guard, staffFetch and forwardResponse).
 */

const calls: Array<{ path: string; init: { method: string; body?: string } }> = [];

const makeHandlers = (
  resource: "treatments" | "bonos",
  session: { role: string; clinicSlug: string } | null,
) =>
  serviceWriteHandlers(resource, {
    requireAllowed: async () => {
      const refusal = gateServiceWrite(session);

      return refusal
        ? { response: Response.json(refusal, { status: 403 }) }
        : { session: { clinicSlug: session?.clinicSlug ?? "" } };
    },
    staffFetch: async (path, init) => {
      calls.push({ path, init });

      return new Response("{}", { status: 200 });
    },
    forwardResponse: async (response) => response,
  });

const postWithBody = () =>
  new Request("http://x/api", { method: "POST", body: JSON.stringify({ name: "x" }) });

describe("service write handlers refuse clinic sessions", () => {
  for (const resource of ["treatments", "bonos"] as const) {
    for (const role of ["owner", "manager", "staff"]) {
      it(`${resource}: ${role} gets 403 USE_CHANGE_REQUEST before the body is read`, async () => {
        calls.length = 0;
        const handlers = makeHandlers(resource, { role, clinicSlug: "mine" });
        const context = { params: Promise.resolve({ id: "abc" }) };
        const post = postWithBody();
        const patch = new Request("http://x/api", { method: "PATCH", body: "{}" });
        const del = new Request("http://x/api", { method: "DELETE" });

        for (const response of [
          await handlers.POST(post),
          await handlers.PATCH(patch, context),
          await handlers.DELETE(del, context),
        ]) {
          assert.equal(response.status, 403);
          assert.deepEqual(await response.json(), {
            code: "USE_CHANGE_REQUEST",
            message: "Para cambiar los servicios, solicita un cambio a Voone.",
          });
        }

        assert.equal(post.bodyUsed, false);
        assert.equal(patch.bodyUsed, false);
        assert.equal(calls.length, 0);
      });
    }
  }

  it("a missing session is refused too", async () => {
    calls.length = 0;
    const response = await makeHandlers("bonos", null).POST(postWithBody());

    assert.equal(response.status, 403);
    assert.equal(calls.length, 0);
  });
});

describe("service write handlers, when a caller is let through", () => {
  it("take the slug from the session and encode the id", async () => {
    calls.length = 0;
    const handlers = makeHandlers("treatments", {
      role: "voone_admin",
      clinicSlug: "the/session slug",
    });
    // The request names another clinic everywhere it can; none of it is used.
    const request = new Request("http://x/api/staff/treatments?clinicSlug=other", {
      method: "PATCH",
      headers: { "x-clinic-slug": "other" },
      body: JSON.stringify({ clinicSlug: "other" }),
    });

    await handlers.PATCH(request, { params: Promise.resolve({ id: "a/../b" }) });
    await handlers.POST(postWithBody());

    assert.equal(calls[0].path, "/v1/clinics/the%2Fsession%20slug/treatments/a%2F..%2Fb");
    assert.equal(calls[1].path, "/v1/clinics/the%2Fsession%20slug/treatments");
  });
});

describe("changeRequestForward", () => {
  it("builds the path from the session's slug and the headers from its role", () => {
    const sent = changeRequestForward({
      clinicSlug: "mi-centro",
      role: "manager",
      subpath: "/abc/messages",
      method: "POST",
      body: { body: "hola" },
    });

    assert.equal(sent.path, "/v1/clinics/mi-centro/change-requests/abc/messages");
    assert.deepEqual(sent.init.headers, { "x-actor-role": "manager" });
    assert.equal(sent.init.body, JSON.stringify({ body: "hola" }));
  });

  it("has no input through which a client header could enter", () => {
    const sent = changeRequestForward({
      clinicSlug: "s",
      role: "owner",
      subpath: "",
      method: "GET",
    });

    assert.deepEqual(Object.keys(sent.init.headers), ["x-actor-role"]);
    assert.equal(sent.init.body, undefined);
  });
});

describe("staffHeaders", () => {
  it("lets the session's actor and the key overwrite anything the caller passes", () => {
    const headers = staffHeaders({
      key: "secret",
      actor: "owner@clinic.es",
      extra: {
        "x-actor": "attacker@evil.com",
        "X-Voone-Staff-Key": "stolen",
        "x-actor-role": "owner",
      },
    });

    assert.equal(headers["x-actor"], "owner@clinic.es");
    assert.equal(headers["x-voone-staff-key"], "secret");
    assert.equal(headers["x-actor-role"], "owner");
    assert.equal(Object.keys(headers).filter((k) => k.toLowerCase() === "x-actor").length, 1);
  });

  it("drops a client-sent x-actor when the session has none (reads)", () => {
    const headers = staffHeaders({ extra: { "x-actor": "attacker@evil.com" } });

    assert.equal("x-actor" in headers, false);
    assert.equal("x-voone-staff-key" in headers, false);
  });
});

describe("readCappedText", () => {
  it("refuses on a declared Content-Length over the cap without reading", async () => {
    const request = new Request("http://x", {
      method: "POST",
      headers: { "content-length": "5000" },
      body: "small",
    });
    const result = await readCappedText(request, 1000);

    assert.deepEqual(result, { tooLarge: true });
    assert.equal(request.bodyUsed, false);
  });

  it("stops streaming a body that passes the cap", async () => {
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(new Uint8Array(400));
        if (pulled > 50) controller.close();
      },
    });
    const request = new Request("http://x", {
      method: "POST",
      body: stream,
      duplex: "half",
    } as RequestInit);
    const result = await readCappedText(request, 1000);

    assert.deepEqual(result, { tooLarge: true });
    assert.ok(pulled < 50, `read ${pulled} chunks`);
  });

  it("reads a body within the cap, and an empty one as empty text", async () => {
    const ok = await readCappedText(
      new Request("http://x", { method: "POST", body: "héllo" }),
      1000,
    );

    assert.deepEqual(ok, { text: "héllo" });
    assert.deepEqual(
      await readCappedText(new Request("http://x", { method: "POST" }), 1000),
      { text: "" },
    );
  });
});
