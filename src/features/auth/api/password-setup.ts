import { ApiError } from "@/lib/api-client";

export interface PasswordSetupDetails {
  email: string;
  clinicName: string;
  expiresAt: string;
  hasPassword: boolean;
}

export interface SetPasswordInput {
  password: string;
  confirmPassword: string;
}

const resolveBaseUrl = (): string => {
  const base = process.env.NEXT_PUBLIC_VOONE_API_URL;

  if (!base) {
    throw new Error("NEXT_PUBLIC_VOONE_API_URL is not configured");
  }

  return base.replace(/\/$/, "");
};

async function passwordSetupFetch<T>(token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${resolveBaseUrl()}/v1/auth/password-setup/${encodeURIComponent(token)}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { code?: string; message?: string } | null;

    throw new ApiError(
      `Password setup request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
}

export function getPasswordSetupDetails(token: string) {
  return passwordSetupFetch<PasswordSetupDetails>(token, { method: "GET" });
}

export function setPasswordWithToken(token: string, input: SetPasswordInput) {
  return passwordSetupFetch<{ status: "ok" }>(token, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
