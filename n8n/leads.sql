-- ============================================================================
-- Tabela de leads (captura de e-mail / newsletter) do Marketing Hub.
-- Rode UMA vez no Supabase → SQL Editor (projeto bcpkwmzglbeguywsmdxm).
-- A chave PÚBLICA (publishable) só pode INSERIR — ninguém lê/edita por ela.
-- ============================================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  nome text,
  origem text,
  created_at timestamptz not null default now()
);

-- Evita e-mail duplicado.
create unique index if not exists leads_email_uidx on public.leads (email);

alter table public.leads enable row level security;

-- Permite SOMENTE inserir de forma anônima (o site usa a chave publishable).
-- Não há policy de select/update/delete: ninguém lê a lista pela chave pública.
drop policy if exists "anon insere lead" on public.leads;
create policy "anon insere lead"
  on public.leads for insert to anon
  with check (true);

-- Para VER os leads depois, use o painel do Supabase (Table Editor) ou o SQL
-- Editor (que usa a service role) — nunca pela chave pública do site.
-- select email, nome, origem, created_at from public.leads order by created_at desc;
