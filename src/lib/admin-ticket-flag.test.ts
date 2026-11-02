import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  parseTicketComparison,
  ticketFlagHeadline,
  ticketFlagRows,
  ticketFlagUnavailable,
  type AdminTicketFlag,
  type TicketComparison,
} from "./admin-ticket-flag.ts";

const NB = " ";

const year = (
  n: number,
  live: number,
  proposed: number,
  recommended: number | null,
  vsLive: { euros: number; percent: number | null },
  vsRecommended: { euros: number; percent: number | null } | null,
) => ({
  year: n,
  live,
  proposed,
  recommended,
  vsLive: { year: n, ...vsLive },
  vsRecommended: vsRecommended ? { year: n, ...vsRecommended } : null,
});

const flag = (overrides: Partial<AdminTicketFlag> = {}): AdminTicketFlag => ({
  status: "ok",
  inputs: { clients: 80, ticket: 65 },
  years: [
    year(1, 10000, 10400, 10700, { euros: 400, percent: 4 }, { euros: -300, percent: -2.8 }),
    year(5, 24500, 25700, 26000, { euros: 1200, percent: 4.9 }, { euros: -300, percent: -1.2 }),
  ],
  reason: null,
  ...overrides,
});

const last = (f: AdminTicketFlag, patch: { vsLive?: number; vsRec?: number | null }) => ({
  ...f,
  years: f.years.map((y) =>
    y.year !== 5
      ? y
      : {
          ...y,
          vsLive: { ...y.vsLive, euros: patch.vsLive ?? y.vsLive.euros },
          vsRecommended:
            patch.vsRec === null
              ? null
              : patch.vsRec === undefined
                ? y.vsRecommended
                : { year: 5, euros: patch.vsRec, percent: null },
        },
  ),
});

describe("ticketFlagHeadline", () => {
  it("more than live, less than our recommendation", () => {
    assert.equal(
      ticketFlagHeadline(flag()),
      `If applied, this plan earns 1200${NB}€ more net over 5 years than the live plan, ` +
        `and 300${NB}€ less than our recommendation ` +
        `(standard values: 80 clients, 65${NB}€ ticket)`,
    );
  });

  it("less than live, more than our recommendation", () => {
    assert.equal(
      ticketFlagHeadline(last(flag(), { vsLive: -950, vsRec: 2000 })),
      `If applied, this plan earns 950${NB}€ less net over 5 years than the live plan, ` +
        `and 2000${NB}€ more than our recommendation ` +
        `(standard values: 80 clients, 65${NB}€ ticket)`,
    );
  });

  it("the same as live and the same as our recommendation", () => {
    assert.equal(
      ticketFlagHeadline(last(flag(), { vsLive: 0, vsRec: 0 })),
      `If applied, this plan earns the same net over 5 years as the live plan, ` +
        `and the same as our recommendation ` +
        `(standard values: 80 clients, 65${NB}€ ticket)`,
    );
  });

  it("the same as live but different from our recommendation", () => {
    assert.equal(
      ticketFlagHeadline(last(flag(), { vsLive: 0, vsRec: -15000 })),
      `If applied, this plan earns the same net over 5 years as the live plan, ` +
        `and 15.000${NB}€ less than our recommendation ` +
        `(standard values: 80 clients, 65${NB}€ ticket)`,
    );
  });

  it("with no recommended plan only the live clause appears", () => {
    assert.equal(
      ticketFlagHeadline(last(flag({ inputs: { clients: 1200, ticket: 65 } }), { vsRec: null })),
      `If applied, this plan earns 1200${NB}€ more net over 5 years than the live plan ` +
        `(standard values: 1200 clients, 65${NB}€ ticket)`,
    );
  });

  it("reads the last year, whatever order the years arrive in", () => {
    const f = flag();
    const reversed = { ...f, years: [...f.years].reverse() };

    assert.equal(ticketFlagHeadline(reversed), ticketFlagHeadline(f));
  });
});

describe("ticketFlagRows", () => {
  it("shows exact euros and percents with one decimal, signed", () => {
    assert.deepEqual(ticketFlagRows(flag()), [
      {
        year: 1,
        live: `10.000${NB}€`,
        proposed: `10.400${NB}€`,
        vsLive: `+400${NB}€ (+4.0${NB}%)`,
        vsRecommended: `−300${NB}€ (−2.8${NB}%)`,
      },
      {
        year: 5,
        live: `24.500${NB}€`,
        proposed: `25.700${NB}€`,
        vsLive: `+1200${NB}€ (+4.9${NB}%)`,
        vsRecommended: `−300${NB}€ (−1.2${NB}%)`,
      },
    ]);
  });

  it("uses a dash for a missing recommended plan and for a missing percent", () => {
    const f = flag({
      years: [year(1, 100, 340, null, { euros: 240, percent: null }, null)],
    });

    assert.deepEqual(ticketFlagRows(f), [
      {
        year: 1,
        live: `100${NB}€`,
        proposed: `340${NB}€`,
        vsLive: `+240${NB}€`,
        vsRecommended: "—",
      },
    ]);
  });

  it("writes zero without a sign and sorts by year", () => {
    const f = flag({
      years: [
        year(2, 5000, 5000, 5000, { euros: 0, percent: 0 }, { euros: 0, percent: 0 }),
        year(1, 1000, 1000, 1000, { euros: 0, percent: 0 }, { euros: 0, percent: 0 }),
      ],
    });
    const rows = ticketFlagRows(f);

    assert.deepEqual(
      rows.map((r) => r.year),
      [1, 2],
    );
    assert.equal(rows[0]!.vsLive, `0${NB}€ (0.0${NB}%)`);
  });
});

describe("ticketFlagUnavailable", () => {
  it("none gives its reason", () => {
    assert.equal(
      ticketFlagUnavailable({ status: "none", reason: "The clinic has no active programme." }),
      "The clinic has no active programme.",
    );
  });

  it("a blank none reason still says something", () => {
    assert.equal(ticketFlagUnavailable({ status: "none", reason: "  " }), "Comparison unavailable");
  });

  it("unpriced says there is nothing to compare", () => {
    assert.equal(
      ticketFlagUnavailable({ status: "unpriced", itemName: null }),
      "Free-text reward: nothing to compare. Choose a catalogue item when you create the draft.",
    );
  });

  it("ok has nothing to say", () => {
    assert.equal(ticketFlagUnavailable(flag()), null);
  });
});

describe("parseTicketComparison", () => {
  const raw = (f: AdminTicketFlag) => JSON.parse(JSON.stringify(f)) as unknown;
  const fallback: TicketComparison = { status: "none", reason: "Comparison unavailable" };

  it("accepts an ok flag and keeps the item name", () => {
    const parsed = parseTicketComparison({ ...(raw(flag()) as object), itemName: "Peeling" });

    assert.equal(parsed.status, "ok");
    assert.equal(parsed.itemName, "Peeling");
    assert.deepEqual((parsed as AdminTicketFlag).years, flag().years);
  });

  it("accepts null cells", () => {
    const f = flag({ years: [year(1, 100, 340, null, { euros: 240, percent: null }, null)] });

    assert.deepEqual((parseTicketComparison(raw(f)) as AdminTicketFlag).years, f.years);
  });

  it("accepts unpriced and none", () => {
    assert.deepEqual(parseTicketComparison({ status: "unpriced", itemName: null }), {
      status: "unpriced",
      itemName: null,
    });
    assert.deepEqual(parseTicketComparison({ status: "none", reason: "Nope", itemName: "A" }), {
      status: "none",
      reason: "Nope",
      itemName: "A",
    });
  });

  it("anything unreadable becomes the unavailable none", () => {
    assert.deepEqual(parseTicketComparison(null), fallback);
    assert.deepEqual(parseTicketComparison("x"), fallback);
    assert.deepEqual(parseTicketComparison({ status: "weird" }), fallback);
    assert.deepEqual(parseTicketComparison({ status: "none" }), fallback);
    assert.deepEqual(parseTicketComparison({ ...(raw(flag()) as object), years: [] }), fallback);
    assert.deepEqual(parseTicketComparison({ ...(raw(flag()) as object), inputs: {} }), fallback);
  });

  it("refuses a number that is not finite", () => {
    const bad = raw(flag()) as { years: Array<{ live: number | null }> };

    bad.years[0]!.live = null; // JSON turns NaN/Infinity into null
    assert.deepEqual(parseTicketComparison(bad), fallback);

    const inf = raw(flag()) as { years: Array<{ proposed: number }> };

    inf.years[1]!.proposed = Number.POSITIVE_INFINITY;
    assert.deepEqual(parseTicketComparison(inf), fallback);
  });
});
