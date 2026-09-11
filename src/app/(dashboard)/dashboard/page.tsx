import { DashboardMotion } from "@/components/dashboard/dashboard-motion";
import { getDashboardOverview, getTemplates } from "@/lib/api-client";

export default async function DashboardOverviewPage() {
  const [overview, templates] = await Promise.all([getDashboardOverview(), getTemplates()]);
  const primaryTemplate = templates[0];

  return (
    <DashboardMotion overview={overview} primaryTemplate={primaryTemplate} />
  );
}