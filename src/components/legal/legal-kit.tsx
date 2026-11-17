import type { ReactNode } from "react";

import type { PlaceholderKey } from "./legal-placeholders";

/** A value the team still has to supply. Printed highlighted so a draft cannot pass for final. */
export function Ph({ k }: { k: PlaceholderKey }) {
  return (
    <mark className="rounded bg-[#f3d98b] px-1 font-mono text-[0.8em] text-[#4a3b12]">[[{k}]]</mark>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-4 font-serif text-xl font-semibold">{children}</h2>;
}

export function Bullets({ children }: { children: ReactNode }) {
  return <ul className="grid list-disc gap-1.5 pl-5">{children}</ul>;
}
