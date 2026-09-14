import { PageHeader } from "@/components/shared/page-kit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Ajustes" title="Ajustes de la clínica" description="El perfil de la clínica y el acceso del equipo se conectarán más adelante con la API de cuentas." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Perfil de clínica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Aurea Clinic</p>
            <p>Madrid</p>
            <p>Plantilla predeterminada: Gold Beauty Club</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Equipo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2"><span>Propietario</span><span className="text-muted-foreground">Acceso completo</span></div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2"><span>Recepción</span><span className="text-muted-foreground">Escaneo y miembros</span></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}