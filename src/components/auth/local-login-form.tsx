"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { Eye, EyeOff, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Signs in through next-auth.
 *
 * It used to compare a hardcoded password client-side and then write the granted role into
 * a cookie, which meant the browser decided its own privileges: anyone could set
 * voone-dev-role=voone_admin and be an administrator. The /api/staff route handlers trust
 * that session while holding STAFF_API_KEY, so on a public URL it handed over the ability
 * to rewrite any clinic's public page.
 *
 * Two things follow from fixing it, and both are deliberate:
 *
 *  - There is no longer a "Cliente / Administración" selector. The role comes from the
 *    server with the session; a client that can choose its own role has no security
 *    property worth discussing.
 *  - The destination is derived from the session after signing in, not from what was
 *    picked before.
 */
export function LocalLoginForm({
  authEnabled,
  callbackUrl,
}: {
  authEnabled: boolean;
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [recovering, setRecovering] = React.useState(false);
  const [recoveryContact, setRecoveryContact] = React.useState("");
  const [recoverySent, setRecoverySent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  // With authentication disabled the credentials provider has nothing to check against and
  // would fail for a reason that has nothing to do with what was typed. Nothing is gated in
  // that mode either, so say so and offer the door rather than a form that cannot work.
  if (!authEnabled) {
    return (
      <div className="space-y-4">
        <p className="rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
          La autenticación está desactivada en este entorno, así que no hace falta iniciar
          sesión. El panel es accesible directamente.
        </p>
        <Button asChild className="h-12 w-full rounded-2xl text-[15px]">
          <Link href="/dashboard">Ir al panel</Link>
        </Button>
      </div>
    );
  }

  async function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const result = await signIn("credentials", {
      identifier: identifier.trim(),
      password,
      // Handled here so a failure can be shown in place instead of bouncing through a
      // next-auth error page.
      redirect: false,
    });

    if (!result?.ok) {
      setPending(false);
      // Deliberately does not say which half was wrong: that difference tells an attacker
      // whether an address is valid.
      setError("Credenciales incorrectas.");
      return;
    }

    // Read the role from the session rather than assuming it: the server decides it, which
    // is the entire point of the change.
    const session = await getSession();
    const destination =
      callbackUrl ?? (session?.user?.role === "voone_admin" ? "/admin" : "/dashboard");

    router.push(destination);
    router.refresh();
  }

  function submitRecovery() {
    if (!recoveryContact.trim()) return;
    setRecoverySent(true);
  }

  return (
    <form onSubmit={submitLogin} className="space-y-4">
      <div>
        <Label
          className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#a47845]"
          htmlFor="voone-login-email"
        >
          Email o teléfono
        </Label>
        <Input
          id="voone-login-email"
          type="text"
          autoComplete="username"
          required
          className="h-12 rounded-2xl border-[#d9c9b6] bg-white/78 px-4 shadow-sm"
          value={identifier}
          onChange={(event) => {
            setIdentifier(event.target.value);
            setError(null);
          }}
          placeholder="nombre@voone.ai o +34 600 000 000"
        />
      </div>
      <div>
        <Label
          className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#a47845]"
          htmlFor="voone-login-password"
        >
          Contraseña
        </Label>
        <div className="relative">
          <Input
            id="voone-login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className="h-12 rounded-2xl border-[#d9c9b6] bg-white/78 px-4 pr-12 shadow-sm"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError(null);
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#806d63] transition hover:bg-[#f1e3d6]"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          setRecovering((open) => !open);
          setRecoveryContact(identifier);
          setRecoverySent(false);
        }}
        className="text-sm font-semibold text-[#8d5b39] hover:text-[#684126]"
        aria-expanded={recovering}
      >
        Recuperar contraseña
      </button>
      {recovering ? (
        <div className="rounded-2xl border border-[#d9c9b6] bg-white/70 p-4">
          {recoverySent ? (
            <p className="text-sm leading-6 text-[#705c52]">
              Si la cuenta existe, soporte enviará las instrucciones de recuperación al contacto registrado.
            </p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm leading-6 text-[#705c52]">
                Indica el email o teléfono de la cuenta para iniciar la recuperación.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  type="text"
                  value={recoveryContact}
                  onChange={(event) => setRecoveryContact(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitRecovery();
                    }
                  }}
                  placeholder="Email o teléfono"
                  className="h-11 rounded-xl border-[#d9c9b6] bg-white"
                />
                <button
                  type="button"
                  onClick={submitRecovery}
                  disabled={!recoveryContact.trim()}
                  className="rounded-xl bg-[#2d211e] px-4 py-2 text-sm font-semibold text-white"
                >
                  Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-2xl text-[15px] shadow-[0_18px_42px_-24px_rgba(67,48,43,0.95)]"
      >
        {pending ? "Entrando..." : "Entrar"} <LogIn className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}
