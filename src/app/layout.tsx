import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Espelho Alto Sobradinho",
  description: "Espelho comercial dos empreendimentos Alto da Alvorada e Alto do Horizonte. Consulte unidades disponíveis, valores e status em tempo real.",
  keywords: ["Espelho", "Alto Sobradinho", "Alto da Alvorada", "Alto do Horizonte", "Imóveis", "Empreendimentos", "Riva Incorporadora"],
  authors: [{ name: "Riva Incorporadora" }],
  icons: {
    icon: "/logo-qb.png",
  },
  openGraph: {
    title: "Espelho Alto Sobradinho",
    description: "Consulte em tempo real as unidades disponíveis nos empreendimentos Alto da Alvorada e Alto do Horizonte",
    url: "https://espelho-alto-sobradinho.vercel.app",
    siteName: "Espelho Alto Sobradinho",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Espelho Alto Sobradinho",
    description: "Espelho comercial dos empreendimentos Alto da Alvorada e Alto do Horizonte",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
