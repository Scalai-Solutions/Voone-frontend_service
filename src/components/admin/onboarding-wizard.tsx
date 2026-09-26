"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy, CreditCard, Plus, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProvisionClinic } from "@/features/onboarding/api/useProvisionClinic";
import { type ApiError, type TemplatePreset, type VooneTemplate, type VooneTemplateButton, type VooneTemplateTextModule } from "@/lib/api-client";

const steps = ["Owner", "Center", "Program", "Pass"];
const defaultTierNames = ["Bronze", "Silver", "Gold", "Platinum", "Diamond"];
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const normalizeSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");

type TreatmentDraft = {
  name: string;
  priceEuro: string;
};

type TierRewardDraft = {
  name: string;
  rewardText: string;
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
  slug: string;
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
  slug: "",
  logo: "",
  colors: ["#ead0bd", "#201715", "#b98a4f"],
  dataConsent: false,
  programName: "",
  treatments: [{ name: "", priceEuro: "" }],
  tierRewards: defaultTierNames.map((name) => ({ name, rewardText: "" })),
  milestoneRewards: {
    milestoneCount: "10",
    pointsToNextMilestone: "2000",
    priceAmount: "10",
    pointsAwarded: "100",
  },
  vooneTemplateId: "",
  presetId: "",
  heroImageUrl: "",
  websiteUrl: "",
  appointmentUrl: "",
  appLinkText: "Schedule Appointment",
  appLinkDescription: "Schedule an appointment",
  buttons: [
    { label: "Website", url: "https://voone.ai", description: "Website", primary: false },
    { label: "Schedule Appointment", url: "https://voone.app", description: "Schedule an appointment", primary: true },
  ],
  textModules: [
    { label: "Clinic", value: "Clinic details" },
    { label: "Benefits", value: "Priority booking, surprise rewards and a birthday credit for loyal members." },
    { label: "Information", value: "Show this pass at reception before payment." },
  ],
  pointsLabel: "Points balance",
  tierLabel: "Member tier",
  benefitsText: "Priority booking, surprise rewards and a birthday credit for loyal members.",
  infoText: "Show this pass at reception before payment.",
};

type OnboardingTemplateOption = Pick<VooneTemplate, "id" | "presetId" | "preset" | "name" | "description" | "programName" | "hexBackgroundColor" | "logoUrl" | "heroImageUrl" | "pointsLabel" | "tierLabel" | "benefitsText" | "infoText" | "buttons">;

const templateOptionsFor = (presets: TemplatePreset[], templates: VooneTemplate[]): OnboardingTemplateOption[] => {
  if (templates.length > 0) {
    return templates;
  }

  return presets.map((preset) => ({
    id: preset.id,
    presetId: preset.id,
    preset,
    name: preset.name,
    description: "Preset starting design",
    programName: `${preset.name} Club`,
    hexBackgroundColor: preset.hexBackgroundColor,
    logoUrl: "",
    heroImageUrl: preset.previewImageUrl ?? "",
    pointsLabel: initialValues.pointsLabel,
    tierLabel: initialValues.tierLabel,
    benefitsText: initialValues.benefitsText,
    infoText: initialValues.infoText,
    buttons: [
      {
        label: "Schedule Appointment",
        url: "https://voone.app",
        description: "Schedule an appointment",
        primary: true,
      },
    ],
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
    logo: template.logoUrl ?? "",
    heroImageUrl: template.heroImageUrl ?? "",
    websiteUrl: websiteButton?.url ?? "",
    appointmentUrl: primaryButton?.url ?? "",
    appLinkText: primaryButton?.label ?? "Schedule Appointment",
    appLinkDescription: primaryButton?.description ?? "Schedule an appointment",
    buttons: template.buttons,
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
    .map((tier) => ({ name: tier.name.trim(), rewardText: tier.rewardText.trim() }))
    .filter((tier) => tier.name.length > 0);

export function OnboardingWizard({ presets, templates }: { presets: TemplatePreset[]; templates: VooneTemplate[] }) {
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
    onSuccess: () => {
      setStatus("Clinic created. Continue with the generated Wallet pass and QR setup.");
      setSetupLinkCopied(false);
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
      logo: template.logoUrl ?? "",
      heroImageUrl: template.heroImageUrl ?? "",
      websiteUrl: websiteButton?.url ?? "",
      appointmentUrl: primaryButton?.url ?? "",
      appLinkText: primaryButton?.label ?? "Schedule Appointment",
      appLinkDescription: primaryButton?.description ?? "Schedule an appointment",
      buttons: template.buttons,
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
    if (step === 1 && (!values.centerName || !values.addressLine || !values.pincode || !values.slug)) {
      setStatus("Add the center name, address, postal code, and permanent URL slug.");
      return;
    }
    if (step === 1 && !values.dataConsent) {
      setStatus("Confirm the data processing consent before continuing.");
      return;
    }
    if (step === 2 && !values.programName) {
      setStatus("Add the loyalty program name to continue.");
      return;
    }
    if (step === 3 && !values.vooneTemplateId) {
      setStatus("Choose a template design before creating the clinic.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function finish() {
    const slug = normalizeSlug(values.slug);

    if (!slugPattern.test(slug)) {
      setStatus("Use lowercase letters, numbers, and hyphens for the permanent URL slug.");
      return;
    }
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
      slug,
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
    <section className="mx-auto min-h-[650px] max-w-[1180px] overflow-hidden rounded-[24px] border border-[#ded2cb] bg-white shadow-[0_20px_56px_rgba(67,48,43,0.12)] lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <div className="flex min-w-0 flex-col p-7 sm:p-10">
        <div className="flex items-center justify-between gap-4"><Link href="/admin/onboarding" className="inline-flex items-center gap-2 text-sm font-semibold text-[#704f40]"><ArrowLeft className="h-4 w-4" /> Back</Link><span className="text-sm text-[#806d63]">Step {step + 1} of {steps.length}</span></div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#eee6e0]"><span className="block h-full rounded-full bg-[#201715] transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

        <div className="my-auto pt-10">
          {step === 0 ? <OwnerStep values={values} update={update} /> : null}
          {step === 1 ? <CenterStep values={values} update={update} /> : null}
          {step === 2 ? <ProgramStep values={values} update={update} /> : null}
          {step === 3 ? <PassStepEditor presets={presets} templates={templateOptions} selectedPreset={selectedPreset} selectedTemplate={selectedTemplate} templateEdited={templateEdited} values={values} update={update} selectTemplate={selectTemplate} /> : null}
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

      <aside className="relative hidden overflow-hidden bg-[#f5f2f0] p-12 lg:block">
        <p className="text-sm font-semibold text-[#201715]">{steps[step]} setup</p>
        <h2 className="mt-3 max-w-md text-3xl font-semibold tracking-tight text-[#201715]">{sideCopy[step].title}</h2>
        <p className="mt-3 max-w-md text-sm leading-6 text-[#806d63]">{sideCopy[step].detail}</p>
        <div className="mt-7 flex items-center gap-2">{steps.map((item, index) => <span key={item} className={`h-2.5 rounded-full transition-all ${index === step ? "w-8 bg-[#201715]" : "w-2.5 bg-[#d9cec7]"}`} />)}</div>
        <div className="absolute bottom-16 left-12 right-12 rounded-[20px] border border-white bg-white p-6 shadow-[0_18px_44px_rgba(67,48,43,0.08)]">
          <div className="flex items-center justify-between"><div className="flex gap-1">{["#d9b252", "#75b69d", "#6987cf"].map((color) => <span key={color} className="h-7 w-7 rounded-full border-2 border-white" style={{ backgroundColor: color }} />)}</div><span className="grid h-8 w-8 place-items-center rounded-full bg-[#f5ede8] text-[#704f40]"><Sparkles className="h-4 w-4" /></span></div>
          <div className="mt-8 rounded-2xl p-5" style={{ backgroundColor: values.colors[0], color: values.colors[1] }}><p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-65">VOONE PASS</p><p className="mt-3 font-serif text-2xl">{values.programName || "Your loyalty program"}</p><div className="mt-8 flex justify-between text-xs"><span>{values.centerName || "Center name"}</span><span>Gold member</span></div></div>
        </div>
      </aside>
    </section>
  );
}

const sideCopy = [
  { title: "Welcome. Who will own this setup?", detail: "Start with the person accountable for the loyalty program and clinic launch." },
  { title: "Give the center a permanent home.", detail: "This information powers its public sign-up link and printed QR material." },
  { title: "Shape the loyalty program.", detail: "Capture treatments and prices, then define tier and milestone rewards." },
  { title: "Choose and edit the first card direction.", detail: "Use a saved template design, then edit the clinic-specific Wallet details before creating the class." },
];

function OwnerStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return <StepContent title="Welcome. Who is leading this clinic?" detail="We’ll use these details for clinic ownership and implementation communication."><div className="grid gap-4 sm:grid-cols-2"><WizardField label="Owner name"><Input value={values.ownerName} onChange={(event) => update("ownerName", event.target.value)} placeholder="Ana Lopez" /></WizardField><WizardField label="Owner mobile"><Input value={values.ownerMobile} onChange={(event) => update("ownerMobile", event.target.value)} placeholder="+34 600 000 000" /></WizardField><WizardField label="Owner email" className="sm:col-span-2"><Input type="email" value={values.ownerEmail} onChange={(event) => update("ownerEmail", event.target.value)} placeholder="ana@clinic.com" /></WizardField><WizardField label="Primary contact name"><Input value={values.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Main setup contact" /></WizardField><WizardField label="Primary contact mobile"><Input value={values.mobile} onChange={(event) => update("mobile", event.target.value)} placeholder="+34 600 000 000" /></WizardField></div></StepContent>;
}

function CenterStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return <StepContent title="Tell us about the center." detail="These details create the public membership page and form the clinic record."><div className="grid gap-4 sm:grid-cols-2"><WizardField label="Center name" className="sm:col-span-2"><Input value={values.centerName} onChange={(event) => { const centerName = event.target.value; update("centerName", centerName); if (!values.slug) update("slug", normalizeSlug(centerName)); }} placeholder="Clínica Aurea" /></WizardField><WizardField label="Center address" className="sm:col-span-2"><Input value={values.addressLine} onChange={(event) => update("addressLine", event.target.value)} placeholder="Calle Serrano 42" /></WizardField><WizardField label="Postal code"><Input value={values.pincode} onChange={(event) => update("pincode", event.target.value)} placeholder="28001" /></WizardField><WizardField label="Permanent URL slug"><Input value={values.slug} onChange={(event) => update("slug", normalizeSlug(event.target.value))} placeholder="clinica-aurea" /></WizardField><WizardField label="Center mobile"><Input value={values.centerMobile} onChange={(event) => update("centerMobile", event.target.value)} placeholder="+34 910 000 000" /></WizardField><WizardField label="Center email"><Input type="email" value={values.centerEmail} onChange={(event) => update("centerEmail", event.target.value)} placeholder="hola@clinic.com" /></WizardField><label className="flex items-start gap-3 rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-4 text-sm sm:col-span-2"><input type="checkbox" checked={values.dataConsent} onChange={(event) => update("dataConsent", event.target.checked)} className="mt-1 h-4 w-4 accent-[#201715]" /><span><span className="font-semibold">Data processing consent</span><span className="mt-1 block text-[#806d63]">The center confirms it is authorised to process membership data.</span></span></label></div></StepContent>;
}

function ProgramStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  const updateTreatment = (index: number, treatment: TreatmentDraft) => {
    update("treatments", values.treatments.map((item, itemIndex) => itemIndex === index ? treatment : item));
  };
  const updateTier = (index: number, tier: TierRewardDraft) => {
    update("tierRewards", values.tierRewards.map((item, itemIndex) => itemIndex === index ? tier : item));
  };
  const updateMilestone = <Key extends keyof MilestoneRewardDraft>(key: Key, value: MilestoneRewardDraft[Key]) => {
    update("milestoneRewards", { ...values.milestoneRewards, [key]: value });
  };

  return <StepContent title="Build the rewards program." detail="Capture the essentials now; the clinic can refine the complete catalog after launch."><div className="grid gap-6"><WizardField label="Program name"><Input value={values.programName} onChange={(event) => update("programName", event.target.value)} placeholder="Aurea Beauty Club" /></WizardField><section className="grid gap-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Treatments and prices</p><Button type="button" variant="outline" onClick={() => update("treatments", [...values.treatments, { name: "", priceEuro: "" }])} className="h-9 rounded-xl"><Plus className="mr-2 h-4 w-4" /> Add option</Button></div><div className="grid gap-3">{values.treatments.map((treatment, index) => <div key={index} className="grid gap-3 rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-3 sm:grid-cols-[1fr_150px_auto]"><Input aria-label={`Treatment ${index + 1} name`} value={treatment.name} onChange={(event) => updateTreatment(index, { ...treatment, name: event.target.value })} placeholder="Spa" /><Input aria-label={`Treatment ${index + 1} price`} type="number" min="0" value={treatment.priceEuro} onChange={(event) => updateTreatment(index, { ...treatment, priceEuro: event.target.value })} placeholder="120 euro" /><Button type="button" variant="ghost" onClick={() => update("treatments", values.treatments.filter((_, itemIndex) => itemIndex !== index))} disabled={values.treatments.length === 1} aria-label={`Remove treatment ${index + 1}`} className="h-10 rounded-xl"><Trash2 className="h-4 w-4" /></Button></div>)}</div></section><section className="grid gap-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">Tier rewards</p><Button type="button" variant="outline" onClick={() => update("tierRewards", [...values.tierRewards, { name: "", rewardText: "" }])} className="h-9 rounded-xl"><Plus className="mr-2 h-4 w-4" /> Add tier</Button></div><div className="grid gap-3">{values.tierRewards.map((tier, index) => <div key={index} className="grid gap-3 rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-3 sm:grid-cols-[150px_1fr_auto]"><Input aria-label={`Tier ${index + 1} name`} value={tier.name} onChange={(event) => updateTier(index, { ...tier, name: event.target.value })} placeholder="Bronze" /><Input aria-label={`Tier ${index + 1} reward`} value={tier.rewardText} onChange={(event) => updateTier(index, { ...tier, rewardText: event.target.value })} placeholder="Priority booking, birthday credit" /><Button type="button" variant="ghost" onClick={() => update("tierRewards", values.tierRewards.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove tier ${index + 1}`} className="h-10 rounded-xl"><Trash2 className="h-4 w-4" /></Button></div>)}</div></section><section className="grid gap-3"><p className="text-sm font-semibold">Milestone rewards</p><div className="grid gap-3 rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-3 sm:grid-cols-2"><WizardField label="Milestones"><Input type="number" min="1" value={values.milestoneRewards.milestoneCount} onChange={(event) => updateMilestone("milestoneCount", event.target.value)} /></WizardField><WizardField label="Points to next milestone"><Input type="number" min="1" value={values.milestoneRewards.pointsToNextMilestone} onChange={(event) => updateMilestone("pointsToNextMilestone", event.target.value)} /></WizardField><WizardField label="Price amount"><Input type="number" min="1" value={values.milestoneRewards.priceAmount} onChange={(event) => updateMilestone("priceAmount", event.target.value)} /></WizardField><WizardField label="Points awarded"><Input type="number" min="1" value={values.milestoneRewards.pointsAwarded} onChange={(event) => updateMilestone("pointsAwarded", event.target.value)} /></WizardField></div></section></div></StepContent>;
}

function PassStepEditor({ presets, templates, selectedPreset, selectedTemplate, templateEdited, values, update, selectTemplate }: { presets: TemplatePreset[]; templates: OnboardingTemplateOption[]; selectedPreset: TemplatePreset | undefined; selectedTemplate: OnboardingTemplateOption | undefined; templateEdited: boolean; values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void; selectTemplate: (template: OnboardingTemplateOption) => void }) {
  return (
    <StepContent title="Choose and edit the clinic template." detail="Select a saved Voone design, then edit the same fields used in Template Designs before creating this clinic’s Wallet class.">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {templates.map((template) => (
            <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`overflow-hidden rounded-[20px] border bg-white p-3 text-left shadow-[0_12px_28px_rgba(67,48,43,0.08)] transition ${values.vooneTemplateId === template.id ? "border-[#201715] ring-2 ring-[#d9b477]/50" : "border-[#ded2cb] hover:border-[#b98a4f]"}`}>
              <span className="block h-28 rounded-lg p-3" style={{ backgroundColor: template.hexBackgroundColor, color: template.hexBackgroundColor === "#2a2e35" ? "#fff8f2" : "#2e2421" }}>
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
  return <StepContent title="Choose the first card design." detail="Select a saved Voone template, then keep it as-is or edit the copy that will become this clinic’s Wallet class."><div className="grid gap-5"><div className="grid gap-3 sm:grid-cols-3">{templates.map((template) => <button key={template.id} type="button" onClick={() => selectTemplate(template)} className={`overflow-hidden rounded-xl border p-3 text-left transition ${values.vooneTemplateId === template.id ? "border-[#201715] ring-2 ring-[#d9b477]/50" : "border-[#ded2cb] hover:border-[#b98a4f]"}`}><span className="block h-28 rounded-lg p-3" style={{ backgroundColor: template.hexBackgroundColor, color: template.hexBackgroundColor === "#2a2e35" ? "#fff8f2" : "#2e2421" }}><span className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-70">VOONE PASS</span><span className="mt-6 block font-serif text-lg">{template.programName}</span></span><span className="mt-3 block text-sm font-semibold">{template.name}</span><span className="mt-1 line-clamp-2 block text-xs text-[#806d63]">{template.description ?? "Ready to copy into a clinic pass."}</span></button>)}</div>{templates.length === 0 ? <p className="rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-4 text-sm text-[#806d63]">Create a Template Design before onboarding a clinic.</p> : null}{selectedTemplate ? <div className="grid gap-4 rounded-2xl border border-[#ded2cb] bg-[#fffaf6] p-4 sm:grid-cols-2"><WizardField label="Program name"><Input value={values.programName} onChange={(event) => update("programName", event.target.value)} /></WizardField><WizardField label="Background color"><Input type="color" value={values.colors[0]} onChange={(event) => update("colors", [event.target.value, values.colors[1], values.colors[2]])} /></WizardField><WizardField label="Logo URL"><Input value={values.logo} onChange={(event) => update("logo", event.target.value)} placeholder="https://.../logo.png" /></WizardField><WizardField label="Hero image URL"><Input value={values.heroImageUrl} onChange={(event) => update("heroImageUrl", event.target.value)} placeholder="https://.../hero.png" /></WizardField><WizardField label="Website URL"><Input value={values.websiteUrl} onChange={(event) => update("websiteUrl", event.target.value)} placeholder="https://clinic.com" /></WizardField><WizardField label="Appointment URL"><Input value={values.appointmentUrl} onChange={(event) => update("appointmentUrl", event.target.value)} placeholder="https://clinic.com/book" /></WizardField><WizardField label="Wallet button text"><Input value={values.appLinkText} onChange={(event) => update("appLinkText", event.target.value)} /></WizardField><WizardField label="Wallet button description"><Input value={values.appLinkDescription} onChange={(event) => update("appLinkDescription", event.target.value)} /></WizardField><WizardField label="Points label"><Input value={values.pointsLabel} onChange={(event) => update("pointsLabel", event.target.value)} /></WizardField><WizardField label="Tier label"><Input value={values.tierLabel} onChange={(event) => update("tierLabel", event.target.value)} /></WizardField><WizardField label="Benefits" className="sm:col-span-2"><Textarea value={values.benefitsText} onChange={(event) => update("benefitsText", event.target.value)} /></WizardField><WizardField label="Pass information" className="sm:col-span-2"><Textarea value={values.infoText} onChange={(event) => update("infoText", event.target.value)} /></WizardField></div> : null}<p className={`flex items-center gap-2 text-sm ${templateEdited ? "text-[#704f40]" : "text-[#2f7d57]"}`}><CheckCircle2 className="h-4 w-4" /> {selectedTemplate ? `${selectedTemplate.name} ${templateEdited ? "edited for this clinic" : "will be copied as-is"}` : "No template selected"}{selectedPreset ? ` with ${selectedPreset.name}` : ""}</p></div></StepContent>;
}

function StepContent({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return <div><h1 className="text-3xl font-semibold tracking-tight text-[#201715] sm:text-4xl">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#806d63]">{detail}</p><div className="mt-7">{children}</div></div>;
}

function WizardField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`grid gap-2 text-sm font-semibold ${className ?? ""}`}>{label}{children}</label>;
}