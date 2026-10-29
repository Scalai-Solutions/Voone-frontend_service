import type { DashboardOverview } from "./api-client.ts";
import { MISSING, formatCents, formatCount } from "./money.ts";

/**
 * `pointsIssuedThisMonth` changed meaning in the backend: it used to be the all-time sum of paid
 * euros, it is now the points credited this month. An old deployment still sends the euro number
 * under the same name, so the field cannot be trusted on its own. `revenueAllTimeCents` is new in
 * the same release, so its presence is the marker that the new backend is live.
 */
export const hasMonthScopedMetrics = (overview: DashboardOverview | null | undefined): boolean =>
  typeof overview?.revenueAllTimeCents === "number";

/** "Puntos emitidos este mes": only from a backend that sends points; "—" otherwise. */
export const formatPointsIssuedThisMonth = (overview: DashboardOverview | null | undefined): string =>
  hasMonthScopedMetrics(overview) ? formatCount(overview?.pointsIssuedThisMonth) : MISSING;

/** "Ingresos este mes": euros, from cents; "—" when the backend does not send it. */
export const formatRevenueThisMonth = (overview: DashboardOverview | null | undefined): string =>
  formatCents(overview?.revenueThisMonthCents);

/** "Dinero gastado": the all-time total of paid visits, in euros; "—" when absent. */
export const formatMoneySpentTotal = (overview: DashboardOverview | null | undefined): string =>
  formatCents(overview?.moneySpentTotalCents);

/** "Canjes este mes"; "—" when absent. */
export const formatRewardsRedeemedThisMonth = (overview: DashboardOverview | null | undefined): string =>
  formatCount(overview?.rewardsRedeemedThisMonth);

export interface TopClientRow {
  memberId: string;
  name: string;
  /** Already formatted euros. */
  amount: string;
}

/** The top clients of the month for display. Empty when absent or malformed. */
export const topClientRows = (overview: DashboardOverview | null | undefined): TopClientRow[] =>
  (Array.isArray(overview?.topClientsThisMonth) ? overview.topClientsThisMonth : [])
    .filter((row) => typeof row?.amountCents === "number" && row.amountCents > 0)
    .map((row) => ({
      memberId: row.memberId,
      name: row.name?.trim() ? row.name : "Cliente",
      amount: formatCents(row.amountCents),
    }));
