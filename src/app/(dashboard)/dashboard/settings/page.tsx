import { AlertTriangle, Bell, Building2, CreditCard, Download, KeyRound, LifeBuoy, MailCheck, ShieldCheck, Trash2, UserRound, UsersRound } from "lucide-react";

import { RolePermissionsManager } from "@/components/dashboard/role-permissions-manager";
import { SignupQrPanel } from "@/components/dashboard/signup-qr-panel";
import { getClinicSignupUrl } from "@/lib/app-url";
import { getCurrentSession } from "@/lib/auth";
import { getCurrentStaffClinic } from "@/lib/current-clinic";
import { formatRole } from "@/lib/roles";

const ownerFor = (clinic: Awaited<ReturnType<typeof getCurrentStaffClinic>>) =>
  clinic.users.find((user) => user.role.toUpperCase() === "OWNER") ?? clinic.users[0];

const formatNumber = (value: number) => value.toLocaleString("es-ES");

export default async function SettingsPage() {
  const [session, clinic] = await Promise.all([getCurrentSession(), getCurrentStaffClinic()]);
  const signupUrl = session?.clinicSlug ? await getClinicSignupUrl(session.clinicSlug) : null;
  const owner = ownerFor(clinic);
  const accountFields = [
    { label: "Nombre", value: session?.name ?? owner?.email ?? "Sin nombre guardado" },
    { label: "Email", value: owner?.email ?? "Sin email guardado" },
    { label: "Rol", value: session ? formatRole(session.role) : "Sin rol guardado" },
  ];
  const clinicFields = [
    { label: "Nombre del centro", value: clinic.name },
    { label: "Propietaria", value: owner?.email ?? "Sin propietario guardado" },
    { label: "Dirección", value: clinic.addressLine },
    { label: "Código postal", value: clinic.pincode },
    { label: "Identificador público", value: clinic.slug },
    { label: "Plan", value: clinic.voonePlan },
    { label: "Miembros activos", value: formatNumber(clinic.members) },
    { label: "Plantilla predeterminada", value: clinic.template?.programName ?? "Sin plantilla Wallet" },
    { label: "Aviso de privacidad", value: clinic.privacyPolicyVersion },
  ];

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
          <SettingsSection eyebrow="Perfil" title="Cuenta de usuario" icon={UserRound}>
            <div className="grid gap-4 sm:grid-cols-2">
              {accountFields.map((field) => <InfoField key={field.label} label={field.label} value={field.value} />)}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button className="rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]">Editar perfil</button>
              <button className="inline-flex items-center gap-2 rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]"><MailCheck className="h-4 w-4" /> Verificar email</button>
            </div>
          </SettingsSection>

          <SettingsSection eyebrow="Seguridad" title="Acceso y contraseña" icon={ShieldCheck}>
            <div className="grid gap-3 md:grid-cols-3">
              <ActionTile icon={KeyRound} title="Cambiar contraseña" text="Actualiza la clave de acceso del operador." action="Cambiar" />
              <ActionTile icon={MailCheck} title="Email verificado" text="Confirma el correo para alertas críticas." action="Reenviar" />
              <ActionTile icon={ShieldCheck} title="Sesiones" text="Revisa dispositivos y cierra sesiones antiguas." action="Revisar" />
            </div>
          </SettingsSection>

          <SettingsSection eyebrow="Negocio" title="Perfil de clínica" icon={Building2}>
            <div className="grid gap-4 sm:grid-cols-2">
              {clinicFields.map((field) => <InfoField key={field.label} label={field.label} value={field.value} />)}
            </div>
            <button className="mt-5 rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]">Editar información del centro</button>
          </SettingsSection>

          <SettingsSection eyebrow="Equipo" title="Roles y permisos" icon={UsersRound}>
            <RolePermissionsManager />
          </SettingsSection>

          <div className="grid gap-5 lg:grid-cols-2">
            <SettingsSection eyebrow="Facturación" title="Plan y pagos" icon={CreditCard}>
              <p className="text-sm leading-6 text-[#806d63]">Plan {clinic.voonePlan} activo. {formatNumber(clinic.notificationsRemainingThisMonth)} mensajes manuales disponibles de {formatNumber(clinic.notificationsMonthlyQuota)} este mes.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button className="rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]">Gestionar plan</button>
                <button className="rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]">Método de pago</button>
              </div>
            </SettingsSection>

            <SettingsSection eyebrow="Preferencias" title="Notificaciones" icon={Bell}>
              <div className="space-y-3 text-sm">
                <ToggleRow label="Alertas de envíos fallidos" enabled />
                <ToggleRow label="Resumen semanal por email" enabled />
                <ToggleRow label="Avisos de saldo bajo" />
              </div>
            </SettingsSection>
          </div>

          <SettingsSection eyebrow="Datos" title="Exportación y privacidad" icon={Download}>
            <p className="text-sm leading-6 text-[#806d63]">Exporta miembros, actividad de puntos y consentimientos para auditoría interna.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]"><Download className="h-4 w-4" /> Exportar datos</button>
              <button className="rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]">Ver consentimientos</button>
            </div>
          </SettingsSection>

          <section className="rounded-3xl border border-[#d86d5e]/35 bg-[#fff7f5] p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#b94135] text-white"><AlertTriangle className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b94135]">Zona de riesgo</p>
                <h2 className="mt-2 font-serif text-2xl font-semibold">Eliminar cuenta</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#806d63]">Solicita la eliminación del centro, usuarios asociados y datos operativos. Esta acción debe confirmarse por soporte antes de ejecutarse.</p>
                <button className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#b94135] px-4 py-2 text-sm font-semibold text-white"><Trash2 className="h-4 w-4" /> Solicitar eliminación</button>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          {signupUrl ? <SignupQrPanel signupUrl={signupUrl} /> : null}
          <section className="rounded-3xl bg-[#2d211e] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#dcb17b]">Soporte</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">Necesitas ayuda?</h2>
            <p className="mt-3 text-sm leading-6 text-[#c9b7ad]">Escríbenos para facturación, problemas de acceso, plantillas Wallet o solicitudes legales.</p>
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

function ActionTile({ icon: Icon, title, text, action }: { icon: React.ComponentType<{ className?: string }>; title: string; text: string; action: string }) {
  return (
    <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
      <Icon className="h-5 w-5 text-[#b8864b]" />
      <p className="mt-3 font-semibold">{title}</p>
      <p className="mt-2 min-h-10 text-sm leading-5 text-[#806d63]">{text}</p>
      <button className="mt-3 rounded-full border border-[#cdb9aa] px-3 py-1.5 text-xs font-semibold text-[#754b36]">{action}</button>
    </div>
  );
}

function ToggleRow({ label, enabled = false }: { label: string; enabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] px-4 py-3">
      <span className="font-medium">{label}</span>
      <span className={enabled ? "h-6 w-11 rounded-full bg-[#6b9a72] p-1" : "h-6 w-11 rounded-full bg-[#d8ccc4] p-1"}>
        <span className={enabled ? "block h-4 w-4 translate-x-5 rounded-full bg-white" : "block h-4 w-4 rounded-full bg-white"} />
      </span>
    </div>
  );
}
