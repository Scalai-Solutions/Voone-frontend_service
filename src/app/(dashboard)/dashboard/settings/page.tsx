import { AlertTriangle, Bell, Building2, Download, LifeBuoy, ShieldCheck, UsersRound } from "lucide-react";

import { ClinicInfoForm } from "@/components/dashboard/clinic-info-form";
import { DeactivationRequest, MembersCsvExport, NotificationSettingsToggle, PasswordChangeForm } from "@/components/dashboard/settings-actions";
import { RolePermissionsManager } from "@/components/dashboard/role-permissions-manager";
import { PERMISSIONS, getCurrentSession, hasPermission } from "@/lib/auth";
import { getCurrentStaffClinic } from "@/lib/current-clinic";
import { formatRole } from "@/lib/roles";

const ownerFor = (clinic: Awaited<ReturnType<typeof getCurrentStaffClinic>>) =>
  clinic.users.find((user) => user.role.toUpperCase() === "OWNER") ?? clinic.users[0];

export default async function SettingsPage() {
  const [session, clinic] = await Promise.all([getCurrentSession(), getCurrentStaffClinic()]);
  const owner = ownerFor(clinic);
  const accountFields = [
    { label: "Nombre", value: session?.name ?? owner?.email ?? "Sin nombre guardado" },
    { label: "Email", value: owner?.email ?? "Sin email guardado" },
    { label: "Rol", value: session ? formatRole(session.role) : "Sin rol guardado" },
  ];
  const canManageTeam = hasPermission(session, PERMISSIONS.teamManage);
  const canEditClinic = hasPermission(session, PERMISSIONS.clinicEdit);

  return (
    <section className="text-[#2e2421]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">Ajustes</p>
          <h1 className="mt-2 font-serif text-5xl font-semibold tracking-[-0.03em]">Cuenta y centro</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#927e72]">Gestiona acceso, seguridad, facturación, soporte y los datos operativos de tu clínica.</p>
        </div>
        <a href="mailto:support@voone.ai" className="inline-flex items-center gap-2 rounded-full bg-[#b8864b] px-5 py-3 text-sm font-semibold text-white shadow-sm"><LifeBuoy className="h-4 w-4" /> Contactar soporte</a>
      </div>

      <div className="mt-7 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {/* The account and the centre in one box, so the page is not so long: the account is
              read-only (support keeps the access safe) and everything about the centre — its
              commercial details and its billing information — is editable right below it. */}
          <SettingsSection eyebrow="Negocio" title="Información del centro" icon={Building2}>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Cuenta de usuario</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {accountFields.map((field) => <InfoField key={field.label} label={field.label} value={field.value} />)}
            </div>
            <p className="mt-5 rounded-2xl bg-[#fffaf6] px-4 py-3 text-sm text-[#806d63]">Los cambios de perfil se gestionan desde soporte para mantener el acceso seguro.</p>

            <div className="mt-6 border-t border-[#eadfd8] pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Datos del centro y facturación</p>
              <div className="mt-3">
                <ClinicInfoForm clinic={clinic} canEdit={canEditClinic} />
              </div>
            </div>
          </SettingsSection>

          <SettingsSection eyebrow="Seguridad" title="Acceso y contraseña" icon={ShieldCheck}>
            <PasswordChangeForm />
          </SettingsSection>

          {canManageTeam ? (
            <SettingsSection eyebrow="Equipo" title="Cuentas asociadas" icon={UsersRound}>
              <RolePermissionsManager initialClinic={clinic} />
            </SettingsSection>
          ) : null}

          <SettingsSection eyebrow="Preferencias" title="Notificaciones" icon={Bell}>
            <NotificationSettingsToggle clinicId={clinic.id} />
          </SettingsSection>

          <SettingsSection eyebrow="Datos" title="Exportación y privacidad" icon={Download}>
            <p className="text-sm leading-6 text-[#806d63]">Exporta miembros, actividad de puntos y consentimientos para auditoría interna.</p>
            <MembersCsvExport />
          </SettingsSection>

          <section className="rounded-3xl border border-[#d86d5e]/35 bg-[#fff7f5] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#b94135] text-white"><AlertTriangle className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b94135]">Zona de riesgo</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold">Desactivar centro</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#806d63]">Solicita a soporte la desactivación del centro, usuarios asociados y datos operativos.</p>
                <DeactivationRequest clinicName={clinic.name} />
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <section className="rounded-3xl bg-[#2d211e] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dcb17b]">Soporte</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">Necesitas ayuda?</h2>
            <p className="mt-3 text-sm leading-6 text-[#c9b7ad]">Escríbenos para facturación, problemas de acceso, diseños de tarjeta o solicitudes legales.</p>
            <a href="mailto:support@voone.ai" className="mt-5 inline-flex rounded-full bg-[#f5e8dd] px-4 py-2 text-sm font-semibold text-[#35241f]">Abrir email</a>
          </section>
        </aside>
      </div>
    </section>
  );
}

function SettingsSection({ eyebrow, title, icon: Icon, children }: { eyebrow: string; title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[#e2d5cc] bg-white/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">{eyebrow}</p><h2 className="mt-2 font-serif text-2xl font-semibold">{title}</h2></div>
        <Icon className="h-5 w-5 text-[#b8864b]" />
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-[#927e72]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

