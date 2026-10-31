import { ApiError } from "@/lib/api-client";

export const inputClass =
  "h-10 w-full rounded-xl border border-[#ded1c8] bg-white px-3 text-sm outline-none focus:border-[#b8864b]";

export const panelClass =
  "rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl";

/**
 * What an admin sees when a write fails. The backend's 422 messages are the validation copy
 * for the field (Spanish, passed through unchanged); a 404 means the row is already gone.
 */
export function servicesErrorMessage(error: unknown, noun: string): string {
  if (error instanceof ApiError) {
    if ((error.status === 422 || error.status === 409) && error.detail)
      return error.detail;
    if (error.status === 404)
      return `That ${noun} no longer exists. The list has been refreshed.`;
    if (error.status === 403) return "You are not allowed to change this.";
  }

  return "Could not save. Try again.";
}

export function InlineConfirm({
  message,
  confirmLabel,
  pendingLabel,
  pending,
  onConfirm,
  onCancel,
}: {
  message: string;
  confirmLabel: string;
  pendingLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      role="alertdialog"
      aria-label={message}
      className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl bg-[#fff3ef] px-4 py-3 text-sm"
    >
      <p className="font-semibold text-[#8a3a30]">{message}</p>
      <button
        type="button"
        onClick={onConfirm}
        disabled={pending}
        className="rounded-full bg-[#b94135] px-4 py-1.5 font-semibold text-white disabled:opacity-60"
      >
        {pending ? pendingLabel : confirmLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border border-[#cdb9aa] px-4 py-1.5 font-semibold text-[#754b36]"
      >
        Cancel
      </button>
    </div>
  );
}
