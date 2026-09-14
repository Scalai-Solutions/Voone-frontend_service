"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const PASSWORD = "voone123";

const ACCOUNTS = {
  "client.voone.ai": { role: "owner", destination: "/dashboard" },
  "admin.voone.ai": { role: "voone_admin", destination: "/admin" },
} as const;

const LOGIN_OPTIONS = [
  { id: "client.voone.ai", label: "Client", detail: "Dashboard" },
  { id: "admin.voone.ai", label: "Admin", detail: "Control panel" },
] as const;

type AccountKey = keyof typeof ACCOUNTS;

export function LocalLoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = React.useState("client.voone.ai");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  function submitLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedIdentifier = identifier.trim().toLowerCase() as AccountKey;
    const account = ACCOUNTS[normalizedIdentifier];

    if (!account || password !== PASSWORD) {
      setError("Use a valid Voone login and password.");
      return;
    }

    document.cookie = `voone-local-account=${normalizedIdentifier}; path=/; max-age=31536000; SameSite=Lax`;
    document.cookie = `voone-dev-role=${account.role}; path=/; max-age=31536000; SameSite=Lax`;
    router.push(account.destination);
    router.refresh();
  }

  return (
    <form onSubmit={submitLogin} className="space-y-4">
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-border/70 bg-[#fbf4ec] p-1.5 shadow-inner">
        {LOGIN_OPTIONS.map((option) => {
          const active = identifier.trim().toLowerCase() === option.id;

          return (
            <button
              key={option.id}
              type="button"
              className={cn(
                "rounded-xl px-3 py-3 text-left transition-all",
                active ? "bg-[#2a1b16] text-[#fff8ec] shadow-[0_12px_28px_-18px_rgba(42,27,22,0.95)]" : "text-muted-foreground hover:bg-white/70 hover:text-foreground"
              )}
              onClick={() => {
                setIdentifier(option.id);
                setError(null);
              }}
            >
              <span className="block text-sm font-bold">{option.label}</span>
              <span className="mt-1 block text-[11px] opacity-70">{option.detail}</span>
            </button>
          );
        })}
      </div>
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#a47845]" htmlFor="voone-login-id">Workspace</Label>
        <Input
          id="voone-login-id"
          autoComplete="username"
          className="h-12 rounded-2xl border-[#d9c9b6] bg-white/78 px-4 shadow-sm"
          value={identifier}
          onChange={(event) => {
            setIdentifier(event.target.value);
            setError(null);
          }}
          placeholder="client.voone.ai"
        />
      </div>
      <div>
        <Label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#a47845]" htmlFor="voone-login-password">Password</Label>
        <Input
          id="voone-login-password"
          type="password"
          autoComplete="current-password"
          className="h-12 rounded-2xl border-[#d9c9b6] bg-white/78 px-4 shadow-sm"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setError(null);
          }}
        />
      </div>
      {error ? <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p> : null}
      <Button type="submit" className="h-12 w-full rounded-2xl text-[15px] shadow-[0_18px_42px_-24px_rgba(67,48,43,0.95)]">
        Login <LogIn className="ml-2 h-4 w-4" />
      </Button>
    </form>
  );
}