"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy, Plus, X } from "lucide-react";

import { ImageUploadButton } from "@/components/shared/image-upload-button";
import { GoogleWalletCardPreview } from "@/components/shared/google-wallet-card-preview";
import { WalletCardPreview } from "@/components/shared/wallet-card-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProvisionClinic } from "@/features/onboarding/api/useProvisionClinic";
import { chooseLogoUrl } from "@/lib/logo-choice";
import { toPoints } from "@/lib/points";
import { type ApiError, type TemplatePreset, type VooneTemplate } from "@/lib/api-client";
import {
  DEFAULT_WALLET_BACKGROUND_COLOR,
  DEFAULT_WALLET_POINTS_LABEL,
  DEFAULT_WALLET_PROGRAM_NAME,
  DEFAULT_WALLET_TEMPLATE_DESCRIPTION,
  DEFAULT_WALLET_TEMPLATE_NAME,
  DEFAULT_WALLET_TIER_LABEL,
} from "@/lib/default-wallet-template";

const steps = ["Propietario", "Centro", "Pase"];

/** Prefix of the status shown once the draft clinic is saved; the status is styled as success by it. */
const SAVED_STATUS_PREFIX = "Clínica guardada";

/** Mirrors the backend limit on further wallet buttons. */
const EXTRA_BUTTONS_MAX = 5;

/** One URL and nothing else. Anything pasted alongside it (a caption, a second link) is refused. */
const isSingleUrl = (value: string): boolean => {
  const text = value.trim();

  if (text === "") return true;
  if (/\s/.test(text)) return false;

  try {
    const url = new URL(text);

    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
};

/** Why the current step cannot be left yet, or null. Drives the disabled button and its hint. */
const blockedReason = (step: number, values: OnboardingValues): string | null => {
  if (step === 0 && (!values.ownerName || !values.ownerMobile || !values.ownerEmail)) {
    return "Añade el nombre, el móvil y el email del propietario para continuar.";
  }
  if (step === 1 && (!values.centerName || !values.addressLine || !values.pincode)) {
    return "Añade el nombre, la dirección y el código postal del centro.";
  }
  if (step === 1 && !values.dataConsent) {
    return "Confirma el consentimiento de tratamiento de datos para continuar.";
  }
  if (step === 2 && !values.vooneTemplateId) {
    return "Elige un diseño de plantilla antes de crear la clínica.";
  }
  if (step === 2 && !values.programName.trim()) {
    return "Añade el nombre del programa o club antes de crear la clínica.";
  }
  if (step === 2 && !values.logo.trim()) {
    return "Añade la URL del logo de la clínica (una sola dirección web).";
  }
  if (step === 2) {
    const fields: Array<[string, string]> = [
      ["La URL del logo de la clínica", values.logo],
      ["La URL del logo para fondo oscuro", values.logoOnDark],
      ["La URL de la imagen principal", values.heroImageUrl],
      ["La URL del botón principal", values.appointmentUrl],
      ...values.extraButtons.map((button, index): [string, string] => [`La URL del botón secundario ${index + 1}`, button.url]),
    ];
    const bad = fields.find(([, value]) => !isSingleUrl(value));

    if (bad) return `${bad[0]} debe ser una única dirección web, sin texto adicional ni espacios.`;
  }
  if (step === 2 && values.extraButtons.some((button) => !button.label.trim() || !button.url.trim())) {
    return "Da a cada botón adicional un texto y una dirección web, o elimínalo.";
  }

  return null;
};
type TreatmentDraft = {
  name: string;
  priceEuro: string;
};

type OnboardingValues = {
  ownerName: string;
  ownerMobile: string;
  ownerEmail: string;
  fullName: string;
  mobile: string;
  age: string;
  sex: string;
  centerName: string;
  centerMobile: string;
  centerEmail: string;
  addressLine: string;
  pincode: string;
  logo: string;
  logoOnDark: string;
  colors: [string, string, string];
  dataConsent: boolean;
  programName: string;
  treatments: TreatmentDraft[];
  vooneTemplateId: string;
  presetId: string;
  heroImageUrl: string;
  websiteUrl: string;
  appointmentUrl: string;
  appLinkText: string;
  appLinkDescription: string;
  pointsLabel: string;
  tierLabel: string;
  benefitsText: string;
  infoText: string;
  /** Further wallet buttons beside the main one. */
  extraButtons: Array<{ label: string; url: string }>;
};

const initialValues: OnboardingValues = {
  ownerName: "",
  ownerMobile: "",
  ownerEmail: "",
  fullName: "",
  mobile: "",
  age: "",
  sex: "",
  centerName: "",
  centerMobile: "",
  centerEmail: "",
  addressLine: "",
  pincode: "",
  logo: "",
  logoOnDark: "",
  colors: [DEFAULT_WALLET_BACKGROUND_COLOR, "#201715", "#b98a4f"],
  dataConsent: false,
  programName: "",
  treatments: [{ name: "", priceEuro: "" }],
  vooneTemplateId: "",
  presetId: "",
  heroImageUrl: "",
  websiteUrl: "",
  appointmentUrl: "",
  appLinkText: "",
  appLinkDescription: "",
  pointsLabel: DEFAULT_WALLET_POINTS_LABEL,
  tierLabel: DEFAULT_WALLET_TIER_LABEL,
  benefitsText: "",
  infoText: "",
  extraButtons: [],
};

type OnboardingTemplateOption = Pick<VooneTemplate, "id" | "presetId" | "preset" | "name" | "description" | "programName" | "hexBackgroundColor" | "logoUrl" | "heroImageUrl" | "pointsLabel" | "tierLabel" | "benefitsText" | "infoText" | "buttons">;

const templateOptionsFor = (presets: TemplatePreset[], templates: VooneTemplate[]): OnboardingTemplateOption[] => {
  if (templates.length > 0) {
    return templates;
  }

  return presets.map((preset, index) => ({
    id: preset.id,
    presetId: preset.id,
    preset,
    name: index === 0 ? DEFAULT_WALLET_TEMPLATE_NAME : preset.name,
    description: index === 0 ? DEFAULT_WALLET_TEMPLATE_DESCRIPTION : "Diseño inicial predefinido",
    programName: index === 0 ? DEFAULT_WALLET_PROGRAM_NAME : `${preset.name} Club`,
    hexBackgroundColor: index === 0 ? DEFAULT_WALLET_BACKGROUND_COLOR : preset.hexBackgroundColor,
    logoUrl: "",
    heroImageUrl: "",
    pointsLabel: initialValues.pointsLabel,
    tierLabel: initialValues.tierLabel,
    benefitsText: initialValues.benefitsText,
    infoText: initialValues.infoText,
    buttons: [],
  }));
};

const intOrDefault = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Treatment points use the ratio the programme shows clients (see lib/points). Tiers and milestone
 * rewards are not asked for here; the backend applies its defaults and the programme builder is the
 * only place they change afterwards.
 */
const treatmentsPayload = (values: OnboardingValues) => {
  const treatments = values.treatments
    .map((treatment) => ({
      name: treatment.name.trim(),
      priceEuro: intOrDefault(treatment.priceEuro, 120),
    }))
    .filter((treatment) => treatment.name.length > 0)
    .map((treatment) => ({
      ...treatment,
      pointsAllotted: toPoints(treatment.priceEuro),
    }));

  return treatments;
};

/** The values after choosing a design: its id, preset and background colour. */
const withTemplate = (current: OnboardingValues, template: OnboardingTemplateOption): OnboardingValues => ({
  ...current,
  vooneTemplateId: template.id,
  presetId: template.presetId ?? template.preset?.id ?? current.presetId,
  colors: [template.hexBackgroundColor, current.colors[1], current.colors[2]],
});

export function OnboardingWizard({ presets, templates }: { presets: TemplatePreset[]; templates: VooneTemplate[] }) {
  const router = useRouter();
  const templateOptions = templateOptionsFor(presets, templates);
  const [step, setStep] = React.useState(0);
  const [values, setValues] = React.useState<OnboardingValues>(() => ({
    ...initialValues,
    presetId: presets[0]?.id ?? "",
  }));

  // Design 1 is selected until the user picks another, so the card editor is open on arrival.
  // Adjusted during render (not in an effect) so there is never a frame without a selection.
  if (!values.vooneTemplateId && templateOptions[0]) {
    setValues(withTemplate(values, templateOptions[0]));
  }
  const [status, setStatus] = React.useState<string | null>(null);
  const [setupLinkCopied, setSetupLinkCopied] = React.useState(false);
  const selectedTemplate = templateOptions.find((template) => template.id === values.vooneTemplateId);
  const templateEdited = Boolean(
    selectedTemplate &&
      (values.colors[0] !== selectedTemplate.hexBackgroundColor ||
        values.programName.trim().length > 0 ||
        values.logo.trim().length > 0 ||
        values.heroImageUrl.trim().length > 0 ||
        values.appointmentUrl.trim().length > 0 ||
        values.appLinkText.trim().length > 0 ||
        values.extraButtons.length > 0),
  );
  const provisionMutation = useProvisionClinic({
    onSuccess: (provisionedClinic) => {
      setStatus(`${SAVED_STATUS_PREFIX} como borrador. Continuamos con los tratamientos y el programa.`);
      setSetupLinkCopied(false);
      // The centre now exists as an inactive draft; the rest of onboarding runs against it.
      const notice = provisionedClinic.walletWarning ? `?notice=${encodeURIComponent(provisionedClinic.walletWarning)}` : "";
      router.push(`/admin/clinics/${encodeURIComponent(provisionedClinic.clinic.id)}/setup${notice}`);
    },
    onError: (error) => {
      const detail = error instanceof Error && "detail" in error ? (error as ApiError).detail : undefined;
      setStatus(detail ?? "No se pudo crear la clínica. Revisa los datos obligatorios e inténtalo de nuevo.");
    },
  });

  function update<Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus(null);
  }

  function selectTemplate(template: OnboardingTemplateOption) {
    setValues((current) => withTemplate(current, template));
    setStatus(null);
  }


  function next() {
    const reason = blockedReason(step, values);

    if (reason) {
      setStatus(reason);
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function finish() {
    const reason = blockedReason(2, values);

    if (reason) {
      setStatus(reason);
      return;
    }

    setStatus(null);

    provisionMutation.mutate({
      name: values.centerName,
      addressLine: values.addressLine,
      pincode: values.pincode,
      ownerName: values.ownerName,
      ownerEmail: values.ownerEmail,
      presetId: values.presetId,
      programName: values.programName.trim(),
      hexBackgroundColor: values.colors[0],
      logoUrl: values.logo.trim(),
      logoOnDarkUrl: values.logoOnDark.trim(),
      heroImageUrl: values.heroImageUrl.trim(),
      websiteUrl: "",
      appointmentUrl: values.appointmentUrl.trim(),
      appLinkText: values.appLinkText.trim(),
      appLinkDescription: values.appLinkText.trim(),
      pointsLabel: DEFAULT_WALLET_POINTS_LABEL,
      tierLabel: DEFAULT_WALLET_TIER_LABEL,
      benefitsText: values.benefitsText,
      infoText: values.infoText,
      extraButtons: values.extraButtons.map((button) => ({ label: button.label.trim(), url: button.url.trim() })),
      treatments: treatmentsPayload(values),
    });
  }

  async function copySetupLink() {
    const setupUrl = provisionMutation.data?.onboardingCredentials?.setupUrl;

    if (!setupUrl) return;

    await navigator.clipboard.writeText(setupUrl);
    setSetupLinkCopied(true);
  }

  const setupUrl = provisionMutation.data?.onboardingCredentials?.setupUrl;
  const blocked = blockedReason(step, values);

  return (
    <section className={`mx-auto min-h-[650px] overflow-hidden rounded-[24px] border border-[#ded2cb] bg-white shadow-[0_20px_56px_rgba(67,48,43,0.12)] ${step === 2 ? "max-w-[1180px]" : "max-w-[900px]"}`}>
      <div className="flex min-w-0 flex-col p-7 sm:p-10">
        <div className="flex items-center justify-between gap-4"><Link href="/admin/onboarding" className="inline-flex items-center gap-2 text-sm font-semibold text-[#704f40]"><ArrowLeft className="h-4 w-4" /> Volver</Link><span className="text-sm text-[#806d63]">Paso {step + 1} de {steps.length}</span></div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#eee6e0]"><span className="block h-full rounded-full bg-[#201715] transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

        <div className="my-auto pt-10">
          {step === 0 ? <OwnerStep values={values} update={update} /> : null}
          {step === 1 ? <CenterStep values={values} update={update} /> : null}
          {step === 2 ? <PassStepEditor templates={templateOptions} selectedTemplate={selectedTemplate} templateEdited={templateEdited} values={values} update={update} selectTemplate={selectTemplate} /> : null}
        </div>

        <div className="mt-8 border-t border-[#eadfd8] pt-5">
          {!status && blocked ? <p className="mb-4 text-sm text-[#806d63]">{blocked}</p> : null}
          {status ? <p className={`mb-4 text-sm ${status.startsWith(SAVED_STATUS_PREFIX) ? "text-[#2f7d57]" : "text-destructive"}`}>{status}</p> : null}
          {setupUrl ? (
            <div className="mb-4 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">Enlace para que el cliente cree su contraseña</p>
              <code className="mt-2 block break-all rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#2e2421]">{setupUrl}</code>
              <Button type="button" variant="outline" onClick={copySetupLink} className="mt-3 rounded-xl">
                <Copy className="mr-2 h-4 w-4" /> {setupLinkCopied ? "Copiado" : "Copiar enlace"}
              </Button>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="rounded-xl">Anterior</Button>
            {step < steps.length - 1 ? <Button type="button" onClick={next} disabled={blocked !== null} title={blocked ?? undefined} className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]">Continuar <ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="button" onClick={finish} disabled={provisionMutation.isPending || blocked !== null} title={blocked ?? undefined} className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]">{provisionMutation.isPending ? "Guardando..." : "Guardar y continuar"}<ArrowRight className="ml-2 h-4 w-4" /></Button>}
          </div>
        </div>
      </div>

    </section>
  );
}

function OwnerStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return <StepContent title="Te damos la bienvenida. ¿Quién dirige esta clínica?" detail="Usaremos estos datos para la titularidad de la clínica y la comunicación durante la puesta en marcha."><div className="grid gap-4 sm:grid-cols-2"><WizardField label="Nombre del propietario"><Input value={values.ownerName} onChange={(event) => update("ownerName", event.target.value)} placeholder="Ana López" /></WizardField><WizardField label="Móvil del propietario"><Input value={values.ownerMobile} onChange={(event) => update("ownerMobile", event.target.value)} placeholder="+34 600 000 000" /></WizardField><WizardField label="Email del propietario" className="sm:col-span-2"><Input type="email" value={values.ownerEmail} onChange={(event) => update("ownerEmail", event.target.value)} placeholder="ana@clinic.com" /></WizardField><WizardField label="Nombre del contacto principal"><Input value={values.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Persona de contacto para la puesta en marcha" /></WizardField><WizardField label="Móvil del contacto principal"><Input value={values.mobile} onChange={(event) => update("mobile", event.target.value)} placeholder="+34 600 000 000" /></WizardField></div></StepContent>;
}

function CenterStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return (
    <StepContent title="Cuéntanos sobre el centro." detail="Estos datos crean la página pública de alta de miembros y forman la ficha de la clínica.">
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardField label="Nombre del centro" className="sm:col-span-2">
          <Input value={values.centerName} onChange={(event) => update("centerName", event.target.value)} placeholder="Clínica Aurea" />
        </WizardField>
        <WizardField label="Dirección del centro" className="sm:col-span-2">
          <Input value={values.addressLine} onChange={(event) => update("addressLine", event.target.value)} placeholder="Calle Serrano 42" />
        </WizardField>
        <WizardField label="Código postal">
          <Input value={values.pincode} onChange={(event) => update("pincode", event.target.value)} placeholder="28001" />
        </WizardField>
        <WizardField label="Móvil del centro">
          <Input value={values.centerMobile} onChange={(event) => update("centerMobile", event.target.value)} placeholder="+34 910 000 000" />
        </WizardField>
        <WizardField label="Email del centro">
          <Input type="email" value={values.centerEmail} onChange={(event) => update("centerEmail", event.target.value)} placeholder="hola@clinic.com" />
        </WizardField>
        <label className="flex items-start gap-3 rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-4 text-sm sm:col-span-2">
          <input type="checkbox" checked={values.dataConsent} onChange={(event) => update("dataConsent", event.target.checked)} className="mt-1 h-4 w-4 accent-[#201715]" />
          <span>
            <span className="font-semibold">Consentimiento de tratamiento de datos</span>
            <span className="mt-1 block text-[#806d63]">El centro confirma que está autorizado a tratar los datos de sus miembros.</span>
            <a href="/legal/tratamiento-datos" target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold underline">Leer el documento de consentimiento completo</a>
          </span>
        </label>
      </div>
    </StepContent>
  );
}

function PassStepEditor({ templates, selectedTemplate, templateEdited, values, update, selectTemplate }: { templates: OnboardingTemplateOption[]; selectedTemplate: OnboardingTemplateOption | undefined; templateEdited: boolean; values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void; selectTemplate: (template: OnboardingTemplateOption) => void }) {
  const cardName = values.centerName.trim() || "Nombre del centro";

  return (
    <StepContent title="Personaliza la tarjeta de wallet." detail="Elige un diseño y rellena solo los campos que se muestran en la tarjeta del miembro.">
      <div className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {templates.map((template, index) => (
            <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left text-sm transition ${values.vooneTemplateId === template.id ? "border-[#201715] ring-2 ring-[#d9b477]/50" : "border-[#ded2cb] hover:border-[#b98a4f]"}`}>
              <span className="h-6 w-6 rounded-full border border-[#ded2cb]" style={{ backgroundColor: template.hexBackgroundColor }} />
              <span className="font-semibold">Diseño {index + 1}</span>
            </button>
          ))}
        </div>

        {templates.length === 0 ? <p className="rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-4 text-sm text-[#806d63]">Crea un diseño de plantilla antes de dar de alta una clínica.</p> : null}

        {selectedTemplate ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <form className="rounded-[22px] border border-[#ded2cb] bg-white p-5 shadow-[0_12px_28px_rgba(67,48,43,0.08)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Campos de la tarjeta de wallet</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{cardName}</h2>
                <p className="mt-1 text-xs text-[#806d63]">El nombre de la plantilla se toma del nombre del centro; el nombre del club aparece en la tarjeta de wallet.</p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <WizardField label="Color de la tarjeta">
                  <Input type="color" value={values.colors[0]} onChange={(event) => update("colors", [event.target.value, values.colors[1], values.colors[2]])} className="h-10 rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="URL del logo de la clínica" action={<ImageUploadButton kind="logo" scope="admin" labels={{ ariaLabel: "Subir imagen del logo de la clínica" }} onUploaded={(url) => update("logo", url)} />}>
                  <Input value={values.logo} onChange={(event) => update("logo", event.target.value)} placeholder="https://.../logo.png" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Logo para fondo oscuro (opcional, se usa si el color de la tarjeta es oscuro)" className="sm:col-span-2" action={<ImageUploadButton kind="logoOnDark" scope="admin" labels={{ ariaLabel: "Subir imagen del logo para fondo oscuro" }} onUploaded={(url) => update("logoOnDark", url)} />}>
                  <Input value={values.logoOnDark} onChange={(event) => update("logoOnDark", event.target.value)} placeholder="https://.../logo-light.png" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Nombre del programa o club" className="sm:col-span-2">
                  <Input value={values.programName} onChange={(event) => update("programName", event.target.value)} placeholder="Club Diamante" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="URL de la imagen principal (opcional)" className="sm:col-span-2" action={<ImageUploadButton kind="hero" scope="admin" labels={{ ariaLabel: "Subir imagen principal" }} onUploaded={(url) => update("heroImageUrl", url)} />}>
                  <Input value={values.heroImageUrl} onChange={(event) => update("heroImageUrl", event.target.value)} placeholder="https://.../hero.jpg" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-3 sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Botón principal</p>
                  <p className="mt-1 text-xs text-[#806d63]">Se muestra en la parte frontal de la tarjeta. Solo puede haber uno.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <WizardField label="Texto del botón principal">
                      <Input value={values.appLinkText} onChange={(event) => update("appLinkText", event.target.value)} placeholder="Sitio web" className="rounded-xl bg-white" />
                    </WizardField>
                    <WizardField label="URL del botón principal">
                      <Input value={values.appointmentUrl} onChange={(event) => update("appointmentUrl", event.target.value)} placeholder="https://clinic.com" className="rounded-xl bg-white" />
                    </WizardField>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-3 sm:col-span-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Botones secundarios</p>
                  <p className="mt-1 text-xs text-[#806d63]">Se muestran en el reverso de la tarjeta.</p>
                  <div className="mt-3 grid gap-3">
                    {values.extraButtons.map((button, index) => (
                      <div key={index} className="grid gap-2 rounded-2xl border border-[#eadfd8] bg-white/70 p-3 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                        <WizardField label={`Texto del botón secundario ${index + 1}`}>
                          <Input value={button.label} maxLength={30} onChange={(event) => update("extraButtons", values.extraButtons.map((item, i) => (i === index ? { ...item, label: event.target.value } : item)))} placeholder="Reservar cita" className="rounded-xl bg-white" />
                        </WizardField>
                        <WizardField label={`URL del botón secundario ${index + 1}`}>
                          <Input value={button.url} onChange={(event) => update("extraButtons", values.extraButtons.map((item, i) => (i === index ? { ...item, url: event.target.value } : item)))} placeholder="https://clinic.com/book" className="rounded-xl bg-white" />
                        </WizardField>
                        <button
                          type="button"
                          onClick={() => update("extraButtons", values.extraButtons.filter((_, i) => i !== index))}
                          aria-label={`Quitar botón secundario ${index + 1}`}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e8b9b1] bg-white text-[#b94135] transition hover:bg-[#fff3f1]"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => update("extraButtons", [...values.extraButtons, { label: "", url: "" }])}
                    disabled={values.extraButtons.length >= EXTRA_BUTTONS_MAX}
                    className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#ded1c8] bg-white px-3 py-1.5 text-xs font-semibold text-[#6f4d3f] hover:bg-[#f7efe8] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" /> {values.extraButtons.length >= EXTRA_BUTTONS_MAX ? `Máximo ${EXTRA_BUTTONS_MAX} botones secundarios` : "Añadir botón secundario"}
                  </button>
                </div>
              </div>
            </form>

            <CardPreviewPanel
              centerName={cardName}
              color={values.colors[0]}
              logoUrl={chooseLogoUrl({ logoUrl: values.logo, logoOnDarkUrl: values.logoOnDark, color: values.colors[0] })}
              programName={values.programName}
              heroImageUrl={values.heroImageUrl}
              buttonText={values.appLinkText}
              extraButtons={values.extraButtons}
            />
          </div>
        ) : null}

        <p className={`flex items-center gap-2 text-sm ${templateEdited ? "text-[#704f40]" : "text-[#2f7d57]"}`}><CheckCircle2 className="h-4 w-4" /> {selectedTemplate ? `Diseño ${templateEdited ? "editado para esta clínica" : "se copiará tal cual"}` : "Ningún diseño seleccionado"}</p>
      </div>
    </StepContent>
  );
}

function CardPreviewPanel({ centerName, color, logoUrl, programName, heroImageUrl, buttonText, extraButtons }: { centerName: string; color: string; logoUrl: string; programName: string; heroImageUrl: string; buttonText: string; extraButtons: Array<{ label: string }> }) {
  const [wallet, setWallet] = React.useState<"apple" | "google">("apple");
  const options = [
    { id: "apple", label: "Apple Wallet" },
    { id: "google", label: "Google Wallet" },
  ] as const;

  return (
    <aside className="rounded-[22px] border border-[#ded2cb] bg-[#fffaf6] p-5 shadow-[0_12px_28px_rgba(67,48,43,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Vista previa en directo</p>
        <div role="tablist" aria-label="Vista previa de wallet" className="flex rounded-full bg-[#efe5dc] p-0.5 text-xs font-semibold">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={wallet === option.id}
              onClick={() => setWallet(option.id)}
              className={`rounded-full px-3 py-1.5 transition ${wallet === option.id ? "bg-[#201715] text-white shadow-sm" : "text-[#806d63] hover:text-[#201715]"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        {wallet === "apple" ? (
          <WalletCardPreview clinicName={centerName} programName={programName.trim() || "Club Diamante"} color={color} logoUrl={logoUrl} heroImageUrl={heroImageUrl} />
        ) : (
          <GoogleWalletCardPreview clinicName={centerName} programName={programName.trim() || "Club Diamante"} color={color} logoUrl={logoUrl} heroImageUrl={heroImageUrl} buttonText={buttonText} extraButtons={extraButtons} programme />
        )}
      </div>
    </aside>
  );
}

function StepContent({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return <div><h1 className="text-3xl font-semibold tracking-tight text-[#201715] sm:text-4xl">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#806d63]">{detail}</p><div className="mt-7">{children}</div></div>;
}

function WizardField({ label, children, className, action }: { label: string; children: React.ReactNode; className?: string; action?: React.ReactNode }) {
  // `action` sits outside the <label> so it does not become part of the input's accessible name.
  if (action) {
    return <div className={className}><label className="grid gap-2 text-sm font-semibold">{label}{children}</label>{action}</div>;
  }

  return <label className={`grid gap-2 text-sm font-semibold ${className ?? ""}`}>{label}{children}</label>;
}