import { DashboardMotion } from "@/components/dashboard/dashboard-motion";
import { getClinicSignupUrl } from "@/lib/app-url";
import { type DashboardOverview } from "@/lib/api-client";
import { getCurrentStaffClinic } from "@/lib/current-clinic";
import { fetchDashboardOverview } from "@/lib/dashboard-overview-server";

async function getDashboardOverview(clinicId: string, fallbackMembers: number): Promise<DashboardOverview> {
  const overview = await fetchDashboardOverview(clinicId);

  // Month-scoped figures are left out when the request fails, so the page shows "—".
  return (
    overview ?? {
      activeMembers: fallbackMembers,
      pointsIssuedThisMonth: 0,
      walletAdds: 0,
      recentActivity: [],
    }
  );
}

export default async function DashboardOverviewPage() {
  const clinic = await getCurrentStaffClinic();
  const [signupUrl, overview] = await Promise.all([
    getClinicSignupUrl(clinic.id),
    getDashboardOverview(clinic.id, clinic.members),
  ]);

  return (
    <DashboardMotion overview={overview} clinic={clinic} signupUrl={signupUrl} />
  );
}