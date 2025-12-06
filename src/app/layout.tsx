import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://alto-sobradinho.vercel.app'),
  title: "Alto Sobradinho - Disponibilidade",
  description: "Espelho de vendas dos empreendimentos Alto da Alvorada e Alto do Horizonte. Consulte em tempo real a disponibilidade de unidades, valores e status.",
  keywords: ["Alto Sobradinho", "Disponibilidade", "Vendas", "Imobiliário", "Alto da Alvorada", "Alto do Horizonte", "Next.js", "TypeScript", "React"],
  authors: [{ name: "Alto Sobradinho Team" }],
  icons: {
    icon: "/logo-qb.png",
  },
  openGraph: {
    title: "Alto Sobradinho - Disponibilidade",
    description: "Espelho de vendas em tempo real dos empreendimentos Alto da Alvorada e Alto do Horizonte",
    url: "https://alto-sobradinho.vercel.app",
    siteName: "Alto Sobradinho",
    type: "website",
    images: [
      {
        url: "/alto-sobradinho-share.jpg",
        width: 1024,
        height: 1024,
        alt: "Alto Sobradinho - Empreendimentos de Alto Padrão",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Alto Sobradinho - Disponibilidade",
    description: "Espelho de vendas em tempo real dos empreendimentos Alto da Alvorada e Alto do Horizonte",
    images: {
      url: "/alto-sobradinho-share.jpg",
      width: 1024,
      height: 1024,
      alt: "Alto Sobradinho - Empreendimentos de Alto Padrão",
    },
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
