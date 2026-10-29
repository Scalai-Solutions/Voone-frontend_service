import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { BenefitLine, PresentedTier } from "@/lib/onboarding-api";
import {
  LAST_LINE_NOTE,
  MAX_OVERRIDE_LENGTH,
  OVERRIDE_WARNING,
  isLastVisible,
  customIndexOf,
  editLineOverride,
  hideLineOverride,
  restoreLineOverride,
  showLineOverride,
  tierLines,
} from "./benefit-overrides.ts";

/**
 * Run with `npm test`. Each entry sent to the backend REPLACES that line's override as a whole,
 * so a helper that changes one aspect (text or visibility) must carry the other forward: hiding
 * an edited line must not lose the edit, restoring the text of a hidden line must not show it.
 */
const line = (over: Partial<BenefitLine> = {}): BenefitLine => ({
  key: "discount",
  text: "Descuento del 5% en cosmética, hasta 3 productos al año",
  original: "Descuento del 5% en cosmética, hasta 3 productos al año",
  kind: "generated",
  edited: false,
  hidden: false,
  ...over,
});

describe("editLineOverride", () => {
  it("sends the trimmed text for an unedited, visible line", () => {
    assert.deepEqual(editLineOverride(line(), "  Un 5% menos  "), {
      ok: true,
      entry: { key: "discount", text: "Un 5% menos", hidden: null },
    });
  });

  it("keeps a hidden line hidden", () => {
    const result = editLineOverride(line({ hidden: true }), "Otro texto");

    assert.deepEqual(result, {
      ok: true,
      entry: { key: "discount", text: "Otro texto", hidden: true },
    });
  });

  it("sends null, never the original, when the text goes back to the original", () => {
    // The original of a generated line can exceed the 80 characters an edit may have.
    const long = "x".repeat(100);
    const result = editLineOverride(
      line({ original: long, text: "corto", edited: true }),
      `  ${long} `,
    );

    assert.deepEqual(result, {
      ok: true,
      entry: { key: "discount", text: null, hidden: null },
    });
  });

  it("refuses blank, over 120 characters, control and invisible characters", () => {
    assert.equal(MAX_OVERRIDE_LENGTH, 120);
    assert.equal(editLineOverride(line(), "   ").ok, false);
    assert.equal(editLineOverride(line(), "x".repeat(121)).ok, false);
    assert.equal(editLineOverride(line(), "a\nb").ok, false);
    assert.equal(editLineOverride(line(), "a\u202eb").ok, false);
    assert.equal(editLineOverride(line(), "a\u200bb").ok, false);
    assert.equal(editLineOverride(line(), "x".repeat(120)).ok, true);
  });

  it("refuses a line the centre wrote: it has its own route", () => {
    assert.equal(
      editLineOverride(line({ key: "custom:0", kind: "custom" }), "X").ok,
      false,
    );
  });
});

describe("hideLineOverride", () => {
  it("hides an unedited line", () => {
    assert.deepEqual(hideLineOverride(line()), {
      key: "discount",
      text: null,
      hidden: true,
    });
  });

  it("keeps the edit of an edited line", () => {
    assert.deepEqual(
      hideLineOverride(line({ text: "Mi texto", edited: true })),
      { key: "discount", text: "Mi texto", hidden: true },
    );
  });
});

describe("showLineOverride (Mostrar de nuevo)", () => {
  it("shows a hidden line again, original words", () => {
    assert.deepEqual(showLineOverride(line({ hidden: true })), {
      key: "discount",
      text: null,
      hidden: null,
    });
  });

  it("keeps the edit of a hidden, edited line", () => {
    assert.deepEqual(
      showLineOverride(line({ hidden: true, text: "Mi texto", edited: true })),
      { key: "discount", text: "Mi texto", hidden: null },
    );
  });
});

describe("restoreLineOverride (Restaurar)", () => {
  it("clears the edit of a visible line, which clears the override", () => {
    assert.deepEqual(
      restoreLineOverride(line({ text: "Mi texto", edited: true })),
      { key: "discount", text: null, hidden: null },
    );
  });

  it("keeps a hidden line hidden", () => {
    assert.deepEqual(
      restoreLineOverride(
        line({ text: "Mi texto", edited: true, hidden: true }),
      ),
      { key: "discount", text: null, hidden: true },
    );
  });
});

describe("isLastVisible", () => {
  const a = line({ key: "mult" });
  const b = line({ key: "tests" });
  const c = line({ key: "card", hidden: true });

  it("is true only for the one line left visible", () => {
    assert.equal(isLastVisible([a, c], a), true);
    assert.equal(isLastVisible([a, b, c], a), false);
    assert.equal(isLastVisible([a], a), true);
  });

  it("is never true for a hidden line", () => {
    assert.equal(isLastVisible([a, c], c), false);
  });

  it("counts the lines the centre wrote", () => {
    const custom = line({ key: "custom:0", kind: "custom" });

    assert.equal(isLastVisible([custom, c], custom), true);
    assert.equal(isLastVisible([a, custom], a), false);
  });

  it("carries the backend's own sentence", () => {
    assert.equal(
      LAST_LINE_NOTE,
      "Cada nivel debe mostrar al menos un beneficio.",
    );
  });
});

describe("customIndexOf", () => {
  it("reads the position out of a custom key", () => {
    assert.equal(customIndexOf("custom:0"), 0);
    assert.equal(customIndexOf("custom:12"), 12);
  });

  it("is null for a generated key or a malformed one", () => {
    assert.equal(customIndexOf("mult"), null);
    assert.equal(customIndexOf("custom:"), null);
    assert.equal(customIndexOf("custom:-1"), null);
    assert.equal(customIndexOf("custom:1x"), null);
  });
});

describe("tierLines", () => {
  const tier = (over: Partial<PresentedTier>): PresentedTier => ({
    key: "oro",
    label: "Oro",
    threshold: 0,
    minTenureMonths: 0,
    benefits: [],
    customBenefits: [],
    ...over,
  });

  it("uses benefitLines when the backend sends them", () => {
    const lines = [line(), line({ key: "tests", hidden: true })];
    const result = tierLines(tier({ benefitLines: lines }));

    assert.equal(result.overridable, true);
    assert.deepEqual(result.lines, lines);
  });

  it("falls back to today's rendering for an older backend", () => {
    const result = tierLines(
      tier({ benefits: ["Una", "Dos", "Café"], customBenefits: ["Café"] }),
    );

    assert.equal(result.overridable, false);
    assert.deepEqual(
      result.lines.map((l) => [l.kind, l.text, l.hidden, l.edited]),
      [
        ["generated", "Una", false, false],
        ["generated", "Dos", false, false],
        ["custom", "Café", false, false],
      ],
    );
    assert.equal(customIndexOf(result.lines[2].key), 0);
  });

  it("has unique keys in the fallback", () => {
    const result = tierLines(tier({ benefits: ["A", "A", "A"] }));

    assert.equal(new Set(result.lines.map((l) => l.key)).size, 3);
  });
});

describe("the warning", () => {
  it("is the agreed sentence", () => {
    assert.equal(
      OVERRIDE_WARNING,
      "Solo cambia el texto que ven tus clientes; el beneficio real no cambia.",
    );
  });
});
