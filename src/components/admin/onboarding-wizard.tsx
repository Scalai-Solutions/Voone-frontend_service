"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, CreditCard, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProvisionClinic } from "@/features/onboarding/api/useProvisionClinic";
import { type ApiError, type TemplatePreset, type VooneTemplate, type VooneTemplateButton, type VooneTemplateTextModule } from "@/lib/api-client";
import {
  DEFAULT_WALLET_BACKGROUND_COLOR,
  DEFAULT_WALLET_BENEFITS_TEXT,
  DEFAULT_WALLET_BUTTONS,
  DEFAULT_WALLET_HERO_IMAGE_URL,
  DEFAULT_WALLET_INFO_TEXT,
  DEFAULT_WALLET_LOGO_URL,
  DEFAULT_WALLET_POINTS_LABEL,
  DEFAULT_WALLET_PROGRAM_NAME,
  DEFAULT_WALLET_TEMPLATE_DESCRIPTION,
  DEFAULT_WALLET_TEMPLATE_NAME,
  DEFAULT_WALLET_TEXT_MODULES,
  DEFAULT_WALLET_TIER_LABEL,
} from "@/lib/default-wallet-template";

const steps = ["Owner", "Center", "Pass"];
/**
 * A working ladder, not five names. A clinic that changes nothing still gets a
 * programme that ranks members — before this, tiers had no points and nothing could
 * decide which one anybody was in.
 *
 * The spacing widens as the tiers climb, which is the shape loyalty programmes usually
 * take: Silver should feel reachable and Diamond should not.
 */
const defaultTiers: TierRewardDraft[] = [
  { name: "Bronze", rewardText: "", minLifetimePoints: "0", milestoneCount: "5", pointsToNextMilestone: "200" },
  { name: "Silver", rewardText: "", minLifetimePoints: "1000", milestoneCount: "5", pointsToNextMilestone: "400" },
  { name: "Gold", rewardText: "", minLifetimePoints: "3000", milestoneCount: "5", pointsToNextMilestone: "800" },
  { name: "Platinum", rewardText: "", minLifetimePoints: "7000", milestoneCount: "5", pointsToNextMilestone: "1600" },
  { name: "Diamond", rewardText: "", minLifetimePoints: "15000", milestoneCount: "5", pointsToNextMilestone: "3000" },
];
type TreatmentDraft = {
  name: string;
  priceEuro: string;
};

type TierRewardDraft = {
  name: string;
  rewardText: string;
  /** Strings because they are bound to inputs; coerced on submit. */
  minLifetimePoints: string;
  milestoneCount: string;
  pointsToNextMilestone: string;
};

type MilestoneRewardDraft = {
  milestoneCount: string;
  pointsToNextMilestone: string;
  priceAmount: string;
  pointsAwarded: string;
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
  colors: [string, string, string];
  dataConsent: boolean;
  programName: string;
  treatments: TreatmentDraft[];
  tierRewards: TierRewardDraft[];
  milestoneRewards: MilestoneRewardDraft;
  vooneTemplateId: string;
  presetId: string;
  heroImageUrl: string;
  websiteUrl: string;
  appointmentUrl: string;
  appLinkText: string;
  appLinkDescription: string;
  buttons: VooneTemplateButton[];
  textModules: VooneTemplateTextModule[];
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
  logo: DEFAULT_WALLET_LOGO_URL,
  colors: [DEFAULT_WALLET_BACKGROUND_COLOR, "#201715", "#b98a4f"],
  dataConsent: false,
  programName: DEFAULT_WALLET_PROGRAM_NAME,
  treatments: [{ name: "", priceEuro: "" }],
  tierRewards: defaultTiers.map((tier) => ({ ...tier })),
  milestoneRewards: {
    milestoneCount: "10",
    pointsToNextMilestone: "2000",
    priceAmount: "10",
    pointsAwarded: "100",
  },
  vooneTemplateId: "",
  presetId: "",
  heroImageUrl: DEFAULT_WALLET_HERO_IMAGE_URL,
  websiteUrl: "",
  appointmentUrl: "",
  appLinkText: "Schedule Appointment",
  appLinkDescription: "Schedule an appointment",
  buttons: DEFAULT_WALLET_BUTTONS.map((button) => ({ ...button })),
  textModules: DEFAULT_WALLET_TEXT_MODULES.map((module) => ({ ...module })),
  pointsLabel: DEFAULT_WALLET_POINTS_LABEL,
  tierLabel: DEFAULT_WALLET_TIER_LABEL,
  benefitsText: DEFAULT_WALLET_BENEFITS_TEXT,
  infoText: DEFAULT_WALLET_INFO_TEXT,
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
    logoUrl: DEFAULT_WALLET_LOGO_URL,
    heroImageUrl: DEFAULT_WALLET_HERO_IMAGE_URL,
    pointsLabel: initialValues.pointsLabel,
    tierLabel: initialValues.tierLabel,
    benefitsText: initialValues.benefitsText,
    infoText: initialValues.infoText,
    buttons: DEFAULT_WALLET_BUTTONS.map((button) => ({ ...button })),
  }));
};

const firstTemplateValues = (presets: TemplatePreset[], templates: OnboardingTemplateOption[]): OnboardingValues => {
  const template = templates[0];

  if (!template) {
    return { ...initialValues, presetId: presets[0]?.id ?? "" };
  }

  const primaryButton = template.buttons.find((button) => button.primary);
  const websiteButton = template.buttons.find((button) => !button.primary);

  return {
    ...initialValues,
    vooneTemplateId: template.id,
    presetId: template.presetId ?? template.preset?.id ?? presets[0]?.id ?? "",
    programName: template.programName,
    logo: template.logoUrl ?? DEFAULT_WALLET_LOGO_URL,
    heroImageUrl: template.heroImageUrl ?? DEFAULT_WALLET_HERO_IMAGE_URL,
    websiteUrl: websiteButton?.url ?? "",
    appointmentUrl: primaryButton?.url ?? "",
    appLinkText: primaryButton?.label ?? "Schedule Appointment",
    appLinkDescription: primaryButton?.description ?? "Schedule an appointment",
    buttons: template.buttons.length ? template.buttons : DEFAULT_WALLET_BUTTONS.map((button) => ({ ...button })),
    textModules: [
      { label: "Benefits", value: template.benefitsText ?? initialValues.benefitsText },
      { label: "Information", value: template.infoText ?? initialValues.infoText },
    ],
    colors: [template.hexBackgroundColor, initialValues.colors[1], initialValues.colors[2]],
    pointsLabel: template.pointsLabel,
    tierLabel: template.tierLabel,
    benefitsText: template.benefitsText ?? initialValues.benefitsText,
    infoText: template.infoText ?? initialValues.infoText,
  };
};

const intOrDefault = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/** Zero is a legitimate floor for the lowest tier, so this cannot reuse intOrDefault. */
const intOrZero = (value: string) => {
  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

const milestonePayload = (values: OnboardingValues) => ({
  milestoneCount: intOrDefault(values.milestoneRewards.milestoneCount, 10),
  pointsToNextMilestone: intOrDefault(values.milestoneRewards.pointsToNextMilestone, 2000),
  priceAmount: intOrDefault(values.milestoneRewards.priceAmount, 10),
  pointsAwarded: intOrDefault(values.milestoneRewards.pointsAwarded, 100),
});

const treatmentsPayload = (values: OnboardingValues) => {
  const milestone = milestonePayload(values);
  const pointsForPrice = (priceEuro: number) => Math.round((priceEuro / milestone.priceAmount) * milestone.pointsAwarded);
  const treatments = values.treatments
    .map((treatment) => ({
      name: treatment.name.trim(),
      priceEuro: intOrDefault(treatment.priceEuro, 120),
    }))
    .filter((treatment) => treatment.name.length > 0)
    .map((treatment) => ({
      ...treatment,
      pointsAllotted: pointsForPrice(treatment.priceEuro),
    }));

  return treatments.length > 0
    ? treatments
    : [{ name: "Spa", priceEuro: 120, pointsAllotted: pointsForPrice(120) }];
};

const tierRewardsPayload = (values: OnboardingValues) =>
  values.tierRewards
    .map((tier) => ({
      name: tier.name.trim(),
      rewardText: tier.rewardText.trim(),
      // A tier without points cannot rank anybody, so an empty box means zero rather
      // than "unset" — and the backend rejects two tiers sharing a floor, which is how
      // a clinic finds out it left two blank.
      minLifetimePoints: intOrZero(tier.minLifetimePoints),
      milestoneCount: intOrDefault(tier.milestoneCount, 5),
      pointsToNextMilestone: intOrDefault(tier.pointsToNextMilestone, 200),
    }))
    .filter((tier) => tier.name.length > 0)
    // Sorted so the clinic can type them in any order and still get a sane ladder.
    .sort((a, b) => a.minLifetimePoints - b.minLifetimePoints);

export function OnboardingWizard({ presets, templates }: { presets: TemplatePreset[]; templates: VooneTemplate[] }) {
  const router = useRouter();
  const templateOptions = templateOptionsFor(presets, templates);
  const [step, setStep] = React.useState(0);
  const [values, setValues] = React.useState<OnboardingValues>(() => firstTemplateValues(presets, templateOptions));
  const [status, setStatus] = React.useState<string | null>(null);
  const [setupLinkCopied, setSetupLinkCopied] = React.useState(false);
  const selectedTemplate = templateOptions.find((template) => template.id === values.vooneTemplateId);
  const selectedPreset = presets.find((preset) => preset.id === values.presetId) ?? presets[0];
  const templateEdited = Boolean(
    selectedTemplate &&
      (values.programName !== selectedTemplate.programName ||
        values.colors[0] !== selectedTemplate.hexBackgroundColor ||
        values.logo !== (selectedTemplate.logoUrl ?? "") ||
        values.heroImageUrl !== (selectedTemplate.heroImageUrl ?? "") ||
        values.pointsLabel !== selectedTemplate.pointsLabel ||
        values.tierLabel !== selectedTemplate.tierLabel ||
        values.benefitsText !== (selectedTemplate.benefitsText ?? initialValues.benefitsText) ||
        values.infoText !== (selectedTemplate.infoText ?? initialValues.infoText)),
  );
  const provisionMutation = useProvisionClinic({
    onSuccess: (provisionedClinic) => {
      setStatus("Clinic created. Continue with the generated Wallet pass and QR setup.");
      setSetupLinkCopied(false);
      router.push(`/admin/clinics/${encodeURIComponent(provisionedClinic.clinic.id)}`);
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
    const primaryButton = template.buttons.find((button) => button.primary);
    const websiteButton = template.buttons.find((button) => !button.primary);

    setValues((current) => ({
      ...current,
      vooneTemplateId: template.id,
      presetId: template.presetId ?? template.preset?.id ?? current.presetId,
      programName: template.programName,
      logo: template.logoUrl ?? DEFAULT_WALLET_LOGO_URL,
      heroImageUrl: template.heroImageUrl ?? DEFAULT_WALLET_HERO_IMAGE_URL,
      websiteUrl: websiteButton?.url ?? "",
      appointmentUrl: primaryButton?.url ?? "",
      appLinkText: primaryButton?.label ?? "Schedule Appointment",
      appLinkDescription: primaryButton?.description ?? "Schedule an appointment",
      buttons: template.buttons.length ? template.buttons : DEFAULT_WALLET_BUTTONS.map((button) => ({ ...button })),
      textModules: [
        { label: "Benefits", value: template.benefitsText ?? initialValues.benefitsText },
        { label: "Information", value: template.infoText ?? initialValues.infoText },
      ],
      colors: [template.hexBackgroundColor, current.colors[1], current.colors[2]],
      pointsLabel: template.pointsLabel,
      tierLabel: template.tierLabel,
      benefitsText: template.benefitsText ?? initialValues.benefitsText,
      infoText: template.infoText ?? initialValues.infoText,
    }));
    setStatus(null);
  }

  function next() {
    if (step === 0 && (!values.ownerName || !values.ownerMobile || !values.ownerEmail)) {
      setStatus("Add the owner name, mobile, and email to continue.");
      return;
    }
    if (step === 1 && (!values.centerName || !values.addressLine || !values.pincode)) {
      setStatus("Add the center name, address, and postal code.");
      return;
    }
    if (step === 1 && !values.dataConsent) {
      setStatus("Confirm the data processing consent before continuing.");
      return;
    }
    if (step === 2 && !values.vooneTemplateId) {
      setStatus("Choose a template design before creating the clinic.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function finish() {
    if (!values.vooneTemplateId) {
      setStatus("Choose a template design before creating the clinic.");
      return;
    }
    if (templateEdited && !window.confirm("Save this edited template for the clinic and create its Google Wallet class?")) {
      return;
    }
    setStatus(null);
    const primaryButton = values.buttons.find((button) => button.primary) ?? values.buttons[0];
    const benefitsModule = values.textModules.find((module) => module.label.toLowerCase().includes("benefit"));
    const infoModule = values.textModules.find((module) => module.label.toLowerCase().includes("info"));

    provisionMutation.mutate({
      name: values.centerName,
      addressLine: values.addressLine,
      pincode: values.pincode,
      ownerName: values.ownerName,
      ownerEmail: values.ownerEmail,
      presetId: values.presetId,
      programName: values.programName,
      hexBackgroundColor: values.colors[0],
      logoUrl: values.logo,
      heroImageUrl: values.heroImageUrl,
      websiteUrl: values.websiteUrl,
      appointmentUrl: primaryButton?.url ?? values.appointmentUrl,
      appLinkText: primaryButton?.label ?? values.appLinkText,
      appLinkDescription: primaryButton?.description ?? values.appLinkDescription,
      pointsLabel: values.pointsLabel,
      tierLabel: values.tierLabel,
      benefitsText: benefitsModule?.value || values.benefitsText,
      infoText: infoModule?.value || values.infoText,
      treatments: treatmentsPayload(values),
      tierRewards: tierRewardsPayload(values),
      milestoneRewards: milestonePayload(values),
    });
  }

  async function copySetupLink() {
    const setupUrl = provisionMutation.data?.onboardingCredentials?.setupUrl;

    if (!setupUrl) return;

    await navigator.clipboard.writeText(setupUrl);
    setSetupLinkCopied(true);
  }

  const setupUrl = provisionMutation.data?.onboardingCredentials?.setupUrl;

  return (
    <section className="mx-auto min-h-[650px] max-w-[900px] overflow-hidden rounded-[24px] border border-[#ded2cb] bg-white shadow-[0_20px_56px_rgba(67,48,43,0.12)]">
      <div className="flex min-w-0 flex-col p-7 sm:p-10">
        <div className="flex items-center justify-between gap-4"><Link href="/admin/onboarding" className="inline-flex items-center gap-2 text-sm font-semibold text-[#704f40]"><ArrowLeft className="h-4 w-4" /> Back</Link><span className="text-sm text-[#806d63]">Step {step + 1} of {steps.length}</span></div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#eee6e0]"><span className="block h-full rounded-full bg-[#201715] transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

        <div className="my-auto pt-10">
          {step === 0 ? <OwnerStep values={values} update={update} /> : null}
          {step === 1 ? <CenterStep values={values} update={update} /> : null}
          {step === 2 ? <PassStepEditor presets={presets} templates={templateOptions} selectedPreset={selectedPreset} selectedTemplate={selectedTemplate} templateEdited={templateEdited} values={values} update={update} selectTemplate={selectTemplate} /> : null}
        </div>

        <div className="mt-8 border-t border-[#eadfd8] pt-5">
          {status ? <p className={`mb-4 text-sm ${status.startsWith("Clinic created") ? "text-[#2f7d57]" : "text-destructive"}`}>{status}</p> : null}
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
            {step < steps.length - 1 ? <Button type="button" onClick={next} className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="button" onClick={finish} disabled={provisionMutation.isPending} className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]">{provisionMutation.isPending ? "Creating..." : "Create clinic"}<Check className="ml-2 h-4 w-4" /></Button>}
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
          </span>
        </label>
      </div>
    </StepContent>
  );
}

function PassStepEditor({ presets, templates, selectedPreset, selectedTemplate, templateEdited, values, update, selectTemplate }: { presets: TemplatePreset[]; templates: OnboardingTemplateOption[]; selectedPreset: TemplatePreset | undefined; selectedTemplate: OnboardingTemplateOption | undefined; templateEdited: boolean; values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void; selectTemplate: (template: OnboardingTemplateOption) => void }) {
  return (
    <StepContent title="Choose and edit the clinic template." detail="Select a saved Voone design, then edit the same fields used in Template Designs before creating this clinic’s Wallet class.">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {templates.map((template) => (
            <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`overflow-hidden rounded-[20px] border bg-white p-3 text-left shadow-[0_12px_28px_rgba(67,48,43,0.08)] transition ${values.vooneTemplateId === template.id ? "border-[#201715] ring-2 ring-[#d9b477]/50" : "border-[#ded2cb] hover:border-[#b98a4f]"}`}>
              <span className="block h-28 rounded-lg p-3" style={{ backgroundColor: template.hexBackgroundColor, color: ["#30221f", "#2a2e35", "#2f343a"].includes(template.hexBackgroundColor.toLowerCase()) ? "#fff8f2" : "#2e2421" }}>
                <span className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-70">VOONE PASS</span>
                <span className="mt-6 block font-serif text-lg">{template.programName}</span>
              </span>
              <span className="mt-3 block text-sm font-semibold">{template.name}</span>
              <span className="mt-1 line-clamp-2 block text-xs text-[#806d63]">{template.description ?? "Ready to copy into a clinic pass."}</span>
            </button>
          ))}
        </div>

        {templates.length === 0 ? <p className="rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-4 text-sm text-[#806d63]">Create a Template Design before onboarding a clinic.</p> : null}

        {selectedTemplate ? (
          <form className="rounded-[22px] border border-[#ded2cb] bg-white p-5 shadow-[0_12px_28px_rgba(67,48,43,0.08)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Template editor</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">{selectedTemplate.name}</h1>
              </div>
              <CreditCard className="h-5 w-5 text-[#a47845]" />
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <WizardField label="Template name"><Input value={selectedTemplate.name} readOnly className="rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Template description"><Input value={selectedTemplate.description ?? "Reusable Voone Wallet design."} readOnly className="rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Preset"><select value={values.presetId} onChange={(event) => update("presetId", event.target.value)} className="h-10 rounded-xl border border-input bg-[#fffaf6] px-3 text-sm">{presets.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}</select></WizardField>
              <WizardField label="Program name"><Input value={values.programName} onChange={(event) => update("programName", event.target.value)} className="rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Points label"><Input value={values.pointsLabel} onChange={(event) => update("pointsLabel", event.target.value)} className="rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Tier label"><Input value={values.tierLabel} onChange={(event) => update("tierLabel", event.target.value)} className="rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Logo URL"><Input value={values.logo} onChange={(event) => update("logo", event.target.value)} placeholder="https://.../logo.png" className="rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Hero image URL"><Input value={values.heroImageUrl} onChange={(event) => update("heroImageUrl", event.target.value)} placeholder="https://.../hero.png" className="rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Website URL"><Input value={values.websiteUrl} onChange={(event) => update("websiteUrl", event.target.value)} placeholder="https://clinic.com" className="rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Schedule appointment URL"><Input value={values.appointmentUrl} onChange={(event) => update("appointmentUrl", event.target.value)} placeholder="https://clinic.com/book" className="rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Wallet button text"><Input value={values.appLinkText} onChange={(event) => update("appLinkText", event.target.value)} className="rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Wallet button description"><Input value={values.appLinkDescription} onChange={(event) => update("appLinkDescription", event.target.value)} className="rounded-xl bg-[#fffaf6]" /></WizardField>
            </div>
            <div className="mt-5">
              <p className="text-sm font-semibold">Brand colors</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {values.colors.map((color, index) => <label key={index} className="flex items-center gap-3 rounded-xl border border-[#ded2cb] bg-[#fffaf6] px-3 py-2 text-sm"><input aria-label={`Brand color ${index + 1}`} type="color" value={color} onChange={(event) => update("colors", values.colors.map((item, itemIndex) => itemIndex === index ? event.target.value : item) as OnboardingValues["colors"])} className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0" /><span>{color}</span></label>)}
              </div>
            </div>
            <section className="mt-6 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Wallet buttons</p>
                  <p className="mt-1 text-xs text-[#927e72]">Add zero, one, or multiple links. Mark one as the primary CTA.</p>
                </div>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => update("buttons", [...values.buttons, { label: "New button", url: "https://", description: "", primary: false }])}>
                  <Plus className="mr-2 h-4 w-4" /> Add button
                </Button>
              </div>
              <div className="mt-4 grid gap-3">
                {values.buttons.map((button, index) => <div key={`${index}-${button.label}`} className="grid gap-3 rounded-xl border border-[#ded2cb] bg-white p-3 sm:grid-cols-[1fr_1.5fr_1fr_auto]"><Input value={button.label} maxLength={30} placeholder="Button label" onChange={(event) => update("buttons", values.buttons.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><Input value={button.url} placeholder="https://..." onChange={(event) => update("buttons", values.buttons.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item))} /><Input value={button.description ?? ""} placeholder="Description" onChange={(event) => update("buttons", values.buttons.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} /><div className="flex items-center gap-2"><label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={button.primary} onChange={(event) => update("buttons", values.buttons.map((item, itemIndex) => ({ ...item, primary: itemIndex === index ? event.target.checked : false })))} /> Primary</label><Button type="button" variant="ghost" onClick={() => update("buttons", values.buttons.filter((_, itemIndex) => itemIndex !== index))}>×</Button></div></div>)}
              </div>
            </section>
            <section className="mt-6 rounded-2xl border border-[#eadfd8] bg-[#fffaf6] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Wallet text modules</p>
                  <p className="mt-1 text-xs text-[#927e72]">Labels and copy shown in the card details section.</p>
                </div>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => update("textModules", [...values.textModules, { label: "New label", value: "" }])}>
                  <Plus className="mr-2 h-4 w-4" /> Add text
                </Button>
              </div>
              <div className="mt-4 grid gap-3">
                {values.textModules.map((module, index) => <div key={`${index}-${module.label}`} className="grid gap-3 rounded-xl border border-[#ded2cb] bg-white p-3 sm:grid-cols-[180px_1fr_auto]"><Input value={module.label} placeholder="Label" onChange={(event) => update("textModules", values.textModules.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} /><Textarea value={module.value} placeholder="Text shown on the pass" onChange={(event) => update("textModules", values.textModules.map((item, itemIndex) => itemIndex === index ? { ...item, value: event.target.value } : item))} /><Button type="button" variant="ghost" onClick={() => update("textModules", values.textModules.filter((_, itemIndex) => itemIndex !== index))}>×</Button></div>)}
              </div>
            </section>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <WizardField label="Member benefits"><Textarea value={values.benefitsText} onChange={(event) => update("benefitsText", event.target.value)} className="min-h-24 rounded-xl bg-[#fffaf6]" /></WizardField>
              <WizardField label="Pass information"><Textarea value={values.infoText} onChange={(event) => update("infoText", event.target.value)} className="min-h-24 rounded-xl bg-[#fffaf6]" /></WizardField>
            </div>
          </form>
        ) : null}

        <p className={`flex items-center gap-2 text-sm ${templateEdited ? "text-[#704f40]" : "text-[#2f7d57]"}`}><CheckCircle2 className="h-4 w-4" /> {selectedTemplate ? `${selectedTemplate.name} ${templateEdited ? "edited for this clinic" : "will be copied as-is"}` : "No template selected"}{selectedPreset ? ` with ${selectedPreset.name}` : ""}</p>
      </div>
    </StepContent>
  );
}

function PassStep({ templates, selectedPreset, selectedTemplate, templateEdited, values, update, selectTemplate }: { templates: OnboardingTemplateOption[]; selectedPreset: TemplatePreset | undefined; selectedTemplate: OnboardingTemplateOption | undefined; templateEdited: boolean; values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void; selectTemplate: (template: OnboardingTemplateOption) => void }) {
  return <StepContent title="Choose the first card design." detail="Select a saved Voone template, then keep it as-is or edit the copy that will become this clinic’s Wallet class."><div className="grid gap-5"><div className="grid gap-3 sm:grid-cols-3">{templates.map((template) => <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`overflow-hidden rounded-xl border p-3 text-left transition ${values.vooneTemplateId === template.id ? "border-[#201715] ring-2 ring-[#d9b477]/50" : "border-[#ded2cb] hover:border-[#b98a4f]"}`}><span className="block h-28 rounded-lg p-3" style={{ backgroundColor: template.hexBackgroundColor, color: ["#30221f", "#2a2e35", "#2f343a"].includes(template.hexBackgroundColor.toLowerCase()) ? "#fff8f2" : "#2e2421" }}><span className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-70">VOONE PASS</span><span className="mt-6 block font-serif text-lg">{template.programName}</span></span><span className="mt-3 block text-sm font-semibold">{template.name}</span><span className="mt-1 line-clamp-2 block text-xs text-[#806d63]">{template.description ?? "Ready to copy into a clinic pass."}</span></button>)}</div>{templates.length === 0 ? <p className="rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-4 text-sm text-[#806d63]">Create a Template Design before onboarding a clinic.</p> : null}{selectedTemplate ? <div className="grid gap-4 rounded-2xl border border-[#ded2cb] bg-[#fffaf6] p-4 sm:grid-cols-2"><WizardField label="Program name"><Input value={values.programName} onChange={(event) => update("programName", event.target.value)} /></WizardField><WizardField label="Background color"><Input type="color" value={values.colors[0]} onChange={(event) => update("colors", [event.target.value, values.colors[1], values.colors[2]])} /></WizardField><WizardField label="Logo URL"><Input value={values.logo} onChange={(event) => update("logo", event.target.value)} placeholder="https://.../logo.png" /></WizardField><WizardField label="Hero image URL"><Input value={values.heroImageUrl} onChange={(event) => update("heroImageUrl", event.target.value)} placeholder="https://.../hero.png" /></WizardField><WizardField label="Website URL"><Input value={values.websiteUrl} onChange={(event) => update("websiteUrl", event.target.value)} placeholder="https://clinic.com" /></WizardField><WizardField label="Appointment URL"><Input value={values.appointmentUrl} onChange={(event) => update("appointmentUrl", event.target.value)} placeholder="https://clinic.com/book" /></WizardField><WizardField label="Wallet button text"><Input value={values.appLinkText} onChange={(event) => update("appLinkText", event.target.value)} /></WizardField><WizardField label="Wallet button description"><Input value={values.appLinkDescription} onChange={(event) => update("appLinkDescription", event.target.value)} /></WizardField><WizardField label="Points label"><Input value={values.pointsLabel} onChange={(event) => update("pointsLabel", event.target.value)} /></WizardField><WizardField label="Tier label"><Input value={values.tierLabel} onChange={(event) => update("tierLabel", event.target.value)} /></WizardField><WizardField label="Benefits" className="sm:col-span-2"><Textarea value={values.benefitsText} onChange={(event) => update("benefitsText", event.target.value)} /></WizardField><WizardField label="Pass information" className="sm:col-span-2"><Textarea value={values.infoText} onChange={(event) => update("infoText", event.target.value)} /></WizardField></div> : null}<p className={`flex items-center gap-2 text-sm ${templateEdited ? "text-[#704f40]" : "text-[#2f7d57]"}`}><CheckCircle2 className="h-4 w-4" /> {selectedTemplate ? `${selectedTemplate.name} ${templateEdited ? "edited for this clinic" : "will be copied as-is"}` : "No template selected"}{selectedPreset ? ` with ${selectedPreset.name}` : ""}</p></div></StepContent>;
}

function StepContent({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return <div><h1 className="text-3xl font-semibold tracking-tight text-[#201715] sm:text-4xl">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#806d63]">{detail}</p><div className="mt-7">{children}</div></div>;
}

function WizardField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`grid gap-2 text-sm font-semibold ${className ?? ""}`}>{label}{children}</label>;
}