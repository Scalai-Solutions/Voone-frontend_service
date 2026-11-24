"use client";

import { CircleHelp, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { TOUR_UI } from "./tour-copy";
import { useTour } from "./tour-provider";

/** The "Tutorial" row of the clinic profile menu. */
export function TutorialMenuItem({ className, onSelect }: { className?: string; onSelect: () => void }) {
  const tour = useTour();

  return (
    <button
      type="button"
      onClick={() => {
        onSelect();
        tour.openHub();
      }}
      className={className}
    >
      <GraduationCap className="h-4 w-4" /> {TOUR_UI.menuItem}
    </button>
  );
}

/** Below xl the profile menu is hidden, so small screens get this floating help button instead. */
export function TutorialHelpButton({ className }: { className?: string }) {
  const tour = useTour();

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      data-tour="mobile-help"
      aria-label={TOUR_UI.openTutorial}
      title={TOUR_UI.openTutorial}
      onClick={tour.openHub}
      className={cn("text-[#8e4d41]", className)}
    >
      <CircleHelp className="h-4 w-4" />
    </Button>
  );
}
