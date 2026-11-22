import type { Member } from "./api-client.ts";
import { monthKeyIn } from "./month-label.ts";

/**
 * Breakdowns of a clinic's members list: tiers, Wallet, age ranges and the all-time ranking.
 * Shared by the clinic's own metrics page and the admin's per-clinic analytics page, so both
 * count the same way.
 */

export const ageRanges = [
  { label: "18-24", min: 18, max: 24 },
  { label: "25-34", min: 25, max: 34 },
  { label: "35-44", min: 35, max: 44 },
  { label: "45-54", min: 45, max: 54 },
  { label: "55+", min: 55, max: Number.POSITIVE_INFINITY },
];

export function memberAge(member: Member) {
  if (member.birthDate) {
    const today = new Date();
    const date = new Date(`${member.birthDate}T00:00:00.000Z`);
    let age = today.getFullYear() - date.getUTCFullYear();
    const birthdayThisYear = new Date(Date.UTC(today.getFullYear(), date.getUTCMonth(), date.getUTCDate()));

    if (today.getTime() < birthdayThisYear.getTime()) age -= 1;

    return age;
  }

  return member.birthYear ? new Date().getFullYear() - member.birthYear : null;
}

export function buildMetrics(members: Member[]) {
  // The month the backend counts "this month" in: the Madrid calendar month.
  const monthKey = monthKeyIn("Europe/Madrid");
  const activeWalletMembers = members.filter((member) => Object.values(member.walletStatus).includes("added")).length;
  const membersByTier = countBy(members.map((member) => member.tier)).map(([tier, count]) => ({ tier, count }));

  return {
    monthKey,
    totalMembers: members.length,
    totalTiers: membersByTier.length,
    activeWalletMembers,
    leadingTier: membersByTier[0],
    membersByTier,
    membersByAge: ageRanges.map((range) => ({
      label: range.label,
      count: members.filter((member) => {
        const age = memberAge(member);
        return typeof age === "number" && age >= range.min && age <= range.max;
      }).length,
    })),
    // Ranked by current points balance (what the members list carries), shown in points.
    topClientsAllTime: rankMembers(members, (member) => member.points),
  };
}

export type MemberMetrics = ReturnType<typeof buildMetrics>;

export function countBy(values: string[]) {
  const counts = values.reduce<Map<string, number>>((items, value) => items.set(value, (items.get(value) ?? 0) + 1), new Map());

  return Array.from(counts.entries()).sort((first, second) => second[1] - first[1]);
}

export function rankMembers(members: Member[], scoreForMember: (member: Member) => number) {
  return members
    .map((member) => ({ member, score: scoreForMember(member) }))
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score)
    .slice(0, 5);
}

export function percentage(value: number, total: number) {
  if (total === 0) return 0;

  return Math.round((value / total) * 100);
}
