import { DashboardMotion } from "@/components/dashboard/dashboard-motion";
import { type DashboardOverview } from "@/lib/api-client";
import { getCurrentStaffClinic } from "@/lib/current-clinic";

export default async function DashboardOverviewPage() {
  const clinic = await getCurrentStaffClinic();
  const overview: DashboardOverview = {
    activeMembers: clinic.members,
    pointsIssuedThisMonth: 18840,
    walletAdds: 0,
    recentActivity: [],
  };

  return (
    <DashboardMotion overview={overview} clinic={clinic} />
  );
}