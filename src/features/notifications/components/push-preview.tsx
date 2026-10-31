import { BellRing } from "lucide-react";

/** An iPhone lock-screen notification: what the client will actually see. */
export function PushPreview({
  clinicName,
  header,
  body,
  silent,
}: {
  clinicName: string;
  header: string;
  body: string;
  /** A silent message appears on the card but does not light up the lock screen. */
  silent?: boolean;
}) {
  return (
    <div aria-label="Vista previa en iPhone" className="min-w-0">
      <div className="w-full min-w-0 overflow-hidden rounded-[28px] bg-gradient-to-b from-[#4a3731] to-[#2d211e] p-3 shadow-inner">
        <p className="pb-2 pt-1 text-center text-[11px] font-medium tracking-wide text-white/60">
          iPhone · pantalla de bloqueo
        </p>
        <div className="flex min-w-0 gap-2.5 rounded-2xl bg-white/90 p-3 backdrop-blur">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2d211e] text-white">
            <BellRing size={16} aria-hidden />
          </span>
          <div className="min-w-0 flex-1 text-[13px] leading-[18px]">
            <div className="flex items-center justify-between gap-2 text-[11px] text-[#806d63]">
              <span className="min-w-0 truncate font-medium uppercase">
                {clinicName}
              </span>
              <span className="shrink-0">ahora</span>
            </div>
            <p className="mt-0.5 break-words font-semibold text-[#2d211e]">
              {header || "Título"}
            </p>
            <p className="mt-0.5 line-clamp-5 break-words text-[#4a3b36]">
              {body || "Escribe el mensaje…"}
            </p>
          </div>
        </div>
      </div>
      {silent ? (
        <p className="mt-2 text-xs text-[#927e72]">
          Sin notificación push: el mensaje solo aparece en la tarjeta del
          Wallet.
        </p>
      ) : null}
    </div>
  );
}
