"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { provisionClinic, type ApiError, type TemplatePreset } from "@/lib/api-client";

const steps = ["Owner", "Center", "Brand", "Program", "Pass"];

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
  treatments: string;
  tierRewards: string;
  milestoneRewards: string;
  presetId: string;
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
  treatments: "",
  tierRewards: "",
  milestoneRewards: "",
  presetId: "",
};

export function OnboardingWizard({ presets }: { presets: TemplatePreset[] }) {
  const [step, setStep] = React.useState(0);
  const [values, setValues] = React.useState<OnboardingValues>({ ...initialValues, presetId: presets[0]?.id ?? "" });
  const [status, setStatus] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const selectedPreset = presets.find((preset) => preset.id === values.presetId) ?? presets[0];

  function update<Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) {
    setValues((current) => ({ ...current, [key]: value }));
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
    if (step === 2 && !values.dataConsent) {
      setStatus("Confirm the data processing consent before continuing.");
      return;
    }
    if (step === 3 && !values.programName) {
      setStatus("Add the loyalty program name to continue.");
      return;
    }
    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function finish() {
    setSubmitting(true);
    setStatus(null);
    try {
      await provisionClinic({
        slug: values.slug,
        name: values.centerName,
        addressLine: values.addressLine,
        pincode: values.pincode,
        presetId: values.presetId,
        programName: values.programName,
      });
      setStatus("Clinic created. Continue with the generated Wallet pass and QR setup.");
    } catch (error) {
      const detail = error instanceof Error && "detail" in error ? (error as ApiError).detail : undefined;
      setStatus(detail ?? "The clinic could not be created. Check the required details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto min-h-[650px] max-w-[1180px] overflow-hidden rounded-[24px] border border-[#ded2cb] bg-white shadow-[0_20px_56px_rgba(67,48,43,0.12)] lg:grid lg:grid-cols-[1.02fr_0.98fr]">
      <div className="flex min-w-0 flex-col p-7 sm:p-10">
        <div className="flex items-center justify-between gap-4"><Link href="/admin/onboarding" className="inline-flex items-center gap-2 text-sm font-semibold text-[#704f40]"><ArrowLeft className="h-4 w-4" /> Back</Link><span className="text-sm text-[#806d63]">Step {step + 1} of 5</span></div>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-[#eee6e0]"><span className="block h-full rounded-full bg-[#201715] transition-all" style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>

        <div className="my-auto pt-10">
          {step === 0 ? <OwnerStep values={values} update={update} /> : null}
          {step === 1 ? <CenterStep values={values} update={update} /> : null}
          {step === 2 ? <BrandStep values={values} update={update} /> : null}
          {step === 3 ? <ProgramStep values={values} update={update} /> : null}
          {step === 4 ? <PassStep presets={presets} selectedPreset={selectedPreset} values={values} update={update} /> : null}
        </div>

        <div className="mt-8 border-t border-[#eadfd8] pt-5">
          {status ? <p className={`mb-4 text-sm ${status.startsWith("Clinic created") ? "text-[#2f7d57]" : "text-destructive"}`}>{status}</p> : null}
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="ghost" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0} className="rounded-xl">Previous</Button>
            {step < steps.length - 1 ? <Button type="button" onClick={next} className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]">Continue <ArrowRight className="ml-2 h-4 w-4" /></Button> : <Button type="button" onClick={finish} disabled={submitting} className="rounded-xl bg-[#201715] text-white hover:bg-[#3b2a25]">{submitting ? "Creating..." : "Create clinic"}<Check className="ml-2 h-4 w-4" /></Button>}
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
  { title: "Bring the center brand into the pass.", detail: "Use a vector logo and three considered brand colors for a consistent Wallet experience." },
  { title: "Shape the loyalty program.", detail: "Capture treatments and prices, then define tier and milestone rewards." },
  { title: "Choose the first card direction.", detail: "Select one of three editable starting points for the clinic Wallet pass." },
];

function OwnerStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return <StepContent title="Welcome. Who is leading this clinic?" detail="We’ll use these details for clinic ownership and implementation communication."><div className="grid gap-4 sm:grid-cols-2"><WizardField label="Owner name"><Input value={values.ownerName} onChange={(event) => update("ownerName", event.target.value)} placeholder="Ana Lopez" /></WizardField><WizardField label="Owner mobile"><Input value={values.ownerMobile} onChange={(event) => update("ownerMobile", event.target.value)} placeholder="+34 600 000 000" /></WizardField><WizardField label="Owner email" className="sm:col-span-2"><Input type="email" value={values.ownerEmail} onChange={(event) => update("ownerEmail", event.target.value)} placeholder="ana@clinic.com" /></WizardField><WizardField label="Primary contact name"><Input value={values.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Main setup contact" /></WizardField><WizardField label="Primary contact mobile"><Input value={values.mobile} onChange={(event) => update("mobile", event.target.value)} placeholder="+34 600 000 000" /></WizardField></div></StepContent>;
}

function CenterStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return <StepContent title="Tell us about the center." detail="These details create the public membership page and form the clinic record."><div className="grid gap-4 sm:grid-cols-2"><WizardField label="Center name" className="sm:col-span-2"><Input value={values.centerName} onChange={(event) => update("centerName", event.target.value)} placeholder="Clínica Aurea" /></WizardField><WizardField label="Center address" className="sm:col-span-2"><Input value={values.addressLine} onChange={(event) => update("addressLine", event.target.value)} placeholder="Calle Serrano 42" /></WizardField><WizardField label="Postal code"><Input value={values.pincode} onChange={(event) => update("pincode", event.target.value)} placeholder="28001" /></WizardField><WizardField label="Permanent URL slug"><Input value={values.slug} onChange={(event) => update("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"))} placeholder="clinica-aurea" /></WizardField><WizardField label="Center mobile"><Input value={values.centerMobile} onChange={(event) => update("centerMobile", event.target.value)} placeholder="+34 910 000 000" /></WizardField><WizardField label="Center email"><Input type="email" value={values.centerEmail} onChange={(event) => update("centerEmail", event.target.value)} placeholder="hola@clinic.com" /></WizardField></div></StepContent>;
}

function BrandStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return <StepContent title="Make the pass recognisably theirs." detail="Add a vector logo and the three colors that define the center’s client-facing identity."><div className="grid gap-5"><WizardField label="Vectorized logo"><Input value={values.logo} onChange={(event) => update("logo", event.target.value)} placeholder="https://.../logo.svg" /></WizardField><div><p className="text-sm font-semibold">Brand colors</p><div className="mt-3 grid grid-cols-3 gap-3">{values.colors.map((color, index) => <label key={index} className="flex items-center gap-2 rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-3 text-xs"><input aria-label={`Brand color ${index + 1}`} type="color" value={color} onChange={(event) => update("colors", values.colors.map((item, itemIndex) => itemIndex === index ? event.target.value : item) as OnboardingValues["colors"])} className="h-7 w-7 cursor-pointer rounded-full border-0 bg-transparent p-0" />{color}</label>)}</div></div><label className="flex items-start gap-3 rounded-xl border border-[#ded2cb] bg-[#fffaf6] p-4 text-sm"><input type="checkbox" checked={values.dataConsent} onChange={(event) => update("dataConsent", event.target.checked)} className="mt-1 h-4 w-4 accent-[#201715]" /><span><span className="font-semibold">Data processing consent</span><span className="mt-1 block text-[#806d63]">The center confirms it is authorised to process membership data.</span></span></label></div></StepContent>;
}

function ProgramStep({ values, update }: { values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return <StepContent title="Build the rewards program." detail="Capture the essentials now; the clinic can refine the complete catalog after launch."><div className="grid gap-4"><WizardField label="Program name"><Input value={values.programName} onChange={(event) => update("programName", event.target.value)} placeholder="Aurea Beauty Club" /></WizardField><WizardField label="Treatments and prices"><Textarea value={values.treatments} onChange={(event) => update("treatments", event.target.value)} placeholder="Hydrafacial - €120\nLaser session - €220" /></WizardField><div className="grid gap-4 sm:grid-cols-2"><WizardField label="Tier rewards"><Textarea value={values.tierRewards} onChange={(event) => update("tierRewards", event.target.value)} placeholder="Gold: priority booking" /></WizardField><WizardField label="Milestone rewards"><Textarea value={values.milestoneRewards} onChange={(event) => update("milestoneRewards", event.target.value)} placeholder="5 visits: €20 credit" /></WizardField></div></div></StepContent>;
}

function PassStep({ presets, selectedPreset, values, update }: { presets: TemplatePreset[]; selectedPreset: TemplatePreset | undefined; values: OnboardingValues; update: <Value extends keyof OnboardingValues>(key: Value, value: OnboardingValues[Value]) => void }) {
  return <StepContent title="Choose the first card design." detail="Three editable starting directions are generated for this center’s Wallet pass."><div className="grid gap-3 sm:grid-cols-3">{presets.slice(0, 3).map((preset) => <button key={preset.id} type="button" onClick={() => update("presetId", preset.id)} className={`overflow-hidden rounded-xl border p-3 text-left transition ${values.presetId === preset.id ? "border-[#201715] ring-2 ring-[#d9b477]/50" : "border-[#ded2cb] hover:border-[#b98a4f]"}`}><span className="block h-28 rounded-lg p-3" style={{ backgroundColor: preset.hexBackgroundColor, color: preset.hexBackgroundColor === "#2a2e35" ? "#fff8f2" : "#2e2421" }}><span className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-70">VOONE PASS</span><span className="mt-6 block font-serif text-lg">{values.programName || "Your program"}</span></span><span className="mt-3 block text-sm font-semibold">{preset.name}</span></button>)}</div>{selectedPreset ? <p className="mt-3 flex items-center gap-2 text-sm text-[#2f7d57]"><CheckCircle2 className="h-4 w-4" /> {selectedPreset.name} selected</p> : null}</StepContent>;
}

function StepContent({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return <div><h1 className="text-3xl font-semibold tracking-tight text-[#201715] sm:text-4xl">{title}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-[#806d63]">{detail}</p><div className="mt-7">{children}</div></div>;
}

function WizardField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`grid gap-2 text-sm font-semibold ${className ?? ""}`}>{label}{children}</label>;
}