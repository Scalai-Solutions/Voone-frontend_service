import localFont from "next/font/local";

/**
 * The club page's type: Bodoni Moda for headings, Hanken Grotesk for text. Served from the npm
 * packages like the app's other fonts (the production builder cannot reach Google Fonts, and a
 * member's phone should not call Google either), and imported only by the club page.
 */
export const clubDisplay = localFont({
  src: [
    {
      path: "../../../node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-wght-normal.woff2",
      style: "normal",
    },
    {
      path: "../../../node_modules/@fontsource-variable/bodoni-moda/files/bodoni-moda-latin-wght-italic.woff2",
      style: "italic",
    },
  ],
  variable: "--club-font-display",
  weight: "400 900",
  display: "swap",
});

export const clubSans = localFont({
  src: "../../../node_modules/@fontsource-variable/hanken-grotesk/files/hanken-grotesk-latin-wght-normal.woff2",
  variable: "--club-font-sans",
  weight: "100 900",
  display: "swap",
});
