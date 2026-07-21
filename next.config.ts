import type { NextConfig } from "next";

/**
 * Runtime de servidor ("motor") — branch feat/server-runtime.
 *
 * Trocamos de output:"export" (estático/nginx) para "standalone": o Next passa a
 * rodar como um servidor Node dentro de um container (Dockerfile na raiz), o que
 * DESTRAVA as ferramentas que precisam ler o site de um cliente pelo servidor
 * (auditoria 360, análise de landing page, SEO técnico, verificador de tags e de
 * links). Todas as ferramentas atuais continuam funcionando — as client-only
 * apenas passam a ser servidas por Node em vez de arquivos estáticos.
 *
 * IMPORTANTE (deploy no EasyPanel): esta mudança exige trocar o serviço de
 * "estático/nginx (pasta out/)" para build por Dockerfile expondo a porta 3000.
 * Por isso vive numa branch: main continua no ar em modo estático até virarmos
 * os dois juntos (código + configuração do EasyPanel). Reversível.
 */
const nextConfig: NextConfig = {
  output: "standalone",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
