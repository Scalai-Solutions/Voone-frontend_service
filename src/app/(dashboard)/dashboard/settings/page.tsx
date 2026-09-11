import { PageHeader } from "@/components/shared/page-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Clinic settings" description="Clinic profile and staff access will connect to the account API later." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Clinic profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Aurea Clinic</p>
            <p>Madrid</p>
            <p>Default template: Gold Beauty Club</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Staff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2"><span>Owner</span><span className="text-muted-foreground">Full access</span></div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2"><span>Reception</span><span className="text-muted-foreground">Scan and members</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}