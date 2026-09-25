import Link from "next/link";

import { PasswordSetupForm } from "@/features/auth/components/password-setup-form";

export default async function Page(context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_12%_12%,rgba(217,180,119,0.32),transparent_32%),radial-gradient(circle_at_88%_10%,rgba(239,220,213,0.86),transparent_34%),linear-gradient(180deg,#faf2ee,#f4e5dc_58%,#efe0d8)]" />
      <div className="voone-grain pointer-events-none fixed inset-0 -z-10 opacity-[0.04]" />

      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-5xl items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="hidden lg:block">
          <Link href="/" className="inline-block w-fit">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/voone-logo.png" alt="Voone" className="h-14 w-auto object-contain" />
          </Link>
          <h2 className="mt-10 max-w-md font-serif text-6xl font-semibold leading-[0.96] tracking-tight text-[#2e2421]">Create secure access for your clinic.</h2>
          <p className="mt-5 max-w-md text-base leading-7 text-[#806d63]">After this step, the magic link expires and you will use your email and password to sign in.</p>
        </div>
        <PasswordSetupForm token={token} />
      </section>
    </main>
  );
}
