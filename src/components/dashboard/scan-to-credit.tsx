"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, CheckCircle2, QrCode, RotateCcw, Search, Sparkles, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { creditMember, getMembers, getTreatments, type Member, type Treatment } from "@/lib/api-client";

export function ScanToCredit() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const queryClient = useQueryClient();
  const members = useQuery({ queryKey: ["members"], queryFn: getMembers });
  const treatments = useQuery({ queryKey: ["treatments"], queryFn: getTreatments });
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [selectedTreatment, setSelectedTreatment] = React.useState<Treatment | null>(null);
  const [manualMemberId, setManualMemberId] = React.useState("");
  const [manualPoints, setManualPoints] = React.useState("");
  const [referralCode, setReferralCode] = React.useState("");
  const [showReferral, setShowReferral] = React.useState(false);
  const [scanMessage, setScanMessage] = React.useState("Point the camera at a member QR code.");
  const [successBalance, setSuccessBalance] = React.useState<number | null>(null);
  const [toast, setToast] = React.useState<string | null>(null);
  const [displayedPoints, setDisplayedPoints] = React.useState<number | null>(null);

  const confirmMutation = useMutation({
    mutationFn: ({ member, points, label }: { member: Member; points: number; label: string }) => creditMember(member.id, points, label, referralCode || undefined),
    onMutate: async ({ member, points }) => {
      setDisplayedPoints((current) => (current ?? member.points) + points);
      return { previousPoints: displayedPoints ?? member.points };
    },
    onError: (_error, _variables, context) => {
      setDisplayedPoints(context?.previousPoints ?? null);
      setToast("Points were not saved. Try once more before the member leaves.");
    },
    onSuccess: (member) => {
      setSelectedMember(member);
      setDisplayedPoints(member.points);
      setSuccessBalance(member.points);
      queryClient.invalidateQueries({ queryKey: ["members"] });
      queryClient.invalidateQueries({ queryKey: ["member", member.id] });
    },
  });

  const findMember = React.useCallback(
    (value: string) => members.data?.find((member) => member.id.toLowerCase() === value.toLowerCase() || member.identity.toLowerCase() === value.toLowerCase()),
    [members.data]
  );

  React.useEffect(() => {
    if (!videoRef.current) return;
    let controls: { stop: () => void } | undefined;
    let cancelled = false;

    async function startScanner() {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (!videoRef.current || cancelled) return;
        const reader = new BrowserMultiFormatReader();
        const decodeFromVideoDevice = reader.decodeFromVideoDevice.bind(reader) as unknown as (
          deviceId: string | undefined,
          element: HTMLVideoElement,
          callback: (result: { getText: () => string } | undefined) => void
        ) => Promise<{ stop: () => void }>;
        controls = await decodeFromVideoDevice(undefined, videoRef.current, (result) => {
          const text = result?.getText();
          if (!text) return;
          const member = findMember(text.trim());
          if (member) {
            setSelectedMember(member);
            setDisplayedPoints(member.points);
            setScanMessage("Member found. Choose points to add.");
          } else {
            setScanMessage("No member matched this code. Search by member ID below.");
          }
        });
      } catch {
        setScanMessage("Camera could not start. Search by member ID below.");
      }
    }

    startScanner();
    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [findMember]);

  const points = selectedTreatment?.points ?? Number(manualPoints || 0);

  function resetForNextScan() {
    setSelectedMember(null);
    setSelectedTreatment(null);
    setManualMemberId("");
    setManualPoints("");
    setReferralCode("");
    setSuccessBalance(null);
    setDisplayedPoints(null);
    setScanMessage("Ready for the next member.");
  }

  return (
    <div className="h-full min-h-0">
      <div className="grid h-full min-h-0 gap-4 sm:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="voone-dark-panel overflow-hidden p-0">
          <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.08]" />
          <div className="relative h-full min-h-0">
            <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-72" muted playsInline />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(217,180,119,0.14),transparent_32%),linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.78))]" />

            <div className="absolute inset-x-4 top-4 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.08] px-4 py-2 text-sm font-bold text-white backdrop-blur-xl">
                <QrCode className="h-4 w-4 text-gold-light" />
                Camera active
              </div>
              <Button type="button" variant="secondary" size="sm" className="rounded-full" onClick={resetForNextScan}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reset
              </Button>
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-[#f5e3cc]/12 px-4 py-2 text-sm text-gold-light backdrop-blur-xl">
                <Sparkles className="h-4 w-4" />
                {points > 0 ? `+${points.toLocaleString()} pending` : "Choose points"}
              </div>
            </div>

            <div className="absolute left-1/2 top-1/2 h-[210px] w-[210px] -translate-x-1/2 -translate-y-1/2 rounded-[32px] border border-white/16 bg-white/[0.03] shadow-[0_0_0_9999px_rgba(0,0,0,0.18)] backdrop-blur-[2px] md:h-[300px] md:w-[300px]">
              <span className="absolute -left-1 -top-1 h-16 w-16 rounded-tl-[34px] border-l-4 border-t-4 border-gold-light" />
              <span className="absolute -right-1 -top-1 h-16 w-16 rounded-tr-[34px] border-r-4 border-t-4 border-gold-light" />
              <span className="absolute -bottom-1 -left-1 h-16 w-16 rounded-bl-[34px] border-b-4 border-l-4 border-gold-light" />
              <span className="absolute -bottom-1 -right-1 h-16 w-16 rounded-br-[34px] border-b-4 border-r-4 border-gold-light" />
              <div className="absolute inset-x-8 top-1/2 h-px bg-gold-light/65 shadow-[0_0_24px_rgba(217,180,119,0.75)]" />
              <div className="flex h-full items-center justify-center text-center">
                <div className="rounded-2xl border border-white/12 bg-black/24 px-4 py-3 backdrop-blur-xl">
                  <QrCode className="mx-auto h-7 w-7 text-gold-light" />
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-white/58">Align pass QR</p>
                </div>
              </div>
            </div>

            <div className="absolute inset-x-4 bottom-4 rounded-[24px] border border-white/12 bg-[#110a08]/72 p-4 text-white shadow-2xl backdrop-blur-2xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-white/62">{scanMessage}</p>
                  {selectedMember ? (
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-light text-[#241612]">
                        <UserRound className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-serif text-2xl font-semibold">{selectedMember.name}</p>
                        <p className="text-sm text-white/64">Current balance: {(displayedPoints ?? selectedMember.points).toLocaleString()} points</p>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-light/72">Next credit</p>
                  <p className="font-serif text-3xl font-semibold">{points > 0 ? `+${points.toLocaleString()}` : "--"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="max-h-full space-y-3 overflow-y-auto pr-1">
          {toast ? <p className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">{toast}</p> : null}
          {successBalance !== null ? (
            <div className="rounded-[26px] border border-success/30 bg-success/10 p-6 text-center text-success shadow-[0_22px_50px_-40px_rgba(47,125,87,0.75)]">
              <CheckCircle2 className="mx-auto h-12 w-12" />
              <p className="mt-3 font-serif text-3xl font-semibold">Saved</p>
              <p className="mt-1 text-sm">New balance: {successBalance.toLocaleString()} points</p>
              <Button type="button" className="mt-5 rounded-2xl" onClick={resetForNextScan}>Scan next member</Button>
            </div>
          ) : null}

          <div className="voone-panel p-4">
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="voone-kicker">Member</p>
                  <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">Find the pass holder</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#241612] text-gold-light">
                  <Search className="h-5 w-5" />
                </span>
              </div>
              <Label className="mb-2 mt-4 block">Manual member lookup</Label>
              <div className="flex gap-2">
                <Input value={manualMemberId} onChange={(event) => setManualMemberId(event.target.value)} placeholder="MEM-1048" />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => {
                    const member = findMember(manualMemberId.trim());
                    if (member) {
                      setSelectedMember(member);
                      setDisplayedPoints(member.points);
                      setScanMessage("Member found. Choose points to add.");
                    } else {
                      setScanMessage("No member found with that ID.");
                    }
                  }}
                >
                  Find
                </Button>
              </div>
            </div>
          </div>

          <div className="voone-panel p-4">
            <div className="relative">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="voone-kicker">Treatment</p>
                  <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight">Credit the visit</h2>
                </div>
                <BadgeCheck className="h-6 w-6 text-gold" />
              </div>
              {treatments.isLoading ? <Skeleton className="mt-4 h-36 w-full" /> : null}
              <div className="mt-3 grid grid-cols-2 gap-2">
                {treatments.data?.map((treatment) => (
                  <button
                    key={treatment.id}
                    type="button"
                    className={`min-h-20 rounded-2xl border px-3 py-3 text-left shadow-sm transition-all hover:-translate-y-0.5 ${selectedTreatment?.id === treatment.id ? "border-[#241612] bg-[#241612] text-white shadow-[0_20px_45px_-28px_rgba(36,22,18,0.9)]" : "border-border bg-[#fffaf3]/78 text-foreground"}`}
                    onClick={() => {
                      setSelectedTreatment(treatment);
                      setManualPoints("");
                    }}
                  >
                    <span className="block text-xs font-semibold sm:text-sm">{treatment.name}</span>
                    <span className="mt-2 block font-serif text-2xl font-semibold">+{treatment.points}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <Label className="mb-2 block">Manual amount</Label>
                <Input type="number" inputMode="numeric" min="1" value={manualPoints} onChange={(event) => { setManualPoints(event.target.value); setSelectedTreatment(null); }} placeholder="Points" />
              </div>

              <button type="button" className="mt-4 text-sm font-bold text-primary" onClick={() => setShowReferral((value) => !value)}>
                {showReferral ? "Hide referral code" : "Add referral code"}
              </button>
              {showReferral ? <Input className="mt-2" value={referralCode} onChange={(event) => setReferralCode(event.target.value)} placeholder="Optional referral code" /> : null}

              <Button
                type="button"
                className="mt-4 h-12 w-full rounded-2xl text-base"
                disabled={!selectedMember || points <= 0 || confirmMutation.isPending}
                onClick={() => selectedMember && confirmMutation.mutate({ member: selectedMember, points, label: selectedTreatment?.name ?? "Manual credit" })}
              >
                {confirmMutation.isPending ? "Saving..." : selectedMember ? `Confirm ${points > 0 ? `+${points.toLocaleString()}` : ""} points` : "Select member first"}
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}