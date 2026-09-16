/**
 * Shown when a slug resolves to nothing — a mistyped URL, or a poster for a clinic that is
 * no longer active. Deliberately says nothing about which of those it was.
 */
export default function ClinicNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 text-center">
      <p className="voone-kicker">Voone</p>
      <h1 className="mt-3 font-serif text-2xl">Este enlace no está disponible</h1>
      <p className="mt-3 max-w-sm text-sm text-muted-foreground">
        Puede que el código haya caducado. Pide en recepción que te muestren el código QR
        actualizado.
      </p>
    </main>
  );
}
