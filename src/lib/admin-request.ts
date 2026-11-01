import { ApiError } from "@/lib/api-client";

/**
 * A call from an admin screen to this app's own `/api/admin/...` route handlers (which hold
 * the staff key and check the admin session; the browser never talks to the backend).
 *
 * A failed call becomes an ApiError carrying the backend's `{code, message}` unchanged, so
 * a screen can show the message (409s from "apply" are written to be read by the admin).
 */
export async function adminRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;

    throw new ApiError(
      `Admin request failed: ${response.status}`,
      response.status,
      body?.code,
      body?.message,
    );
  }

  return response.json() as Promise<T>;
}

export const jsonBody = (body: unknown): RequestInit => ({
  body: JSON.stringify(body),
});
