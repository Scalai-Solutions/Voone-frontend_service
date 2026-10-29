/**
 * Decides whether a wallet button may be shown for one provider.
 *
 * The backend reports `available: true` with a `url` only when that provider actually issued
 * the pass. If issuing failed it reports `available: false, url: null`; showing a button anyway
 * (for example by falling back to the Apple download route) sends the client to a 404 with no
 * card. So a button is shown only when both are present; otherwise the page shows its
 * "no está disponible" message.
 */
export interface WalletProviderPass {
  available: boolean;
  url: string | null;
}

export const resolveWalletInstallUrl = (
  pass: WalletProviderPass | null | undefined,
): string | null => (pass && pass.available && pass.url ? pass.url : null);
