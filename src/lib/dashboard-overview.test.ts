import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DashboardOverview } from "./api-client.ts";
import {
  formatMoneySpentTotal,
  formatPointsIssuedThisMonth,
  formatRevenueThisMonth,
  formatRewardsRedeemedThisMonth,
  hasMonthScopedMetrics,
  topClientRows,
} from "./dashboard-overview.ts";

const plain = (text: string) => text.replace(/ /g, " ");

const base: DashboardOverview = {
  activeMembers: 3,
  pointsIssuedThisMonth: 4200,
  walletAdds: 1,
  recentActivity: [],
};

// What the new backend sends.
const current: DashboardOverview = {
  ...base,
  revenueThisMonthCents: 123456,
  revenueAllTimeCents: 9876543,
  moneySpentTotalCents: 9876543,
  rewardsRedeemedThisMonth: 12,
  topClientsThisMonth: [
    { memberId: "a", name: "Ana", amountCents: 50000 },
    { memberId: "b", name: "  ", amountCents: 2550 },
    { memberId: "c", name: "Cero", amountCents: 0 },
  ],
};

describe("new backend", () => {
  it("formats every figure", () => {
    assert.equal(hasMonthScopedMetrics(current), true);
    assert.equal(plain(formatRevenueThisMonth(current)), "1234,56 €");
    assert.equal(formatPointsIssuedThisMonth(current), "4200");
    assert.equal(plain(formatMoneySpentTotal(current)), "98.765,43 €");
    assert.equal(formatRewardsRedeemedThisMonth(current), "12");
  });

  it("lists top clients in euros, drops zero rows and names an unnamed one", () => {
    assert.deepEqual(
      topClientRows(current).map((row) => [row.name, plain(row.amount)]),
      [
        ["Ana", "500,00 €"],
        ["Cliente", "25,50 €"],
      ],
    );
  });

  it("shows a real zero as 0, not a dash", () => {
    const quiet = { ...current, pointsIssuedThisMonth: 0, revenueThisMonthCents: 0, rewardsRedeemedThisMonth: 0 };
    assert.equal(formatPointsIssuedThisMonth(quiet), "0");
    assert.equal(plain(formatRevenueThisMonth(quiet)), "0,00 €");
    assert.equal(formatRewardsRedeemedThisMonth(quiet), "0");
  });
});

describe("old backend (no new fields)", () => {
  it("never reads the old euro number as points", () => {
    assert.equal(hasMonthScopedMetrics(base), false);
    assert.equal(formatPointsIssuedThisMonth(base), "—");
  });

  it("shows a dash for every money and count figure", () => {
    assert.equal(formatRevenueThisMonth(base), "—");
    assert.equal(formatMoneySpentTotal(base), "—");
    assert.equal(formatRewardsRedeemedThisMonth(base), "—");
    assert.deepEqual(topClientRows(base), []);
  });
});

describe("no overview at all", () => {
  it("is all dashes", () => {
    for (const none of [null, undefined]) {
      assert.equal(hasMonthScopedMetrics(none), false);
      assert.equal(formatPointsIssuedThisMonth(none), "—");
      assert.equal(formatRevenueThisMonth(none), "—");
      assert.equal(formatMoneySpentTotal(none), "—");
      assert.equal(formatRewardsRedeemedThisMonth(none), "—");
      assert.deepEqual(topClientRows(none), []);
    }
  });

  it("does not trust points when only the marker is garbage", () => {
    const odd = { ...base, revenueAllTimeCents: "9" } as unknown as DashboardOverview;
    assert.equal(formatPointsIssuedThisMonth(odd), "—");
  });
});
