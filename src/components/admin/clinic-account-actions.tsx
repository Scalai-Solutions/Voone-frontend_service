"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CircleOff, MailCheck, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ClinicAccountActions({ clinicId, isActive }: { clinicId: string; isActive: boolean }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState<"suspend" | "delete" | null>(null);

  async function suspendClinic() {
    if (!window.confirm("Suspend this clinic account? Its public sign-up page will stop accepting members.")) return;

    setPending("suspend");
    setStatus(null);

    const response = await fetch(`/api/admin/clinics/${encodeURIComponent(clinicId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: false }),
    });

    setPending(null);

    if (!response.ok) {
      setStatus("The clinic could not be suspended.");
      return;
    }

    setStatus("Clinic account suspended.");
    router.refresh();
  }

  async function deleteClinic() {
    if (!window.confirm("Delete this clinic account and its members, template, treatments, and wallet rows? This cannot be undone.")) return;

    setPending("delete");
    setStatus(null);

    const response = await fetch(`/api/admin/clinics/${encodeURIComponent(clinicId)}`, {
      method: "DELETE",
    });

    setPending(null);

    if (!response.ok && response.status !== 404) {
      setStatus("The clinic could not be deleted.");
      return;
    }

    router.push("/admin/clinics");
    router.refresh();
  }

  return (
    <div className="rounded-[26px] border border-[#ead1c9] bg-[#fff8f6] p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b95c4d]">Account controls</p>
      <h2 className="mt-2 font-serif text-2xl font-semibold tracking-tight">Danger zone</h2>
      <p className="mt-2 text-sm leading-6 text-[#806d63]">Suspend pauses public membership collection. Delete removes the clinic and its dependent setup data.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={suspendClinic} disabled={!isActive || pending !== null} className="rounded-2xl border-[#d8aaa0] text-[#8d3f34]">
          <CircleOff className="mr-2 h-4 w-4" /> {pending === "suspend" ? "Suspending..." : isActive ? "Suspend account" : "Suspended"}
        </Button>
        <Button type="button" variant="destructive" onClick={deleteClinic} disabled={pending !== null} className="rounded-2xl">
          <Trash2 className="mr-2 h-4 w-4" /> {pending === "delete" ? "Deleting..." : "Delete account"}
        </Button>
      </div>
      {status ? <p className="mt-3 text-sm text-[#8d3f34]">{status}</p> : null}
    </div>
  );
}

export function ClinicCredentialsActions({ clinicId, email, generatedAt, sentAt, hasPassword }: { clinicId: string; email?: string; generatedAt?: string | null; sentAt?: string | null; hasPassword?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [status, setStatus] = React.useState<string | null>(null);

  async function shareCredentials() {
    if (!email) return;
    if (!window.confirm(`Send fresh login credentials to ${email}? This will reset the temporary password.`)) return;

    setPending(true);
    setStatus(null);

    const response = await fetch(`/api/admin/clinics/${encodeURIComponent(clinicId)}/credentials/share`, {
      method: "POST",
    });

    setPending(false);

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null;
      setStatus(body?.message ?? "Credentials could not be shared.");
      return;
    }

    setStatus("Credentials sent by email.");
    router.refresh();
  }

  return (
    <div className="rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a47845]">Client access</p>
      <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight">Onboarding credentials</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <CredentialFact label="Login email" value={email ?? "No owner email saved"} />
        <CredentialFact label="Password" value={hasPassword ? "Generated and stored securely" : "Not generated"} />
        <CredentialFact label="Generated" value={generatedAt ? new Date(generatedAt).toLocaleString() : "Not generated"} />
        <CredentialFact label="Last shared" value={sentAt ? new Date(sentAt).toLocaleString() : "Never sent"} />
      </div>
      <Button type="button" onClick={shareCredentials} disabled={!email || pending} className="mt-5 rounded-2xl">
        <MailCheck className="mr-2 h-4 w-4" /> {pending ? "Sending..." : "Share credentials by email"}
      </Button>
      <p className="mt-3 text-xs leading-5 text-[#806d63]">Sharing credentials generates a fresh temporary password, stores its hash, and sends it via SendGrid.</p>
      {status ? <p className="mt-3 text-sm text-[#704f40]">{status}</p> : null}
    </div>
  );
}

function CredentialFact({ label, value }: { label: string; value: string }) {
  return <p className="rounded-2xl border border-[#e4d8d1] bg-[#fffaf6]/86 p-4"><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#a47845]">{label}</span><span className="mt-1 block text-sm font-semibold text-[#2e2421]">{value}</span></p>;
}