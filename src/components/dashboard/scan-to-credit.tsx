"use client";

import * as React from "react";
import { CheckCircle2, ChevronDown, QrCode, ScanLine, Search } from "lucide-react";

import { useCreditMember } from "@/features/members/api/useCreditMember";
import { useMembers } from "@/features/members/api/useMembers";
import { useTreatments } from "@/features/treatments/api/useTreatments";
import { type Member } from "@/lib/api-client";

export function ScanToCredit() {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const members = useMembers();
  const treatments = useTreatments();
  const [selectedMember, setSelectedMember] = React.useState<Member | null>(null);
  const [selectedTreatmentId, setSelectedTreatmentId] = React.useState("");
  const [treatmentSearch, setTreatmentSearch] = React.useState("");
  const [manualMemberId, setManualMemberId] = React.useState("");
  const [referralCode, setReferralCode] = React.useState("");
  const [scanMessage, setScanMessage] = React.useState("Escanea el pase del cliente para empezar");
  const [notice, setNotice] = React.useState("");

  const selectedTreatment = treatments.data?.find((treatment) => treatment.id === selectedTreatmentId) ?? null;
  const filteredTreatments = React.useMemo(() => {
    const normalizedSearch = treatmentSearch.trim().toLowerCase();

    if (!normalizedSearch) return treatments.data ?? [];

    return (treatments.data ?? []).filter((treatment) =>
      `${treatment.name} ${treatment.points}`.toLowerCase().includes(normalizedSearch)
    );
  }, [treatmentSearch, treatments.data]);

  const confirmMutation = useCreditMember({
    onError: () => {
      setNotice("No se guardaron los puntos. Inténtalo una vez más antes de que el miembro se vaya.");
    },
    onSuccess: (member) => {
      setSelectedMember(member);
      setNotice(`Premio canjeado. Nuevo saldo: ${member.points.toLocaleString("es-ES")} puntos`);
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
          const member = findMember(text);
          if (member) {
            setSelectedMember(member);
            setManualMemberId(member.name);
            setScanMessage("Miembro encontrado. Selecciona un tratamiento.");
          } else {
            setScanMessage("Ningún miembro coincide con este código. Busca por nombre o ID.");
          }
        });
      } catch {
        setScanMessage("No se pudo iniciar la cámara. Busca por nombre o ID.");
      }
    }

    startScanner();
    return () => {
      cancelled = true;
      controls?.stop();
    };
  }, [findMember]);

  function handleManualSearch() {
    const member = findMember(manualMemberId);
    if (member) {
      setSelectedMember(member);
      setNotice(`Miembro encontrado: ${member.name}`);
      setScanMessage("Miembro encontrado. Selecciona un tratamiento.");
    } else {
      setNotice("Escribe un nombre, móvil o ID válido para buscar.");
    }
  }

  function handleCredit() {
    if (!selectedMember || !selectedTreatment) {
      setNotice("Selecciona un miembro y un tratamiento antes de canjear.");
      return;
    }

    confirmMutation.mutate({
      memberId: selectedMember.id,
      points: selectedTreatment.points,
      label: selectedTreatment.name,
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
    <section className="text-[#2e2421]">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b7874a]">Operativa diaria</p>
          <h1 className="mt-2 font-serif text-4xl font-semibold tracking-[-0.03em]">Escanear visita</h1>
          <p className="mt-2 text-sm text-[#927e72]">Registra una visita y aplica el tratamiento correcto.</p>
        </div>
        <div className="rounded-full border border-[#decfc5] bg-white/70 px-4 py-2 text-xs font-semibold text-[#725c51]"><ScanLine size={15} className="mr-2 inline text-[#b8864b]" /> Cámara activa</div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="relative flex min-h-[420px] items-center justify-center overflow-hidden rounded-[28px] bg-[#211918] p-5 shadow-[0_18px_50px_rgba(67,42,30,0.14)] lg:min-h-[440px]">
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

        <div className="space-y-4">
          <div className="rounded-[24px] border border-[#e2d5cc] bg-white/80 p-5">
            <div className="flex items-center justify-between">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Miembro</p><h2 className="mt-2 font-serif text-2xl font-semibold">Buscar titular</h2></div>
              <Search className="text-[#b8864b]" />
            </div>
            <div className="mt-4 flex gap-2">
              <input value={manualMemberId} onChange={(event) => setManualMemberId(event.target.value)} placeholder="Nombre, móvil o MEM-1048" className="min-w-0 flex-1 rounded-xl border border-[#ded1c8] bg-white px-3 py-3 text-sm outline-none focus:border-[#b8864b]" />
              <button onClick={handleManualSearch} className="rounded-xl bg-[#2d211e] px-4 text-sm font-semibold text-white">Buscar</button>
            </div>
            {selectedMember ? <div className="mt-3 rounded-xl bg-[#f4e9df] px-3 py-2 text-sm"><span className="font-semibold">{selectedMember.name}</span><span className="ml-2 text-[#89756a]">· {selectedMember.tier} · {selectedMember.points.toLocaleString("es-ES")} puntos</span></div> : null}
          </div>

          <div className="rounded-[24px] border border-[#e2d5cc] bg-white/80 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Tratamiento</p>
            <h2 className="mt-2 font-serif text-2xl font-semibold">Acreditar visita</h2>
            <label className="mt-4 flex items-center gap-3 rounded-xl border border-[#ded1c8] bg-white px-3 py-3 text-[#927e72]">
              <Search size={17} />
              <span className="sr-only">Buscar tratamiento</span>
              <input value={treatmentSearch} onChange={(event) => setTreatmentSearch(event.target.value)} placeholder="Buscar por nombre o puntos" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            </label>
            <div className="relative mt-4">
              <select value={selectedTreatmentId} onChange={(event) => setSelectedTreatmentId(event.target.value)} className="w-full appearance-none rounded-xl border border-[#ded1c8] bg-white px-4 py-3 pr-10 text-sm font-medium outline-none focus:border-[#b8864b]">
                <option value="">{treatments.isLoading ? "Cargando tratamientos" : "Selecciona un tratamiento"}</option>
                {filteredTreatments.map((treatment) => <option key={treatment.id} value={treatment.id}>{treatment.name} · {treatment.points} puntos</option>)}
              </select>
              <ChevronDown size={17} className="pointer-events-none absolute right-4 top-3.5 text-[#927e72]" />
            </div>
            {treatmentSearch && !filteredTreatments.length ? <p className="mt-2 text-xs font-semibold text-[#9b633e]">No hay tratamientos que coincidan con esa búsqueda.</p> : null}
            {selectedTreatment ? <button onClick={handleCredit} disabled={!selectedMember || confirmMutation.isPending} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#b8864b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#9e6d3d] disabled:cursor-not-allowed disabled:opacity-55"><CheckCircle2 size={17} /> Canjear premio</button> : null}
          </div>

          <div className="rounded-[24px] border border-[#e2d5cc] bg-white/80 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b7874a]">Código de referido</p>
            <div className="mt-3 flex gap-2">
              <input value={referralCode} onChange={(event) => setReferralCode(event.target.value)} placeholder="AUREA-2026" className="min-w-0 flex-1 rounded-xl border border-[#ded1c8] bg-white px-3 py-3 text-sm outline-none focus:border-[#b8864b]" />
              <button onClick={handleReferralCode} className="rounded-xl border border-[#cdb9aa] px-3 text-sm font-semibold text-[#754b36]">Añadir</button>
            </div>
            {notice ? <div role="alert" className="mt-3 rounded-xl bg-[#e9f3e8] px-3 py-2 text-sm font-semibold text-[#3d6a48]"><CheckCircle2 size={15} className="mr-1 inline" />{notice}</div> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
