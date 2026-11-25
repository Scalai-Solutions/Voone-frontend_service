import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { legacyHostRedirects } from "./legacy-host-redirects.ts";

describe("legacyHostRedirects", () => {
  it("is off until both variables are set", () => {
    assert.deepEqual(legacyHostRedirects({}), []);
    assert.deepEqual(legacyHostRedirects({ LEGACY_HOSTS: "voone.ai" }), []);
    assert.deepEqual(
      legacyHostRedirects({ NEXT_PUBLIC_SITE_URL: "https://voone.es" }),
      [],
    );
    assert.deepEqual(
      legacyHostRedirects({
        LEGACY_HOSTS: " , ",
        NEXT_PUBLIC_SITE_URL: "https://voone.es",
      }),
      [],
    );
  });

  it("sends each old host to the new origin, keeping the path", () => {
    assert.deepEqual(
      legacyHostRedirects({
        LEGACY_HOSTS: "voone.ai, WWW.voone.ai",
        NEXT_PUBLIC_SITE_URL: "https://voone.es/",
      }),
      [
        {
          source: "/:path*",
          has: [{ type: "host", value: "voone.ai" }],
          destination: "https://voone.es/:path*",
          permanent: true,
        },
        {
          source: "/:path*",
          has: [{ type: "host", value: "www.voone.ai" }],
          destination: "https://voone.es/:path*",
          permanent: true,
        },
      ],
    );
  });

  it("never redirects the destination host to itself", () => {
    assert.deepEqual(
      legacyHostRedirects({
        LEGACY_HOSTS: "voone.es",
        NEXT_PUBLIC_SITE_URL: "https://voone.es",
      }),
      [],
    );
  });

  it("refuses a destination that is not a valid https URL", () => {
    assert.deepEqual(
      legacyHostRedirects({
        LEGACY_HOSTS: "voone.ai",
        NEXT_PUBLIC_SITE_URL: "voone.es",
      }),
      [],
    );
    assert.deepEqual(
      legacyHostRedirects({
        LEGACY_HOSTS: "voone.ai",
        NEXT_PUBLIC_SITE_URL: "http://voone.es",
      }),
      [],
    );
  });
});
