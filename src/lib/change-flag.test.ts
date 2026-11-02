import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  FLAG_FOOTNOTE,
  UNPRICED_BODY,
  UNPRICED_LABEL,
  cellTip,
  fiveYearSentence,
  markGlyph,
  parseOwnerFlag,
  signalCopy,
  type OwnerCell,
  type OwnerFlag,
} from "./change-flag.ts";

/** Run with `npm test`. The shapes mirror the backend's OwnerFlag (change-flag-present.ts). */

const cell = (patch: Partial<OwnerCell> = {}): OwnerCell => ({
  year: 3,
  mark: "up",
  euros: 1200,
  percent: 10,
  over20: false,
  ...patch,
});

const okFlag = (patch: Record<string, unknown> = {}) => ({
  status: "ok",
  signal: "good",
  vsCurrent: [1, 2, 3, 4, 5].map((year) => cell({ year })),
  vsRecommended: null,
  fiveYearEuros: 2400,
  ...patch,
});

describe("signalCopy", () => {
  it("names the three signals", () => {
    assert.deepEqual(signalCopy("good"), { label: "Buena opción", tone: "good" });
    assert.deepEqual(signalCopy("costs-more"), { label: "Te cuesta más", tone: "costs-more" });
    assert.deepEqual(signalCopy("similar"), { label: "Similar", tone: "similar" });
  });

  it("has the unpriced words and the footnote", () => {
    assert.equal(UNPRICED_LABEL, "Sin valorar");
    assert.equal(
      UNPRICED_BODY,
      "Voone la valorará al revisar tu solicitud. No hay comparación todavía.",
    );
    assert.equal(FLAG_FOOTNOTE, "Estimación con valores estándar, redondeada a 100 €");
  });
});

describe("markGlyph", () => {
  it("maps each mark", () => {
    assert.equal(markGlyph("up"), "▲");
    assert.equal(markGlyph("same"), "＝");
    assert.equal(markGlyph("down"), "▼");
  });
});

describe("cellTip", () => {
  it("up against the current plan: euros and percent", () => {
    assert.equal(cellTip(cell(), "current"), "Hasta el año 3: unos 1.200\u00a0€ más (aprox. 10 %)");
  });

  it("down against the recommendation", () => {
    assert.equal(
      cellTip(cell({ year: 5, mark: "down", euros: -300, percent: -5 }), "recommended"),
      "Hasta el año 5: unos 300\u00a0€ menos que la recomendación de Voone (aprox. 5 %)",
    );
  });

  it("negative euros read as menos, never with a minus sign", () => {
    const tip = cellTip(cell({ mark: "down", euros: -1500, percent: -15 }), "current");

    assert.equal(tip, "Hasta el año 3: unos 1.500\u00a0€ menos (aprox. 15 %)");
    assert.ok(!tip.includes("-"));
  });

  it("same carries no number", () => {
    const same = cell({ year: 2, mark: "same", euros: null, percent: null });

    assert.equal(cellTip(same, "current"), "Hasta el año 2: prácticamente igual que tu plan actual");
    assert.equal(
      cellTip(same, "recommended"),
      "Hasta el año 2: prácticamente igual que la recomendación de Voone",
    );
  });

  it("omits the percent when it is 0 or null, never printing 0 %", () => {
    const zero = cellTip(cell({ euros: 300, percent: 0 }), "current");
    const none = cellTip(cell({ euros: 300, percent: null }), "current");

    assert.equal(zero, "Hasta el año 3: unos 300\u00a0€ más");
    assert.equal(none, "Hasta el año 3: unos 300\u00a0€ más");
    assert.ok(!zero.includes("0 %"));
    assert.equal(
      cellTip(cell({ mark: "down", euros: -300, percent: 0 }), "recommended"),
      "Hasta el año 3: unos 300\u00a0€ menos que la recomendación de Voone",
    );
  });

  it("over20 with euros keeps the sentence shape and ends with más del 20 %", () => {
    assert.equal(
      cellTip(cell({ year: 5, euros: 4000, percent: 25, over20: true }), "current"),
      "Hasta el año 5: unos 4.000\u00a0€ más (más del 20 %)",
    );
    assert.equal(
      cellTip(cell({ year: 5, mark: "down", euros: -4000, percent: -25, over20: true }), "current"),
      "Hasta el año 5: unos 4.000\u00a0€ menos (más del 20 %)",
    );
    assert.equal(
      cellTip(cell({ year: 5, mark: "down", euros: -4000, percent: -25, over20: true }), "recommended"),
      "Hasta el año 5: unos 4.000\u00a0€ menos que la recomendación de Voone (más del 20 %)",
    );
    assert.equal(
      cellTip(cell({ year: 4, euros: 3000, percent: 30, over20: true }), "recommended"),
      "Hasta el año 4: unos 3.000\u00a0€ más que la recomendación de Voone (más del 20 %)",
    );
  });

  it("over20 without euros keeps the más del 20 % mejor / peor wording", () => {
    assert.equal(
      cellTip(cell({ year: 5, euros: null, percent: null, over20: true }), "current"),
      "Hasta el año 5: más del 20 % mejor que tu plan actual",
    );
    assert.equal(
      cellTip(cell({ year: 5, mark: "down", euros: null, percent: null, over20: true }), "current"),
      "Hasta el año 5: más del 20 % peor que tu plan actual",
    );
    assert.equal(
      cellTip(cell({ year: 4, mark: "down", euros: null, percent: null, over20: true }), "recommended"),
      "Hasta el año 4: más del 20 % peor que la recomendación de Voone",
    );
    assert.equal(
      cellTip(cell({ year: 4, euros: 0, percent: null, over20: true }), "recommended"),
      "Hasta el año 4: más del 20 % mejor que la recomendación de Voone",
    );
  });

  it("separates the amount from € with a no-break space, never a plain one", () => {
    assert.ok(cellTip(cell({ euros: 1200 }), "current").includes("1.200\u00a0€"));
    assert.ok(!cellTip(cell({ euros: 1200 }), "current").includes("1.200 €"));
  });

  it("formats euros in es-ES with a thousands separator, from four digits", () => {
    assert.match(cellTip(cell({ euros: 1200 }), "current"), /unos 1\.200\u00a0€ más/);
    assert.match(cellTip(cell({ euros: 15000 }), "current"), /unos 15\.000\u00a0€ más/);
    assert.match(cellTip(cell({ euros: 300 }), "current"), /unos 300\u00a0€ más/);
  });

  it("never invents a number: an up cell without euros says only mejor / peor", () => {
    assert.equal(
      cellTip(cell({ euros: null, percent: null }), "current"),
      "Hasta el año 3: mejor que tu plan actual",
    );
    assert.equal(
      cellTip(cell({ mark: "down", euros: null, percent: null }), "recommended"),
      "Hasta el año 3: peor que la recomendación de Voone",
    );
  });
});

describe("fiveYearSentence", () => {
  const flag = (fiveYearEuros: number | null): OwnerFlag => ({
    status: "ok",
    signal: "good",
    vsCurrent: [cell()],
    vsRecommended: null,
    fiveYearEuros,
  });

  it("says más for a gain and menos for a loss", () => {
    assert.equal(fiveYearSentence(flag(2400)), "unos 2.400\u00a0€ más en 5 años que tu plan actual");
    assert.equal(fiveYearSentence(flag(-1500)), "unos 1.500\u00a0€ menos en 5 años que tu plan actual");
  });

  it("is null without a figure, at zero, or when there is no flag", () => {
    assert.equal(fiveYearSentence(flag(null)), null);
    assert.equal(fiveYearSentence(flag(0)), null);
    assert.equal(fiveYearSentence({ status: "none" }), null);
    assert.equal(fiveYearSentence({ status: "unpriced" }), null);
  });
});

describe("parseOwnerFlag", () => {
  it("keeps a well-formed ok flag, both rows", () => {
    const input = okFlag({
      signal: "costs-more",
      vsRecommended: [1, 2, 3, 4, 5].map((year) =>
        cell({ year, mark: "same", euros: null, percent: null }),
      ),
      fiveYearEuros: -300,
    });

    assert.deepEqual(parseOwnerFlag(input), input);
  });

  it("answers unpriced and none exactly", () => {
    assert.deepEqual(parseOwnerFlag({ status: "unpriced" }), { status: "unpriced" });
    assert.deepEqual(parseOwnerFlag({ status: "none" }), { status: "none" });
  });

  it("garbage is none", () => {
    for (const garbage of [
      null,
      undefined,
      42,
      "ok",
      [],
      {},
      { status: "weird" },
      { status: 1 },
      { status: "ok", signal: "great", vsCurrent: [cell()] },
    ]) {
      assert.deepEqual(parseOwnerFlag(garbage), { status: "none" }, JSON.stringify(garbage));
    }
  });

  it("an ok flag missing its arrays is none", () => {
    assert.deepEqual(parseOwnerFlag({ status: "ok" }), { status: "none" });
    assert.deepEqual(
      parseOwnerFlag({ status: "ok", signal: "good", fiveYearEuros: 100 }),
      { status: "none" },
    );
    assert.deepEqual(
      parseOwnerFlag(okFlag({ vsCurrent: [] })),
      { status: "none" },
    );
    assert.deepEqual(
      parseOwnerFlag(okFlag({ vsCurrent: "nope" })),
      { status: "none" },
    );
  });

  it("a malformed cell makes the whole flag none", () => {
    assert.deepEqual(
      parseOwnerFlag(okFlag({ vsCurrent: [cell(), { ...cell(), mark: "sideways" }] })),
      { status: "none" },
    );
    assert.deepEqual(
      parseOwnerFlag(okFlag({ vsCurrent: [{ ...cell(), euros: "1200" }] })),
      { status: "none" },
    );
    assert.deepEqual(
      parseOwnerFlag(okFlag({ vsCurrent: [{ ...cell(), over20: "no" }] })),
      { status: "none" },
    );
    assert.deepEqual(
      parseOwnerFlag(okFlag({ vsRecommended: [{ ...cell(), year: "3" }] })),
      { status: "none" },
    );
    assert.deepEqual(
      parseOwnerFlag(okFlag({ vsCurrent: [{ ...cell(), euros: Infinity }] })),
      { status: "none" },
    );
  });

  it("drops any key the type does not have, at every level", () => {
    const parsed = parseOwnerFlag(
      okFlag({
        live: [1, 2, 3, 4, 5],
        rewardValueEuro: 45,
        reason: "internal",
        itemName: "Masaje",
        vsCurrent: [{ ...cell(), exact: 1234.5, live: 9 }],
      }),
    );

    assert.equal(parsed.status, "ok");
    assert.deepEqual(Object.keys(parsed).sort(), [
      "fiveYearEuros",
      "signal",
      "status",
      "vsCurrent",
      "vsRecommended",
    ]);

    if (parsed.status === "ok") {
      assert.deepEqual(Object.keys(parsed.vsCurrent[0]).sort(), [
        "euros",
        "mark",
        "over20",
        "percent",
        "year",
      ]);
    }

    const text = JSON.stringify(parsed);

    for (const leaked of ["live", "rewardValueEuro", "reason", "itemName", "exact", "1234.5"]) {
      assert.ok(!text.includes(leaked), leaked);
    }

    assert.deepEqual(parseOwnerFlag({ status: "none", reason: "no programme" }), { status: "none" });
    assert.deepEqual(parseOwnerFlag({ status: "unpriced", itemName: "Masaje" }), {
      status: "unpriced",
    });
  });

  it("a same cell never carries a number, whatever was sent", () => {
    const parsed = parseOwnerFlag(
      okFlag({ vsCurrent: [cell({ mark: "same", euros: 800, percent: 10 })] }),
    );

    assert.equal(parsed.status, "ok");

    if (parsed.status === "ok") {
      assert.equal(parsed.vsCurrent[0].euros, null);
      assert.equal(parsed.vsCurrent[0].percent, null);
    }
  });

  it("a missing vsRecommended is null", () => {
    const input: Record<string, unknown> = okFlag();

    delete input.vsRecommended;

    const parsed = parseOwnerFlag(input);

    assert.equal(parsed.status, "ok");

    if (parsed.status === "ok") assert.equal(parsed.vsRecommended, null);
  });
});
