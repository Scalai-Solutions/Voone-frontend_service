import Link from "next/link";

import { landingSans, landingSerif } from "@/app/landing-fonts";
import type { ReactNode } from "react";

/** Shared shell for the legal / about pages: branded header, prose body, footer. */
export function SiteLegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <main
      className={`landing ${landingSans.variable} ${landingSerif.variable} min-h-screen bg-background text-foreground`}
    >
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-3xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/voone-logo.png" alt="Voone" className="h-9 w-auto object-contain" />
          </Link>
          <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Volver al inicio
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-20 md:py-28">
        <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight">{title}</h1>
        {updated && <p className="mt-3 text-sm text-muted-foreground">Última actualización: {updated}</p>}
        <div
          className="mt-12 space-y-5 leading-relaxed text-muted-foreground [&>h2]:mt-10 [&>h2]:mb-2 [&>h2]:font-serif [&>h2]:text-2xl [&>h2]:font-semibold [&>h2]:text-foreground [&>p>strong]:text-foreground [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-6 [&_a]:text-gold [&_a]:underline"
        >
          {children}
        </div>
      </article>

      <footer className="border-t border-border/60">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-3 px-6 py-8 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Voone. Todos los derechos reservados.</span>
          <div className="flex gap-5">
            <Link href="/nosotros" className="hover:text-foreground">Nosotros</Link>
            <Link href="/privacidad-web" className="hover:text-foreground">Privacidad</Link>
            <Link href="/aviso-legal" className="hover:text-foreground">Aviso legal</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
