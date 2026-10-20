"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Copy } from "lucide-react";

import { QrCode } from "@/components/shared/qr-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProvisionClinic } from "@/features/onboarding/api/useProvisionClinic";
import { type ApiError, type TemplatePreset, type VooneTemplate } from "@/lib/api-client";
import {
  DEFAULT_WALLET_BACKGROUND_COLOR,
  DEFAULT_WALLET_HERO_IMAGE_URL,
  DEFAULT_WALLET_LOGO_URL,
  DEFAULT_WALLET_POINTS_LABEL,
  DEFAULT_WALLET_PROGRAM_NAME,
  DEFAULT_WALLET_TEMPLATE_DESCRIPTION,
  DEFAULT_WALLET_TEMPLATE_NAME,
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
  colors: [DEFAULT_WALLET_BACKGROUND_COLOR, "#201715", "#b98a4f"],
  dataConsent: false,
  programName: "",
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
    logoUrl: DEFAULT_WALLET_LOGO_URL,
    heroImageUrl: DEFAULT_WALLET_HERO_IMAGE_URL,
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

  return treatments;
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
    setValues((current) => ({
      ...current,
      vooneTemplateId: template.id,
      presetId: template.presetId ?? template.preset?.id ?? current.presetId,
      colors: [template.hexBackgroundColor, current.colors[1], current.colors[2]],
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
    if (step === 2 && !values.programName.trim()) {
      setStatus("Add the program or club name before creating the clinic.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  function finish() {
    if (!values.vooneTemplateId) {
      setStatus("Choose a template design before creating the clinic.");
      return;
    }
    if (!values.programName.trim()) {
      setStatus("Add the program or club name before creating the clinic.");
      return;
    }
    if (templateEdited && !window.confirm("Save this edited template for the clinic and create its Google Wallet class?")) {
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
                <WizardField label="Logo URL">
                  <Input value={values.logo} onChange={(event) => update("logo", event.target.value)} placeholder="https://.../logo.png" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Program / club name" className="sm:col-span-2">
                  <Input value={values.programName} onChange={(event) => update("programName", event.target.value)} placeholder="Club Diamante" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Hero image URL (optional)" className="sm:col-span-2">
                  <Input value={values.heroImageUrl} onChange={(event) => update("heroImageUrl", event.target.value)} placeholder="https://.../hero.jpg" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Wallet button text">
                  <Input value={values.appLinkText} onChange={(event) => update("appLinkText", event.target.value)} placeholder="Ver beneficios" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Button URL">
                  <Input value={values.appointmentUrl} onChange={(event) => update("appointmentUrl", event.target.value)} placeholder="https://clinic.com/benefits" className="rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Member benefits" className="sm:col-span-2">
                  <Textarea value={values.benefitsText} onChange={(event) => update("benefitsText", event.target.value)} className="min-h-20 rounded-xl bg-[#fffaf6]" />
                </WizardField>
                <WizardField label="Pass information" className="sm:col-span-2">
                  <Textarea value={values.infoText} onChange={(event) => update("infoText", event.target.value)} className="min-h-20 rounded-xl bg-[#fffaf6]" />
                </WizardField>
              </div>
            </form>

            <WalletCardPreview
              centerName={cardName}
              color={values.colors[0]}
              logoUrl={values.logo}
              programName={values.programName}
              heroImageUrl={values.heroImageUrl}
              buttonText={values.appLinkText}
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

function WalletCardPreview({ centerName, color, logoUrl, programName, heroImageUrl, buttonText, benefitsText, infoText }: { centerName: string; color: string; logoUrl: string; programName: string; heroImageUrl: string; buttonText: string; benefitsText: string; infoText: string }) {
  const clubName = programName.trim() || "Club Diamante";
  const cta = buttonText.trim() || "Ver beneficios";

  return (
    <aside className="rounded-[22px] border border-[#ded2cb] bg-[#fffaf6] p-5 shadow-[0_12px_28px_rgba(67,48,43,0.08)]">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Live preview</p>
      <div className="mt-4 mx-auto w-[260px] rounded-[30px] border-[7px] border-[#161616] bg-[#f7f7f7] p-2 shadow-[0_22px_48px_rgba(0,0,0,0.35)]">
        <div className="rounded-[24px] bg-white px-3 pb-3 pt-2">
          <div className="flex items-center justify-between px-1 text-[10px] font-semibold text-[#1e1e1e]"><span>9:30</span><span>5G ▰</span></div>
          <div className="mt-4 text-lg leading-none text-[#1e1e1e]">‹</div>
          <div className="mt-3 overflow-hidden rounded-[22px] text-white shadow-lg" style={{ backgroundColor: color }}>
            <div className="border-b border-white/20 px-4 py-3">
              <div className="flex items-center gap-3">
                {logoUrl ? <span aria-label="Logo preview" className="h-8 w-16 shrink-0 bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url(${logoUrl})` }} /> : <span className="h-8 w-16 shrink-0 rounded bg-white/10" />}
                <p className="truncate text-[11px] font-bold">{centerName}</p>
              </div>
            </div>
            <div className="px-4 py-4">
              <p className="text-[10px] font-semibold">Club de fidelización</p>
              <h3 className="mt-1 font-serif text-[26px] leading-none">{clubName}</h3>
              <div className="mt-5 grid grid-cols-[1fr_auto] gap-3 border-b border-white/20 pb-3">
                <div><p className="text-[9px] opacity-70">Nombre de socia</p><p className="text-[11px] font-bold">Nombre de la clienta</p></div>
                <div className="text-right"><p className="text-[9px] opacity-70">Puntos</p><p className="text-[11px] font-bold">250</p></div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                <div><p className="opacity-70">N.º de socia</p><p className="mt-1 font-bold">SOCIO-123</p></div>
                <div className="text-center"><p className="opacity-70">Nivel</p><p className="mt-1 font-bold">Diamante</p></div>
                <div className="text-right"><p className="opacity-70">Beneficio</p><p className="mt-1 font-bold">{cta}</p></div>
              </div>
              <div className="mt-6 flex justify-center">
                <QrCode value="https://voone.example/member/SOCIO-123" size={92} className="rounded-xl p-2" title="Preview QR" />
              </div>
            </div>
            <div className="h-28 bg-[#c9a88f]/40 bg-cover bg-center" style={heroImageUrl ? { backgroundImage: `linear-gradient(90deg,rgba(46,36,33,0.45),rgba(46,36,33,0.12)),url(${heroImageUrl})` } : undefined} />
          </div>
          <button type="button" className="mt-3 h-8 w-full rounded-full border border-[#bfb7b2] text-[11px] font-semibold text-[#1d5fd1]">Detalles</button>
        </div>
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

function WizardField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`grid gap-2 text-sm font-semibold ${className ?? ""}`}>{label}{children}</label>;
}