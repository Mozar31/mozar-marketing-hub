import type { NextConfig } from "next";

/**
 * Checkpoints 1–3: exportação estática.
 * Motivo documentado em AUDIT.md §8 — todas as ferramentas destas fases são
 * local-first (client-side) ou consomem serviços externos já existentes, então
 * não há necessidade de runtime de servidor. Isso preserva a hospedagem atual
 * (nginx no EasyPanel) e mantém o deploy reversível.
 *
 * O Checkpoint 4 (Supabase/admin/notícias) exige autorização do cliente por
 * envolver custo recorrente; naquele momento troca-se para output: "standalone".
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: false },
};

export default nextConfig;
