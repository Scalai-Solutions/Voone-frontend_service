import {
  STATUS_LABELS,
  TYPE_LABELS,
} from "@/lib/change-request-display";
import type {
  ChangeRequestStatus,
  ChangeRequestType,
} from "@/lib/staff-change-requests";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<ChangeRequestStatus, string> = {
  OPEN: "bg-[#fdf1d8] text-[#8a5a12]",
  IN_PROGRESS: "bg-[#e3eefb] text-[#2b5a8e]",
  RESOLVED: "bg-[#e1f1e4] text-[#2f6b3d]",
  REJECTED: "bg-[#f7e2de] text-[#9a3a2e]",
};

export function StatusChip({ status }: { status: ChangeRequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
        STATUS_STYLE[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function TypeChip({ type }: { type: ChangeRequestType }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[#f1e3d6] px-3 py-1 text-xs font-semibold text-[#805637]">
      {TYPE_LABELS[type]}
    </span>
  );
}
