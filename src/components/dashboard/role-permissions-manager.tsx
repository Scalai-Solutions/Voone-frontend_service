"use client";

import * as React from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { useCurrentClinic } from "@/features/clinics/api/useCurrentClinic";
import {
  ApiError,
  createClinicUser,
  deleteClinicUser,
  updateClinicUser,
  type Clinic,
  type ClinicUser,
} from "@/lib/api-client";
import { PERMISSIONS, type Permission } from "@/lib/auth-shared";
import { queryKeys } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

const permissionOptions: Array<{
  id: Permission;
  label: string;
  helper: string;
}> = [
  {
    id: PERMISSIONS.membersManage,
    label: "Miembros",
    helper: "Ver y crear miembros",
  },
  {
    id: PERMISSIONS.pointsAdjust,
    label: "Puntos",
    helper: "Sumar puntos a miembros",
  },
  { id: PERMISSIONS.scanUse, label: "Escáner", helper: "Usar recepción y QR" },
  {
    id: PERMISSIONS.notificationsSend,
    label: "Comunicaciones",
    helper: "Ver y enviar notificaciones",
  },
  {
    id: PERMISSIONS.clinicEdit,
    label: "Editar centro",
    helper: "Cambiar datos y Wallet",
  },
  {
    id: PERMISSIONS.teamManage,
    label: "Equipo",
    helper: "Crear o borrar cuentas",
  },
];

const defaultWorkerPermissions: Permission[] = [
  PERMISSIONS.membersManage,
  PERMISSIONS.pointsAdjust,
  PERMISSIONS.scanUse,
];

const normalizeRole = (role: string) => role.toLowerCase();

const canEditUser = (user: ClinicUser) => normalizeRole(user.role) !== "owner";

export function RolePermissionsManager({
  initialClinic,
}: {
  initialClinic: Clinic;
}) {
  const queryClient = useQueryClient();
  const currentClinic = useCurrentClinic({ initialData: initialClinic });
  const clinic = currentClinic.data ?? initialClinic;
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [permissions, setPermissions] = React.useState<Permission[]>(
    defaultWorkerPermissions,
  );
  const [pendingUserId, setPendingUserId] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const refreshClinic = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.currentClinic() });
  };

  const togglePermission = (permission: Permission) => {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const messageForError = (error: unknown, fallback: string) =>
    error instanceof ApiError && error.detail ? error.detail : fallback;

  const createUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setPendingUserId("new");

    try {
      const response = await createClinicUser(clinic.id, {
        name: name.trim() || undefined,
        email: email.trim(),
        permissions,
      });

      setName("");
      setEmail("");
      setPermissions(defaultWorkerPermissions);
      refreshClinic();
      setStatus({
        type: "success",
        text: response.emailSent
          ? "Cuenta creada. Hemos enviado el enlace para crear contraseña."
          : `Cuenta creada. Copia el enlace de acceso: ${response.setupUrl ?? "no disponible"}`,
      });
    } catch (error) {
      setStatus({
        type: "error",
        text: messageForError(error, "No se pudo crear la cuenta."),
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const savePermissions = async (
    user: ClinicUser,
    nextPermissions: Permission[],
  ) => {
    setStatus(null);
    setPendingUserId(user.id);

    try {
      await updateClinicUser(clinic.id, user.id, {
        permissions: nextPermissions,
      });
      refreshClinic();
      setStatus({ type: "success", text: "Permisos actualizados." });
    } catch (error) {
      setStatus({
        type: "error",
        text: messageForError(error, "No se pudieron actualizar los permisos."),
      });
    } finally {
      setPendingUserId(null);
    }
  };

  const removeUser = async (user: ClinicUser) => {
    setStatus(null);
    setPendingUserId(user.id);

    try {
      await deleteClinicUser(clinic.id, user.id);
      refreshClinic();
      setStatus({ type: "success", text: "Cuenta eliminada." });
    } catch (error) {
      setStatus({
        type: "error",
        text: messageForError(error, "No se pudo eliminar la cuenta."),
      });
    } finally {
      setPendingUserId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        {clinic.users.map((user) => (
          <TeamUserCard
            key={user.id}
            user={user}
            busy={pendingUserId === user.id}
            onSave={savePermissions}
            onDelete={removeUser}
          />
        ))}
      </div>

      {status ? (
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm font-semibold",
            status.type === "error"
              ? "border border-[#d86d5e]/40 bg-[#fff7f5] text-[#8f3f35]"
              : "border border-[#86b37e]/40 bg-[#f3fbf1] text-[#456f3f]",
          )}
        >
          {status.text}
        </div>
      ) : null}

      <form
        onSubmit={createUser}
        className="rounded-2xl border border-[#eadfd8] bg-white/70 p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Nombre
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm font-normal outline-none focus:border-[#b8864b]"
              placeholder="Recepción"
            />
          </label>
          <label className="block text-sm font-semibold">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm font-normal outline-none focus:border-[#b8864b]"
              placeholder="equipo@clinica.com"
            />
          </label>
        </div>
        <PermissionChecklist
          permissions={permissions}
          onToggle={togglePermission}
        />
        <button
          type="submit"
          disabled={pendingUserId === "new" || !email.trim()}
          className="mt-4 inline-flex items-center rounded-full bg-[#2d211e] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="mr-2 h-4 w-4" /> Crear cuenta asociada
        </button>
      </form>
    </div>
  );
}

function TeamUserCard({
  user,
  busy,
  onSave,
  onDelete,
}: {
  user: ClinicUser;
  busy: boolean;
  onSave: (user: ClinicUser, permissions: Permission[]) => void;
  onDelete: (user: ClinicUser) => void;
}) {
  const editable = canEditUser(user);
  const [draftPermissions, setDraftPermissions] = React.useState<Permission[]>(
    user.permissions ?? [],
  );

  React.useEffect(() => {
    setDraftPermissions(user.permissions ?? []);
  }, [user.permissions]);

  const toggleDraft = (permission: Permission) => {
    if (!editable) return;
    setDraftPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  return (
    <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{user.name || user.email}</p>
          <p className="mt-1 text-xs text-[#927e72]">
            {user.email} · {user.role.toLowerCase()}
          </p>
          <p className="mt-1 text-xs text-[#927e72]">
            {user.hasPassword ? "Contraseña activa" : "Pendiente de contraseña"}
          </p>
        </div>
        {editable ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onDelete(user)}
            className="text-[#b94135] disabled:opacity-50"
            aria-label={`Eliminar cuenta ${user.email}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {editable ? (
        <>
          <PermissionChecklist
            permissions={draftPermissions}
            onToggle={toggleDraft}
            compact
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => onSave(user, draftPermissions)}
            className="mt-3 inline-flex items-center rounded-full border border-[#cdb9aa] px-3 py-1.5 text-xs font-semibold text-[#754b36] disabled:opacity-50"
          >
            <Save className="mr-2 h-3.5 w-3.5" /> Guardar permisos
          </button>
        </>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#2d211e] px-3 py-1 text-xs font-semibold text-white">
            Acceso completo
          </span>
        </div>
      )}
    </div>
  );
}

function PermissionChecklist({
  permissions,
  onToggle,
  compact = false,
}: {
  permissions: Permission[];
  onToggle: (permission: Permission) => void;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "mt-4 grid gap-2",
        compact ? "sm:grid-cols-1" : "sm:grid-cols-2",
      )}
    >
      {permissionOptions.map((permission) => (
        <label
          key={permission.id}
          className="flex items-start gap-2 rounded-xl border border-[#eadfd8] bg-[#fffaf6] px-3 py-2 text-sm"
        >
          <input
            type="checkbox"
            checked={permissions.includes(permission.id)}
            onChange={() => onToggle(permission.id)}
            className="mt-0.5 h-4 w-4 accent-[#b8864b]"
          />
          <span>
            <span className="block font-semibold">{permission.label}</span>
            <span className="block text-xs text-[#927e72]">
              {permission.helper}
            </span>
          </span>
        </label>
      ))}
    </div>
  );
}
