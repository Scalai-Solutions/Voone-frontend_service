import { WALLET_TEXT_MAX, WALLET_TEXT_WARN_AT, countChars } from "@/lib/wallet-text";
import { cn } from "@/lib/utils";

/** Live "430/500" counter: neutral, amber from 450, red at the limit. */
export function CharCounter({ text, max = WALLET_TEXT_MAX, className }: { text: string; max?: number; className?: string }) {
  const count = countChars(text);
  const tone = count >= max ? "text-destructive" : count >= WALLET_TEXT_WARN_AT ? "text-warning" : "text-[#927e72]";

  return (
    <p className={cn("mt-1 text-right text-xs tabular-nums", tone, className)} data-testid="char-counter">
      {count}/{max}
    </p>
  );
}
