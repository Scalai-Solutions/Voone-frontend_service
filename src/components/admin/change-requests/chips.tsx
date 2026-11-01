import {
  STATUS_LABEL,
  TYPE_LABEL,
  type ChangeRequestStatus,
  type ChangeRequestType,
} from "@/lib/admin-change-requests";
import { knownErrorMessage } from "@/lib/admin-change-requests";
import { ApiError } from "@/lib/api-client";

const STATUS_STYLE: Record<ChangeRequestStatus, string> = {
  OPEN: "bg-[#f6e7d3] text-[#805637]",
  IN_PROGRESS: "bg-[#e3ecf4] text-[#355a78]",
  RESOLVED: "bg-[#e1efe3] text-[#2f6b3c]",
  REJECTED: "bg-[#f1e0dc] text-[#8a3a30]",
};

export function StatusChip({ status }: { status: ChangeRequestStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TypeChip({ type }: { type: ChangeRequestType }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[#d9c9b6] px-2.5 py-0.5 text-xs font-semibold text-[#6f4d3f]">
      {TYPE_LABEL[type]}
    </span>
  );
}

/** The backend's own message when it sent one (409s are written to be read), else a fallback. */
export function errorText(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const known = knownErrorMessage(error.code);

    if (known) return known;
    if (error.detail) return error.detail;
  }

  return fallback;
}

export const cardClass =
  "rounded-[26px] border border-[#ded2cb] bg-white/78 p-5 shadow-[0_24px_70px_-50px_rgba(67,48,43,0.68)] backdrop-blur-xl";
