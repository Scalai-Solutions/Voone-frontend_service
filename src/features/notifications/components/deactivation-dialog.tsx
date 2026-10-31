import { AlertTriangle } from "lucide-react";

/** The confirmation before an automation stops going out: a switch-off must be deliberate. */
export function DeactivationDialog({
  name,
  busy,
  onConfirm,
  onCancel,
}: {
  name: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#2d211e]/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deactivation-dialog-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#b94135] text-white">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <h3
              id="deactivation-dialog-title"
              className="font-serif text-2xl font-semibold"
            >
              ¿Desactivar «{name}»?
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#806d63]">
              Tus clientes dejarán de recibir esta comunicación automática.
              Puedes volver a activarla cuando quieras.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#cdb9aa] px-4 py-2 text-sm font-semibold text-[#754b36]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-full bg-[#b94135] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Desactivando..." : "Sí, desactivar"}
          </button>
        </div>
      </div>
    </div>
  );
}
