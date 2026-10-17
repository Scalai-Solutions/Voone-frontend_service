import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/components/providers";
import { getCurrentSession, isAuthEnabled } from "@/lib/auth";
import "./globals.css";

// Served from the npm packages rather than fetched from Google at build time: the production
// builder could not reach Google Fonts and every deploy failed on it.
const geistSans = localFont({
  src: "../../node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../../node_modules/@fontsource-variable/geist-mono/files/geist-mono-latin-wght-normal.woff2",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const cormorant = localFont({
  src: [
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "Voone",
  description: "Fidelización Wallet para clínicas modernas",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await getCurrentSession();

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorant.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppProviders authEnabled={isAuthEnabled()} initialRole={session?.role ?? "owner"}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
