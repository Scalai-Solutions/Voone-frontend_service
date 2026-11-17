import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import { PLACEHOLDERS } from "./legal-placeholders.ts";

/** The pages that carry placeholders, as source: the registry is the list sent to the team. */
const DOCUMENTS = [
  "../../app/privacidad/page.tsx",
  "../../app/legal/tratamiento-datos/page.tsx",
] as const;

const read = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");

const usedKeys = () => {
  const keys = new Set<string>();

  for (const document of DOCUMENTS) {
    for (const match of read(document).matchAll(/<Ph k="([A-Z_]+)"/g)) {
      keys.add(match[1]);
    }
  }

  return keys;
};

describe("consent document placeholders", () => {
  it("lists every placeholder a document uses", () => {
    const registered = new Set(Object.keys(PLACEHOLDERS));

    for (const key of usedKeys()) {
      assert.ok(registered.has(key), `${key} is used in a document but missing from PLACEHOLDERS`);
    }
  });

  it("lists nothing a document no longer uses", () => {
    const used = usedKeys();

    for (const key of Object.keys(PLACEHOLDERS)) {
      assert.ok(used.has(key), `${key} is in PLACEHOLDERS but no document uses it`);
    }
  });

  it("keeps the draft banner on while any placeholder remains", () => {
    for (const document of DOCUMENTS) {
      const source = read(document);

      if (/<Ph k=/.test(source)) {
        assert.match(source, /<LegalPage[^>]*\bprovisional\b/, `${document} has placeholders but is not marked provisional`);
      }
    }
  });
});
