import type { NextConfig } from "next";

/**
 * Runtime de servidor ("motor") — Fase B, ligada em 22/07/2026.
 *
 * De `output:"export"` (estático/nginx) para `"standalone"`: o Next roda como um
 * servidor Node dentro do container (Dockerfile na raiz), o que DESTRAVA as
 * ferramentas que precisam ler o site de um cliente pelo servidor (auditoria 360,
 * landing page, SEO técnico, verificador de tags/pixels e de links). Todas as
 * ferramentas atuais continuam iguais — as client-only apenas passam a ser
 * servidas por Node em vez de arquivos estáticos.
 *
 * O container escuta na PORTA 80 (mesma do nginx anterior), então a configuração
 * do serviço no EasyPanel não muda. Reversível: voltar output para "export" e o
 * Dockerfile para nginx.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
