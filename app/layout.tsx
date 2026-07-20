import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { LegacyHashRedirect } from "@/components/LegacyHashRedirect";

export const SITE_URL = "https://hub.consiginvest.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Consig Invest | Marketing Hub — Ferramentas para crescer no Marketing Digital",
    template: "%s | Marketing Hub Consig Invest",
  },
  description:
    "Ferramentas para quem trabalha com marketing digital no Brasil: auditoria de velocidade e SEO, análise da ficha do Google, calculadoras de ROI e conversores de arquivos.",
  applicationName: "Marketing Hub Consig Invest",
  authors: [{ name: "Consig Invest Marketing Digital", url: "https://www.consiginvest.com/" }],
  creator: "Consig Invest Marketing Digital",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Consig Invest | Marketing Hub",
    title: "Consig Invest | Marketing Hub — Ferramentas para crescer no Marketing Digital",
    description:
      "Teste velocidade e SEO, analise sua ficha do Google, calcule ROI e converta arquivos direto no navegador.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Marketing Hub da Consig Invest" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Consig Invest | Marketing Hub",
    description: "Ferramentas para crescer no marketing digital, em português e sem enrolação.",
    images: ["/og.png"],
  },
  icons: { icon: "/logo.png", apple: "/logo.png" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#071225",
  width: "device-width",
  initialScale: 1,
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Consig Invest | Marketing Hub",
  url: SITE_URL,
  inLanguage: "pt-BR",
  publisher: {
    "@type": "Organization",
    name: "Consig Invest Marketing Digital",
    url: "https://www.consiginvest.com/",
    logo: `${SITE_URL}/logo.png`,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
      </head>
      <body>
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <LegacyHashRedirect />
        <Header />
        <main id="conteudo">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
