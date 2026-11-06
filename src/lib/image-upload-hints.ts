/**
 * What to tell a clinic before it picks a card image, per kind. The numbers are the wallets' own:
 * Apple draws the logo in a 160 × 50 pt box (480 × 150 px at 3×) and the strip behind the points at
 * 375 × 123 pt (1125 × 369 px at 3×); Google shows the logo in a circle and the hero at about 3:1.
 * The backend refuses what is below the minimums and answers with warnings for the rest.
 */
export const IMAGE_UPLOAD_HINTS = {
  logo: "PNG con fondo transparente, ideal 480×150 px (o 660×660 px). Mínimo 160 px. Hasta 5 MB.",
  logoOnDark:
    "PNG con fondo transparente y trazo claro, ideal 480×150 px (o 660×660 px). Mínimo 160 px. Hasta 5 MB.",
  hero: "JPG o PNG de 1125×369 px (proporción 3:1). Mínimo 750 px de ancho. Deja lo importante en el centro. Hasta 5 MB.",
} as const;
