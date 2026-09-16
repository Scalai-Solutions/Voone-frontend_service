"use client";

/**
 * Shown when the clinic could not be loaded for a reason that is not a missing clinic — the
 * API unreachable, or a 500. Distinct from not-found.tsx on purpose: telling someone at
 * reception that their QR code expired would send them to fetch a new one that would not
 * help either.
 */
export default function ClinicLoadError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <p className="voone-kicker">Voone</p>
      <h1 className="mt-3 font-serif text-2xl">No hemos podido cargar esta página</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Es un problema nuestro, no del código QR. Vuelve a intentarlo en un momento.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
      >
        Reintentar
      </button>
    </main>
  );
}
