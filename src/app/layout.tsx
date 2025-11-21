import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Espelhos de Venda - Alto do Horizonte e Alto da Alvorada",
  description: "Aplicativo web para visualização e gerenciamento de espelhos de venda dos empreendimentos Alto do Horizonte e Alto da Alvorada.",
  keywords: ["Espelhos de Venda", "Alto do Horizonte", "Alto da Alvorada", "Imobiliária", "Sobradinho"],
  authors: [{ name: "Felipe Santiago" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Espelhos de Venda - Alto do Horizonte e Alto da Alvorada",
    description: "Visualize e gerencie as unidades disponíveis nos empreendimentos Alto do Horizonte e Alto da Alvorada.",
    type: "website",
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
      </body>
    </html>
  );
}
