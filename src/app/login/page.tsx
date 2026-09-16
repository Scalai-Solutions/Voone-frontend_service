import Link from "next/link";
import { CreditCard, ShieldCheck, Sparkles } from "lucide-react";

import { LocalLoginForm } from "@/components/auth/local-login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAuthEnabled } from "@/lib/auth";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  // proxy.ts appends callbackUrl when it bounces a protected route here, so signing in
  // returns to where the visitor was actually going.
  const query = await searchParams;
  const callbackUrl = typeof query.callbackUrl === "string" ? query.callbackUrl : undefined;
  const authEnabled = isAuthEnabled();

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(217,180,119,0.32),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(239,220,213,0.86),transparent_34%),linear-gradient(180deg,#faf2ee,#f4e5dc_58%,#efe0d8)]" />
      <div className="voone-grain pointer-events-none fixed inset-0 -z-10 opacity-[0.04]" />

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="voone-dark-panel order-2 hidden min-h-[520px] p-8 md:p-10 lg:order-1 lg:block">
          <div className="voone-grain pointer-events-none absolute inset-0 opacity-[0.08]" />
          <div className="relative flex h-full flex-col justify-between gap-10">
            <Link href="/" className="inline-block w-fit text-[4.5rem] italic leading-none tracking-normal text-[#fff8ec]" style={{ fontFamily: '"Bodoni 72", Didot, "Times New Roman", serif' }}>
              Voone
            </Link>

            <div>
              <p className="voone-kicker text-gold-light">Acceso al espacio</p>
              <h1 className="mt-4 max-w-xl font-serif text-5xl font-semibold tracking-tight text-white md:text-6xl">Bienvenido de nuevo.</h1>
              <p className="mt-5 max-w-lg text-base leading-7 text-white/64">Abre el panel de tu clínica. El acceso que verás depende de tu cuenta.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <LoginMetric icon={CreditCard} label="Cliente" value="Panel" />
              <LoginMetric icon={ShieldCheck} label="Administración" value="Panel" />
              <LoginMetric icon={Sparkles} label="Modo" value="Local" />
            </div>
          </div>
        </div>

        <Card className="order-1 overflow-hidden rounded-[28px] border-[#d9c9b6] bg-[#fffaf3]/88 shadow-[0_30px_90px_-52px_rgba(67,48,43,0.85)] backdrop-blur-xl lg:order-2">
          <CardHeader className="pb-4 pt-8 md:px-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a47845]">Iniciar sesión</p>
            <CardTitle className="mt-2 font-serif text-4xl font-semibold tracking-tight">Accede a Voone</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Introduce tus credenciales para continuar.</p>
          </CardHeader>
          <CardContent className="pb-8 md:px-8">
            <LocalLoginForm authEnabled={authEnabled} callbackUrl={callbackUrl} />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function LoginMetric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <Icon className="h-5 w-5 text-gold-light" />
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gold-light/70">{label}</p>
      <p className="mt-1 font-serif text-2xl font-semibold tracking-tight text-white">{value}</p>
    </div>
  );
}