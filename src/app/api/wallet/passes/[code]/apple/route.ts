const resolveBaseUrl = (): string => {
  const base = process.env.VOONE_API_URL ?? process.env.NEXT_PUBLIC_VOONE_API_URL;

  if (!base) {
    throw new Error("VOONE_API_URL or NEXT_PUBLIC_VOONE_API_URL must be configured");
  }

  return base.replace(/\/$/, "");
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const { code } = await context.params;
  const response = await fetch(
    `${resolveBaseUrl()}/v1/wallet/passes/${encodeURIComponent(code)}/apple.pkpass`,
    { cache: "no-store" },
  );
  const body = await response.arrayBuffer();

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("Content-Type") ?? "application/vnd.apple.pkpass",
      ...(response.headers.get("Content-Disposition")
        ? { "Content-Disposition": response.headers.get("Content-Disposition") as string }
        : {}),
    },
  });
}
