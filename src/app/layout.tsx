import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import { AppProviders } from "@/components/providers";
import { getCurrentSession, isAuthEnabled } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
