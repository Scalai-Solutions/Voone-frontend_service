import localFont from "next/font/local";

/**
 * The marketing site's own type: Inter for text, Playfair Display for headings. Served from the npm
 * packages like the app's fonts (the production builder cannot reach Google Fonts), and imported
 * only by the landing and its legal pages, so no dashboard page loads them.
 */
export const landingSans = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  variable: "--landing-font-sans",
  weight: "100 900",
  display: "swap",
});

export const landingSerif = localFont({
  src: "../../node_modules/@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2",
  variable: "--landing-font-serif",
  weight: "400 900",
  display: "swap",
});
