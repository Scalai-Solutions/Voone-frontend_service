/** A single https address, or null. Google Wallet only makes https links tappable for us. */
export function parseLink(raw: string): string | null {
  const text = raw.trim();

  if (!text || /\s/.test(text)) return null;

  try {
    const url = new URL(text);

    return url.protocol === "https:" && url.hostname.includes(".") ? url.href : null;
  } catch {
    return null;
  }
}
