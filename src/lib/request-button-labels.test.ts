import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { requestButtonLabel, SUBJECT_LABEL_MAX } from "./request-button-labels.ts";

describe("requestButtonLabel", () => {
  it("builds the edit and remove strings the aria-labels use today", () => {
    assert.equal(requestButtonLabel("edit", "Depilación láser"), "Editar Depilación láser");
    assert.equal(requestButtonLabel("remove", "Depilación láser"), "Eliminar Depilación láser");
  });

  it("trims the subject and collapses inner whitespace", () => {
    assert.equal(requestButtonLabel("edit", "  Bono   10 sesiones \n"), "Editar Bono 10 sesiones");
  });

  it("clips a 200-character subject to a sane length with an ellipsis", () => {
    const label = requestButtonLabel("remove", "x".repeat(200));
    const subject = label.slice("Eliminar ".length);

    assert.equal(subject.length, SUBJECT_LABEL_MAX);
    assert.ok(subject.endsWith("…"));
    assert.ok(SUBJECT_LABEL_MAX <= 80);
  });

  it("leaves a subject at the limit untouched", () => {
    const subject = "y".repeat(SUBJECT_LABEL_MAX);

    assert.equal(requestButtonLabel("edit", subject), `Editar ${subject}`);
  });

  it("never returns an empty label, even with a blank subject", () => {
    assert.equal(requestButtonLabel("edit", ""), "Editar");
    assert.equal(requestButtonLabel("remove", "   "), "Eliminar");
  });
});
