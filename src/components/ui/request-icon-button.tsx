"use client";

import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconTip } from "@/components/ui/icon-tip";
import { requestButtonLabel, type RequestButtonKind } from "@/lib/request-button-labels";
import { cn } from "@/lib/utils";

/**
 * The owner's row-level "ask Voone to change / remove this" button, as an icon with a tooltip.
 * The label is the accessible name and the tooltip text. `onClick` gets the click event so the
 * caller can hand `event.currentTarget` (this button) to `useRestoreFocus().remember`.
 */
export function RequestIconButton({
  kind,
  subject,
  onClick,
}: {
  kind: RequestButtonKind;
  subject: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const label = requestButtonLabel(kind, subject);
  const Icon = kind === "edit" ? Pencil : Trash2;

  return (
    <IconTip label={label}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={onClick}
        className={cn(
          "h-8 w-8 rounded-lg",
          kind === "edit"
            ? "text-[#9b633e] hover:bg-[#f1e3d6] hover:text-[#9b633e]"
            : "text-[#b94135] hover:bg-[#b94135]/10 hover:text-[#b94135]",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </Button>
    </IconTip>
  );
}
