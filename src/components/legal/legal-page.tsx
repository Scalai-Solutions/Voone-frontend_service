import type { ReactNode } from "react";

/**
 * Shell for the legal documents linked from consent checkboxes.
 *
 * The wording of these documents is Voone's and its lawyer's, not engineering's. Each page
 * passes `provisional` until that text is final, and the banner says so rather than letting a
 * placeholder read as the real thing.
 */
export function LegalPage({
  title,
  provisional,
  children,
}: {
  title: string;
  provisional: boolean;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 text-[#2e2421]">
      <h1 className="font-serif text-3xl font-semibold">{title}</h1>
      {provisional ? (
        <p role="note" className="mt-4 rounded-lg bg-[#f4e9df] p-3 text-sm text-[#725c51]">
          Texto provisional, pendiente de revisión legal. El documento definitivo sustituirá a este.
        </p>
      ) : null}
      <div className="mt-6 grid gap-4 text-sm leading-6">{children}</div>
    </main>
  );
}
