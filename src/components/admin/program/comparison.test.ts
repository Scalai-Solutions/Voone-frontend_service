import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  comparisonHeadline,
  comparisonReason,
  comparisonRows,
  comparisonTone,
  deltaKind,
} from "./comparison.ts";
import { formatEuros } from "../../../lib/euros.ts";

const base = {
  inputs: { clients: 300, ticket: 60 },
  recommendedNet5y: 100000,
};

describe("deltaKind", () => {
  it("is judged on the rounded euros", () => {
    assert.equal(deltaKind(250), "more");
    assert.equal(deltaKind(-250), "less");
    assert.equal(deltaKind(0), "same");
    assert.equal(deltaKind(0.4), "same");
    assert.equal(deltaKind(-0.4), "same");
  });
});

describe("comparisonHeadline", () => {
  it("says how much less, with the standard values", () => {
    assert.equal(
      comparisonHeadline({ ...base, delta: -1200 }),
      `Comparado con nuestro plan recomendado, este plan deja ${formatEuros(1200)} menos de beneficio neto en 5 años ` +
        `(valores estándar: 300 clientes, ticket de ${formatEuros(60)})`,
    );
  });

  it("says how much more, using the size of the difference", () => {
    const text = comparisonHeadline({ ...base, delta: 15000 }) ?? "";

    assert.ok(
      text.includes(`deja ${formatEuros(15000)} más de beneficio neto en 5 años`),
    );
    assert.ok(!text.includes("-"));
  });

  it("says the same when nothing differs", () => {
    const text = comparisonHeadline({ ...base, delta: 0 }) ?? "";

    assert.ok(text.includes("deja el mismo beneficio neto en 5 años"));
  });

  it("is null without a recommended plan", () => {
    assert.equal(
      comparisonHeadline({ ...base, recommendedNet5y: null, delta: null }),
      null,
    );
  });
});

describe("comparisonTone", () => {
  it("is green for more, amber for less, neutral for the same", () => {
    assert.equal(comparisonTone({ ...base, delta: 10 }), "positive");
    assert.equal(comparisonTone({ ...base, delta: -10 }), "negative");
    assert.equal(comparisonTone({ ...base, delta: 0 }), "neutral");
  });

  it("is unavailable without a recommendation", () => {
    assert.equal(
      comparisonTone({ recommendedNet5y: null, delta: null }),
      "unavailable",
    );
  });
});

describe("comparisonReason", () => {
  it("returns the backend's reason, trimmed, or null", () => {
    assert.equal(comparisonReason({ reason: "  Sin base.  " }), "Sin base.");
    assert.equal(comparisonReason({ reason: null }), null);
    assert.equal(comparisonReason({}), null);
    assert.equal(comparisonReason({ reason: "   " }), null);
  });
});

describe("comparisonRows", () => {
  it("lists cumulative figures by year, in order", () => {
    const rows = comparisonRows({
      years: [
        {
          year: 2,
          recommendedNet: 1,
          currentNet: 1,
          recommendedCumulative: 3000.4,
          currentCumulative: 2500,
        },
        {
          year: 1,
          recommendedNet: 1,
          currentNet: 1,
          recommendedCumulative: 1000,
          currentCumulative: 900,
        },
      ],
    });

    assert.deepEqual(rows, [
      { year: 1, recommended: formatEuros(1000), thisPlan: formatEuros(900) },
      { year: 2, recommended: formatEuros(3000), thisPlan: formatEuros(2500) },
    ]);
  });

  it("shows a dash where there is no recommended figure", () => {
    const [row] = comparisonRows({
      years: [
        {
          year: 1,
          recommendedNet: null,
          currentNet: 5,
          recommendedCumulative: null,
          currentCumulative: 5,
        },
      ],
    });

    assert.equal(row.recommended, "—");
  });
});
