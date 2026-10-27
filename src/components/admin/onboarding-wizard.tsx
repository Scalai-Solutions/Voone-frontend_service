"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Copy } from "lucide-react";

import { ENGLISH_UPLOAD_LABELS, ImageUploadButton } from "@/components/shared/image-upload-button";
import { WalletCardPreview } from "@/components/shared/wallet-card-preview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProvisionClinic } from "@/features/onboarding/api/useProvisionClinic";
import { CharCounter } from "@/components/shared/char-counter";
import { toPoints } from "@/lib/points";
import { WALLET_TEXT_MAX, clampChars, countChars } from "@/lib/wallet-text";
import { type ApiError, type TemplatePreset, type VooneTemplate } from "@/lib/api-client";
import {
  DEFAULT_WALLET_BACKGROUND_COLOR,
  DEFAULT_WALLET_POINTS_LABEL,
  DEFAULT_WALLET_PROGRAM_NAME,
  DEFAULT_WALLET_TEMPLATE_DESCRIPTION,
  DEFAULT_WALLET_TEMPLATE_NAME,
  DEFAULT_WALLET_TIER_LABEL,
} from "@/lib/default-wallet-template";

const steps = ["Owner", "Center", "Pass"];

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
    return "Add the owner name, mobile, and email to continue.";
  }
  if (step === 1 && (!values.centerName || !values.addressLine || !values.pincode)) {
    return "Add the center name, address, and postal code.";
  }
  if (step === 1 && !values.dataConsent) {
    return "Confirm the data processing consent to continue.";
  }
  if (step === 2 && !values.vooneTemplateId) {
    return "Choose a template design before creating the clinic.";
  }
  if (step === 2 && !values.programName.trim()) {
    return "Add the program or club name before creating the clinic.";
  }
  if (step === 2 && !values.logo.trim()) {
    return "Add the clinic's own logo URL (a single web address).";
  }
  if (step === 2) {
    const fields: Array<[string, string]> = [
      ["Clinic logo URL", values.logo],
      ["Logo for dark background", values.logoOnDark],
      ["Hero image URL", values.heroImageUrl],
      ["Button URL", values.appointmentUrl],
    ];
    const bad = fields.find(([, value]) => !isSingleUrl(value));

    if (bad) return `${bad[0]} must be a single web address, with no extra text or spaces.`;
  }
  if (step === 2 && (countChars(values.benefitsText) > WALLET_TEXT_MAX || countChars(values.infoText) > WALLET_TEXT_MAX)) {
    return `Member benefits and pass information are limited to ${WALLET_TEXT_MAX} characters each.`;
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
    description: index === 0 ? DEFAULT_WALLET_TEMPLATE_DESCRIPTION : "Preset starting design",
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

export function OnboardingWizard({ presets, templates }: { presets: TemplatePreset[]; templates: VooneTemplate[] }) {
  const router = useRouter();
  const templateOptions = templateOptionsFor(presets, templates);
  const [step, setStep] = React.useState(0);
  const [values, setValues] = React.useState<OnboardingValues>(() => ({
    ...initialValues,
    presetId: presets[0]?.id ?? "",
  }));
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
        values.benefitsText.trim().length > 0 ||
        values.infoText.trim().length > 0),
  );
  const provisionMutation = useProvisionClinic({
    onSuccess: (provisionedClinic) => {
      setStatus("Clinic saved as a draft. Continuing with treatments and program.");
      setSetupLinkCopied(false);
      // The centre now exists as an inactive draft; the rest of onboarding runs against it.
      const notice = provisionedClinic.walletWarning ? `?notice=${encodeURIComponent(provisionedClinic.walletWarning)}` : "";
      router.push(`/admin/clinics/${encodeURIComponent(provisionedClinic.clinic.id)}/setup${notice}`);
    },
    onError: (error) => {
      const detail = error instanceof Error && "detail" in error ? (error as ApiError).detail : undefined;
      setStatus(detail ?? "The clinic could not be created. Check the required details and try again.");
    },
  });

  function update<Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) {
    setValues((current) => ({ ...current, [key]: value }));
    setStatus(null);
  }

  function selectTemplate(template: OnboardingTemplateOption) {
    setValues((current) => ({
      ...current,
      vooneTemplateId: template.id,
      presetId: template.presetId ?? template.preset?.id ?? current.presetId,
      colors: [template.hexBackgroundColor, current.colors[1], current.colors[2]],
    }));
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
        <div className="flex items-center justify-between gap-4"><Link href="/admin/onboarding" className="inline-flex items-center gap-2 text-sm font-semibold text-[#704f40]"><ArrowLeft className="h-4 w-4" /> Back</Link><span className="text-sm text-[#806d63]">Step {step + 1} of {steps.length}</span></div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#eee6e0]"><span className="block h-full rounded-full bg-[#201715] transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

        <div className="my-auto pt-10">
          {step === 0 ? <OwnerStep values={values} update={update} /> : null}
          {step === 1 ? <CenterStep values={values} update={update} /> : null}
          {step === 2 ? <PassStepEditor templates={templateOptions} selectedTemplate={selectedTemplate} templateEdited={templateEdited} values={values} update={update} selectTemplate={selectTemplate} /> : null}
        </div>

        <div className="mt-8 border-t border-[#eadfd8] pt-5">
          {!status && blocked ? <p className="mb-4 text-sm text-[#806d63]">{blocked}</p> : null}
          {status ? <p className={`mb-4 text-sm ${status.startsWith("Clinic saved") ? "text-[#2f7d57]" : "text-destructive"}`}>{status}</p> : null}
          {setupUrl ? (
            <div className="mb-4 rounded-2xl border border-[#e4d8d1] bg-[#fffaf6] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">Client password setup link</p>
              <code className="mt-2 block break-all rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#2e2421]">{setupUrl}</code>
              <Button type="button" variant="outline" onClick={copySetupLink} className="mt-3 rounded-xl">
                <Copy className="mr-2 h-4 w-4" /> {setupLinkCopied ? "Copied" : "Copy setup link"}
              </Button>
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="rounded-xl">Previous</Button>
            {step < steps.length - 1 ? <Button type="button" onClick={next} disabled={blocked !== null} title={blocked ?? undefined} className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="button" onClick={finish} disabled={provisionMutation.isPending || blocked !== null} title={blocked ?? undefined} className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]">{provisionMutation.isPending ? "Saving..." : "Save and continue"}<ArrowRight className="ml-2 h-4 w-4" /></Button>}
          </div>
        </div>
      </div>

    </section>
  );
}

function OwnerStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return <StepContent title="Welcome. Who is leading this clinic?" detail="We’ll use these details for clinic ownership and implementation communication."><div className="grid gap-4 sm:grid-cols-2"><WizardField label="Owner name"><Input value={values.ownerName} onChange={(event) => update("ownerName", event.target.value)} placeholder="Ana Lopez" /></WizardField><WizardField label="Owner mobile"><Input value={values.ownerMobile} onChange={(event) => update("ownerMobile", event.target.value)} placeholder="+34 600 000 000" /></WizardField><WizardField label="Owner email" className="sm:col-span-2"><Input type="email" value={values.ownerEmail} onChange={(event) => update("ownerEmail", event.target.value)} placeholder="ana@clinic.com" /></WizardField><WizardField label="Primary contact name"><Input value={values.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Main setup contact" /></WizardField><WizardField label="Primary contact mobile"><Input value={values.mobile} onChange={(event) => update("mobile", event.target.value)} placeholder="+34 600 000 000" /></WizardField></div></StepContent>;
}

function CenterStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return (
    <StepContent title="Tell us about the center." detail="These details create the public membership page and form the clinic record.">
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardField label="Center name" className="sm:col-span-2">
          <Input value={values.centerName} onChange={(event) => update("centerName", event.target.value)} placeholder="Clínica Aurea" />
        </WizardField>
        <WizardField label="Center address" className="sm:col-span-2">
          <Input value={values.addressLine} onChange={(event) => update("addressLine", event.target.value)} placeholder="Calle Serrano 42" />
        </WizardField>
        <WizardField label="Postal code">
          <Input value={values.pincode} onChange={(event) => update("pincode", event.target.value)} placeholder="28001" />
        </WizardField>
        <WizardField label="Center mobile">
          <Input value={values.centerMobile} onChange={(event) => update("centerMobile", event.target.value)} placeholder="+34 910 000 000" />
        </WizardField>
        <WizardField label="Center email">
          <Input type="email" value={values.centerEmail} onChange={(event) => update("centerEmail", event.target.value)} placeholder="hola@clinic.com" />
        </WizardField>
        <label className="flex items-start gap-3 rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-4 text-sm sm:col-span-2">
          <input type="checkbox" checked={values.dataConsent} onChange={(event) => update("dataConsent", event.target.checked)} className="mt-1 h-4 w-4 accent-[#201715]" />
          <span>
            <span className="font-semibold">Data processing consent</span>
            <span className="mt-1 block text-[#806d63]">The center confirms it is authorised to process membership data.</span>
            <a href="/legal/tratamiento-datos" target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-semibold underline">Read the full consent document</a>
          </span>
        </label>
      </div>
    </StepContent>
  );
}

function PassStepEditor({ templates, selectedTemplate, templateEdited, values, update, selectTemplate }: { templates: OnboardingTemplateOption[]; selectedTemplate: OnboardingTemplateOption | undefined; templateEdited: boolean; values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void; selectTemplate: (template: OnboardingTemplateOption) => void }) {
  const cardName = values.centerName.trim() || "Center name";

  return (
    <StepContent title="Customize the wallet card." detail="Choose a design and fill only the fields shown on the member card.">
      <div className="space-y-5">
        <div className="grid gap-2 sm:grid-cols-3">
          {templates.map((template, index) => (
            <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 text-left text-sm transition ${values.vooneTemplateId === template.id ? "border-[#201715] ring-2 ring-[#d9b477]/50" : "border-[#ded2cb] hover:border-[#b98a4f]"}`}>
              <span className="h-6 w-6 rounded-full border border-[#ded2cb]" style={{ backgroundColor: template.hexBackgroundColor }} />
              <span className="font-semibold">Design {index + 1}</span>
            </button>
          ))}
        </div>

        {templates.length === 0 ? <p className="rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-4 text-sm text-[#806d63]">Create a Template Design before onboarding a clinic.</p> : null}

        {selectedTemplate ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <form className="rounded-[22px] border border-[#ded2cb] bg-white p-5 shadow-[0_12px_28px_rgba(67,48,43,0.08)]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Wallet card fields</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">{cardName}</h2>
                <p className="mt-1 text-xs text-[#806d63]">Template name is set from the center name; the club name appears on the wallet card.</p>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <WizardField label="Card color">
                  <Input type="color" value={values.colors[0]} onChange={(event) => update("colors", [event.target.value, values.colors[1], values.colors[2]])} className="h-10 rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Clinic logo URL" action={<ImageUploadButton kind="logo" scope="admin" labels={{ ...ENGLISH_UPLOAD_LABELS, ariaLabel: "Upload clinic logo image" }} onUploaded={(url) => update("logo", url)} />}>
                  <Input value={values.logo} onChange={(event) => update("logo", event.target.value)} placeholder="https://.../logo.png" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Logo for dark background (optional, Apple Wallet only)" className="sm:col-span-2" action={<ImageUploadButton kind="logoOnDark" scope="admin" labels={{ ...ENGLISH_UPLOAD_LABELS, ariaLabel: "Upload logo image for dark background" }} onUploaded={(url) => update("logoOnDark", url)} />}>
                  <Input value={values.logoOnDark} onChange={(event) => update("logoOnDark", event.target.value)} placeholder="https://.../logo-light.png" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Program / club name" className="sm:col-span-2">
                  <Input value={values.programName} onChange={(event) => update("programName", event.target.value)} placeholder="Club Diamante" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Hero image URL (optional)" className="sm:col-span-2" action={<ImageUploadButton kind="hero" scope="admin" labels={{ ...ENGLISH_UPLOAD_LABELS, ariaLabel: "Upload hero image" }} onUploaded={(url) => update("heroImageUrl", url)} />}>
                  <Input value={values.heroImageUrl} onChange={(event) => update("heroImageUrl", event.target.value)} placeholder="https://.../hero.jpg" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Wallet button text">
                  <Input value={values.appLinkText} onChange={(event) => update("appLinkText", event.target.value)} placeholder="Ver beneficios" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Button URL">
                  <Input value={values.appointmentUrl} onChange={(event) => update("appointmentUrl", event.target.value)} placeholder="https://clinic.com/benefits" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Member benefits" className="sm:col-span-2" action={<CharCounter text={values.benefitsText} />}>
                  <Textarea value={values.benefitsText} onChange={(event) => update("benefitsText", clampChars(event.target.value))} className="min-h-20 rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Pass information" className="sm:col-span-2" action={<CharCounter text={values.infoText} />}>
                  <Textarea value={values.infoText} onChange={(event) => update("infoText", clampChars(event.target.value))} className="min-h-20 rounded-xl bg-[#fffaf6]" />
                </WizardField>
              </div>
            </form>

            <CardPreviewPanel
              centerName={cardName}
              color={values.colors[0]}
              logoUrl={values.logo}
              programName={values.programName}
              heroImageUrl={values.heroImageUrl}
              benefitsText={values.benefitsText}
              infoText={values.infoText}
            />
          </div>
        ) : null}

        <p className={`flex items-center gap-2 text-sm ${templateEdited ? "text-[#704f40]" : "text-[#2f7d57]"}`}><CheckCircle2 className="h-4 w-4" /> {selectedTemplate ? `Design ${templateEdited ? "edited for this clinic" : "will be copied as-is"}` : "No design selected"}</p>
      </div>
    </StepContent>
  );
}

function CardPreviewPanel({ centerName, color, logoUrl, programName, heroImageUrl, benefitsText, infoText }: { centerName: string; color: string; logoUrl: string; programName: string; heroImageUrl: string; benefitsText: string; infoText: string }) {
  return (
    <aside className="rounded-[22px] border border-[#ded2cb] bg-[#fffaf6] p-5 shadow-[0_12px_28px_rgba(67,48,43,0.08)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Live preview</p>
      <div className="mt-4 flex justify-center">
        <WalletCardPreview clinicName={centerName} programName={programName.trim() || "Club Diamante"} color={color} logoUrl={logoUrl} heroImageUrl={heroImageUrl} />
      </div>
      <div className="mt-4 space-y-2 text-xs text-[#806d63]">
        <p><span className="font-semibold text-[#2e2421]">Benefits:</span> {benefitsText || "Member benefits appear in pass details."}</p>
        <p><span className="font-semibold text-[#2e2421]">Info:</span> {infoText || "Pass information appears in pass details."}</p>
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