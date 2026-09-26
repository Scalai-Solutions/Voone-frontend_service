"use client";

import * as React from "react";
import { ArrowLeft, CheckCircle2, QrCode, ScanLine, Search, X } from "lucide-react";
import { motion } from "motion/react";

import { useCreditMember } from "@/features/members/api/useCreditMember";
import { useMembers } from "@/features/members/api/useMembers";
import { useTreatments } from "@/features/treatments/api/useTreatments";
import { ApiError, lookupMemberByWalletCode, type Member } from "@/lib/api-client";

function walletCodeFromScan(value: string): string {
  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    const codeParam = url.searchParams.get("code");

    if (codeParam) return codeParam;

    const parts = url.pathname.split("/").filter(Boolean);
    const addIndex = parts.findIndex((part) => part === "add");

    if (addIndex >= 0 && parts[addIndex + 1]) return parts[addIndex + 1];

    return parts.at(-1) ?? trimmed;
  } catch {
    return trimmed;
  }
}

export function ScanToCredit() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const scannerControlsRef = React.useRef<{ stop: () => void } | null>(null);
  const selectedMemberRef = React.useRef<Member | null>(null);
  const lastScanRef = React.useRef("");
  const members = useMembers();
  const treatments = useTreatments();
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [scannerOpen, setScannerOpen] = React.useState(true);
  const [selectedTreatmentIds, setSelectedTreatmentIds] = React.useState<string[]>([]);
  const [treatmentSearch, setTreatmentSearch] = React.useState("");
  const [manualMemberId, setManualMemberId] = React.useState("");
  const [referralCode, setReferralCode] = React.useState("");
  const [scanMessage, setScanMessage] = React.useState("Escanea el pase del cliente para empezar");
  const [notice, setNotice] = React.useState("");

  React.useEffect(() => {
    selectedMemberRef.current = selectedMember;
  }, [selectedMember]);

  const selectedTreatments = React.useMemo(
    () => (treatments.data ?? []).filter((treatment) => selectedTreatmentIds.includes(treatment.id)),
    [selectedTreatmentIds, treatments.data]
  );
  const selectedTreatmentPoints = selectedTreatments.reduce((total, treatment) => total + treatment.points, 0);
  const filteredTreatments = React.useMemo(() => {
    const normalizedSearch = treatmentSearch.trim().toLowerCase();

    if (!normalizedSearch) return treatments.data ?? [];

    return (treatments.data ?? []).filter((treatment) =>
      `${treatment.name} ${treatment.points}`.toLowerCase().includes(normalizedSearch)
    );
  }, [treatmentSearch, treatments.data]);

  const confirmMutation = useCreditMember({
    onError: (error) => {
      setNotice(
        error instanceof ApiError && error.detail
          ? `No se guardaron los puntos: ${error.detail}`
          : "No se guardaron los puntos. Inténtalo una vez más antes de que el miembro se vaya."
      );
    },
    onSuccess: (member) => {
      resetScan(`Puntos añadidos a ${member.name}. Nuevo saldo: ${member.points.toLocaleString("es-ES")} puntos.`);
    },
  });

  const findMember = React.useCallback(
    (value: string) => {
      const normalizedValue = value.trim().toLowerCase();
      return members.data?.find((member) => {
        return member.id.toLowerCase() === normalizedValue || member.identity.toLowerCase() === normalizedValue || member.name.toLowerCase().includes(normalizedValue);
      });
    },
    [members.data]
  );

  const selectMember = React.useCallback((member: Member, message: string) => {
    if (selectedMemberRef.current) return;

    window.setTimeout(() => {
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
      setSelectedMember(member);
      setScannerOpen(false);
      setManualMemberId(member.name);
      setScanMessage(message);
    }, 0);
  }, []);

  function resetScan(completionNotice = "") {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    selectedMemberRef.current = null;
    lastScanRef.current = "";
    setSelectedMember(null);
    setSelectedTreatmentIds([]);
    setTreatmentSearch("");
    setNotice(completionNotice);
    setScanMessage("Escanea el pase del cliente para empezar");
    setScannerOpen(true);
  }

  function toggleTreatment(treatmentId: string) {
    setSelectedTreatmentIds((current) =>
      current.includes(treatmentId)
        ? current.filter((id) => id !== treatmentId)
        : [...current, treatmentId]
    );
  }

  const resolveScan = React.useCallback(
    async (value: string) => {
      const normalizedValue = value.trim();

      if (!normalizedValue || normalizedValue === lastScanRef.current) return;

      lastScanRef.current = normalizedValue;
      const localMember = findMember(normalizedValue);

      if (localMember) {
        selectMember(localMember, "Miembro encontrado. Selecciona un tratamiento.");
        return;
      }

      try {
        const member = await lookupMemberByWalletCode(walletCodeFromScan(normalizedValue));

        selectMember(member, "Pase Wallet reconocido. Selecciona un tratamiento.");
        setNotice(`Miembro encontrado: ${member.name}`);
      } catch {
        setScanMessage("Ningún miembro coincide con este código. Busca por nombre, móvil o email.");
      }
    },
    [findMember, selectMember]
  );

  React.useEffect(() => {
    const scannerActive = scannerOpen && !selectedMember;

    if (!scannerActive || !videoRef.current) {
      scannerControlsRef.current?.stop();
      scannerControlsRef.current = null;
      return;
    }

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
          if (selectedMemberRef.current) return;
          const text = result?.getText();
          if (!text) return;
          void resolveScan(text);
        });
        scannerControlsRef.current = controls;
      } catch {
        setScanMessage("No se pudo iniciar la cámara. Busca por nombre o ID.");
      }
    }

    startScanner();
    return () => {
      cancelled = true;
      controls?.stop();
      if (scannerControlsRef.current === controls) scannerControlsRef.current = null;
    };
  }, [resolveScan, scannerOpen, selectedMember]);

  async function handleManualSearch() {
    const member = findMember(manualMemberId);
    if (member) {
      selectMember(member, "Miembro encontrado. Selecciona un tratamiento.");
      setNotice(`Miembro encontrado: ${member.name}`);
    } else {
      try {
        const walletMember = await lookupMemberByWalletCode(walletCodeFromScan(manualMemberId));

        selectMember(walletMember, "Pase Wallet reconocido. Selecciona un tratamiento.");
        setNotice(`Miembro encontrado: ${walletMember.name}`);
      } catch {
        setNotice("Escribe un nombre, móvil, email o código Wallet válido para buscar.");
      }
    }
  }

  function handleCredit() {
    if (!selectedMember || selectedTreatments.length === 0) {
      setNotice("Selecciona un miembro y al menos un tratamiento antes de canjear.");
      return;
    }

    if (!Number.isInteger(selectedTreatmentPoints) || selectedTreatmentPoints < 1 || selectedTreatmentPoints > 1_000_000) {
      setNotice("La suma de puntos seleccionada no es válida. Revísala en la configuración del centro.");
      return;
    }

    const label = selectedTreatments.map((treatment) => treatment.name).join(" + ").slice(0, 120);

    confirmMutation.mutate({
      memberId: selectedMember.id,
      points: selectedTreatmentPoints,
      label,
      referralCode: referralCode || undefined,
    });
  }

  function handleReferralCode() {
    const normalizedCode = referralCode.trim();

    if (!normalizedCode) {
      setNotice("Introduce un código de referido.");
      return;
    }

    if (!selectedMember) {
      setNotice("Busca y selecciona el miembro antes de añadir el referido.");
      return;
    }

    const confirmed = window.confirm(`El código ${normalizedCode} se añadirá a ${selectedMember.name} (${selectedMember.id}). ¿Es la persona correcta?`);

    if (confirmed) {
      setNotice(`Código ${normalizedCode} confirmado para ${selectedMember.name}.`);
    }
  }

  return (
    <section className="relative text-[#2e2421]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">Operativa diaria</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.03em]">Escanear visita</h1>
          <p className="mt-2 text-sm text-[#927e72]">Registra una visita y aplica el tratamiento correcto.</p>
        </div>
        <div className="rounded-full border border-[#decfc5] bg-white/70 px-4 py-2 text-xs font-semibold text-[#725c51]"><ScanLine size={15} className="mr-2 inline text-[#b8864b]" /> {scannerOpen && !selectedMember ? "Cámara activa" : "Cámara cerrada"}</div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className={selectedMember ? "pointer-events-none fixed -z-10 h-px w-px overflow-hidden opacity-0" : "relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[28px] bg-[#211918] p-5 shadow-[0_18px_50px_rgba(67,42,30,0.14)] lg:min-h-[440px]"} aria-hidden={Boolean(selectedMember)}>
          <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover opacity-20" muted playsInline />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(174,131,92,0.16),transparent_42%)]" />
          <div className="relative flex h-[245px] w-[245px] items-center justify-center rounded-[28px] border border-[#dfb97d]/50">
            <div className="absolute left-[-1px] top-12 h-16 w-1 rounded-full bg-[#e5bd80]" />
            <div className="absolute right-[-1px] top-12 h-16 w-1 rounded-full bg-[#e5bd80]" />
            <div className="absolute bottom-12 left-[-1px] h-16 w-1 rounded-full bg-[#e5bd80]" />
            <div className="absolute bottom-12 right-[-1px] h-16 w-1 rounded-full bg-[#e5bd80]" />
            <div className="rounded-2xl border border-white/15 bg-white/[0.06] px-8 py-6 text-center text-[#f1d09a]">
              <QrCode size={42} className="mx-auto" />
              <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.26em] text-[#cbb4a6]">Alinea el QR</p>
            </div>
          </div>
          <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-sm text-[#c9bbb3]">
            <span>{selectedMember ? `${selectedMember.name} · ${selectedMember.points.toLocaleString("es-ES")} puntos` : scanMessage}</span>
            <span className="font-semibold text-[#d6a979]">{confirmMutation.isPending ? "Guardando" : "Listo"}</span>
          </div>
        </div>

        <motion.div
          key={selectedMember ? "visit-sheet" : "member-search"}
          initial={selectedMember ? { x: "100%", opacity: 0.98 } : false}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
          className={selectedMember ? "fixed inset-x-0 bottom-0 top-[104px] z-50 overflow-y-auto bg-[#211918]/30 p-0 backdrop-blur-[2px] sm:top-[112px]" : "space-y-4"}
        >
          {selectedMember ? (
            <div className="ml-auto flex min-h-full w-full max-w-[640px] flex-col border-l border-[#ddcec3] bg-[#f6f1ed] px-4 pb-4 pt-4 shadow-[-24px_0_70px_rgba(34,24,20,0.2)] sm:px-7 sm:pb-6 sm:pt-6">
              <div className="mb-6 flex items-center justify-between gap-3">
                <button type="button" onClick={() => resetScan()} className="inline-flex h-11 items-center gap-2 rounded-full border border-[#d8c8bd] bg-white px-4 text-sm font-semibold text-[#493832] shadow-sm transition hover:bg-[#fffaf6]">
                  <ArrowLeft className="h-4 w-4" /> Volver a escanear
                </button>
                <button type="button" onClick={() => resetScan()} className="grid h-11 w-11 place-items-center rounded-full border border-[#d8c8bd] bg-white text-[#493832] shadow-sm transition hover:bg-[#fffaf6]" aria-label="Cerrar visita">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-[28px] bg-[#211918] p-5 text-[#fff8f2] shadow-[0_18px_55px_rgba(65,43,32,0.18)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d6a979]">Visita de miembro</p>
                    <h2 className="mt-3 font-serif text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">{selectedMember.name}</h2>
                  </div>
                  <span className="rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-xs font-semibold text-[#e7d7cc]">{selectedMember.tier}</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#bca99d]">Saldo</p>
                    <p className="mt-2 text-2xl font-semibold">{selectedMember.points.toLocaleString("es-ES")}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#bca99d]">Identificación</p>
                    <p className="mt-2 truncate text-sm font-semibold">{selectedMember.identity}</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-[26px] border border-[#e2d5cc] bg-white/90 p-5 shadow-[0_18px_55px_rgba(65,43,32,0.08)] sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Tratamiento</p>
                <h2 className="mt-2 font-serif text-3xl font-semibold">Acreditar visita</h2>
                <label className="mt-5 flex items-center gap-3 rounded-2xl border border-[#ded1c8] bg-white px-3 py-3 text-[#927e72]">
                  <Search size={17} />
                  <span className="sr-only">Buscar tratamiento</span>
                  <input value={treatmentSearch} onChange={(event) => setTreatmentSearch(event.target.value)} placeholder="Buscar por nombre o puntos" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
                </label>
                <div className="mt-4 max-h-[300px] space-y-2 overflow-y-auto pr-1">
                  {treatments.isLoading ? <p className="rounded-2xl border border-dashed border-[#ded1c8] bg-white px-4 py-4 text-sm text-[#927e72]">Cargando tratamientos...</p> : null}
                  {!treatments.isLoading && filteredTreatments.map((treatment) => {
                    const selected = selectedTreatmentIds.includes(treatment.id);

                    return (
                      <button key={treatment.id} type="button" onClick={() => toggleTreatment(treatment.id)} className={selected ? "flex w-full items-center justify-between gap-4 rounded-2xl border border-[#2d211e] bg-[#2d211e] px-4 py-3 text-left text-white shadow-sm" : "flex w-full items-center justify-between gap-4 rounded-2xl border border-[#ded1c8] bg-white px-4 py-3 text-left text-[#493832] transition hover:border-[#b8864b] hover:bg-[#fffaf6]"}>
                        <span>
                          <span className="block text-sm font-semibold">{treatment.name}</span>
                          {typeof treatment.priceEuro === "number" ? <span className={selected ? "mt-1 block text-xs text-[#d8c8bd]" : "mt-1 block text-xs text-[#927e72]"}>{treatment.priceEuro.toLocaleString("es-ES")} euro</span> : null}
                        </span>
                        <span className="flex shrink-0 items-center gap-2 text-sm font-bold">
                          {treatment.points.toLocaleString("es-ES")}
                          <span className={selected ? "grid h-6 w-6 place-items-center rounded-full bg-white text-[#2d211e]" : "grid h-6 w-6 place-items-center rounded-full border border-[#d8c8bd] text-transparent"}>
                            <CheckCircle2 className="h-4 w-4" />
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {treatmentSearch && !filteredTreatments.length ? <p className="mt-3 text-xs font-semibold text-[#9b633e]">No hay tratamientos que coincidan con esa búsqueda.</p> : null}
                {selectedTreatments.length > 0 ? <p className="mt-4 rounded-2xl bg-[#f4e9df] px-4 py-3 text-sm font-semibold text-[#493832]">{selectedTreatments.length} tratamiento{selectedTreatments.length === 1 ? "" : "s"} · {selectedTreatmentPoints.toLocaleString("es-ES")} puntos en total</p> : null}
              </div>

              <div className="mt-5 rounded-[26px] border border-[#e2d5cc] bg-white/90 p-5 sm:p-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Código de referido</p>
                <div className="mt-3 flex gap-2">
                  <input value={referralCode} onChange={(event) => setReferralCode(event.target.value)} placeholder="Código del referido" className="min-w-0 flex-1 rounded-xl border border-[#ded1c8] bg-white px-3 py-3 text-sm outline-none focus:border-[#b8864b]" />
                  <button type="button" onClick={handleReferralCode} className="rounded-xl border border-[#cdb9aa] px-3 text-sm font-semibold text-[#754b36]">Añadir</button>
                </div>
                {notice ? <div role="alert" className="mt-3 rounded-xl bg-[#e9f3e8] px-3 py-2 text-sm font-semibold text-[#3d6a48]"><CheckCircle2 size={15} className="mr-1 inline" />{notice}</div> : null}
              </div>

              {selectedTreatments.length > 0 ? (
                <div className="mt-auto pt-5">
                  <button type="button" onClick={handleCredit} disabled={confirmMutation.isPending} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#161211] px-5 py-4 text-sm font-bold text-white shadow-[0_18px_44px_rgba(22,18,17,0.24)] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-55">
                    <CheckCircle2 size={18} /> {confirmMutation.isPending ? "Guardando puntos..." : `Añadir ${selectedTreatmentPoints.toLocaleString("es-ES")} puntos`}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
          <div className="space-y-4">
          <div className="rounded-[24px] border border-[#e2d5cc] bg-white/80 p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Miembro</p><h2 className="mt-2 font-serif text-2xl font-semibold">Buscar titular</h2></div>
              <Search className="text-[#b8864b]" />
            </div>
            <div className="mt-4 flex gap-2">
              <input value={manualMemberId} onChange={(event) => setManualMemberId(event.target.value)} placeholder="Nombre, móvil o MEM-1048" className="min-w-0 flex-1 rounded-xl border border-[#ded1c8] bg-white px-3 py-3 text-sm outline-none focus:border-[#b8864b]" />
              <button type="button" onClick={handleManualSearch} className="rounded-xl bg-[#2d211e] px-4 text-sm font-semibold text-white">Buscar</button>
            </div>
          </div>
          <div className="rounded-[24px] border border-[#e2d5cc] bg-white/80 p-5 text-sm leading-6 text-[#806d63]">
            Escanea un QR o busca una persona para abrir la acreditación de puntos.
            {notice ? <div role="alert" className="mt-3 rounded-xl bg-[#e9f3e8] px-3 py-2 text-sm font-semibold text-[#3d6a48]"><CheckCircle2 size={15} className="mr-1 inline" />{notice}</div> : null}
          </div>
          </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
