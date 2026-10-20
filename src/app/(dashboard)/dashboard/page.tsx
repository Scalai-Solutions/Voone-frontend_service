import { DashboardMotion } from "@/components/dashboard/dashboard-motion";
import { getClinicSignupUrl } from "@/lib/app-url";
import { type DashboardOverview } from "@/lib/api-client";
import { getCurrentStaffClinic } from "@/lib/current-clinic";
import { staffFetch } from "@/lib/staff-api";

async function getDashboardOverview(clinicId: string, fallbackMembers: number): Promise<DashboardOverview> {
  const response = await staffFetch(`/v1/dashboard/overview?clinicId=${encodeURIComponent(clinicId)}`, {
    method: "GET",
  });

  if (!response.ok) {
    return {
      activeMembers: fallbackMembers,
      pointsIssuedThisMonth: 0,
      walletAdds: 0,
      recentActivity: [],
    };
  }

  return response.json() as Promise<DashboardOverview>;
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