"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";

type RoleTemplate = "Owner" | "Esthetician";

interface ManagedRole {
  id: string;
  name: string;
  template: RoleTemplate;
  rights: string[];
}

const accessRights = [
  { id: "profile", label: "Editar datos del centro" },
  { id: "billing", label: "Gestionar facturación" },
  { id: "members", label: "Gestionar miembros" },
  { id: "points", label: "Ajustar puntos" },
  { id: "scan", label: "Escanear visitas" },
  { id: "engage", label: "Enviar comunicaciones" },
];

const templateRights: Record<RoleTemplate, string[]> = {
  Owner: accessRights.map((right) => right.id),
  Esthetician: ["members", "points", "scan"],
};

const initialRoles: ManagedRole[] = [
  { id: "role-owner", name: "Owner", template: "Owner", rights: templateRights.Owner },
  { id: "role-esthetician", name: "Esthetician", template: "Esthetician", rights: templateRights.Esthetician },
];

export function RolePermissionsManager() {
  const [roles, setRoles] = React.useState(initialRoles);
  const [template, setTemplate] = React.useState<RoleTemplate>("Esthetician");
  const [name, setName] = React.useState("Esthetician");
  const [rights, setRights] = React.useState<string[]>(templateRights.Esthetician);

  function chooseTemplate(nextTemplate: RoleTemplate) {
    setTemplate(nextTemplate);
    setName(nextTemplate);
    setRights(templateRights[nextTemplate]);
  }

  function toggleRight(rightId: string) {
    setRights((currentRights) =>
      currentRights.includes(rightId)
        ? currentRights.filter((item) => item !== rightId)
        : [...currentRights, rightId]
    );
  }

  function addRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName || !rights.length) return;

    setRoles((currentRoles) => [
      ...currentRoles,
      { id: `role-${Date.now()}`, name: trimmedName, template, rights },
    ]);
    chooseTemplate("Esthetician");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        {roles.map((role) => (
          <div key={role.id} className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{role.name}</p>
                <p className="mt-1 text-xs text-[#927e72]">Plantilla {role.template}</p>
              </div>
              <button type="button" onClick={() => setRoles((currentRoles) => currentRoles.filter((item) => item.id !== role.id))} className="text-[#b94135]" aria-label={`Eliminar rol ${role.name}`}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {role.rights.map((rightId) => {
                const right = accessRights.find((item) => item.id === rightId);
                return right ? <span key={right.id} className="rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">{right.label}</span> : null;
              })}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={addRole} className="rounded-2xl border border-[#eadfd8] bg-white/70 p-4">
        <div className="flex flex-wrap gap-2">
          {(["Owner", "Esthetician"] as RoleTemplate[]).map((item) => (
            <button key={item} type="button" onClick={() => chooseTemplate(item)} className={cn("rounded-full px-4 py-2 text-sm font-semibold", template === item ? "bg-[#2d211e] text-white" : "border border-[#cdb9aa] text-[#754b36]")}>{item}</button>
          ))}
        </div>
        <label className="mt-4 block text-sm font-semibold">
          Nombre del rol
          <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm font-normal outline-none focus:border-[#b8864b]" />
        </label>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {accessRights.map((right) => (
            <label key={right.id} className="flex items-center gap-2 rounded-xl border border-[#eadfd8] bg-[#fffaf6] px-3 py-2 text-sm">
              <input type="checkbox" checked={rights.includes(right.id)} onChange={() => toggleRight(right.id)} className="h-4 w-4 accent-[#b8864b]" />
              {right.label}
            </label>
          ))}
        </div>
        <button type="submit" disabled={!name.trim() || !rights.length} className="mt-4 inline-flex items-center rounded-full bg-[#2d211e] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          <Plus className="mr-2 h-4 w-4" /> Crear rol
        </button>
      </form>
    </div>
  );
}
