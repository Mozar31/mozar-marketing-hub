-- ============================================================================
-- Fontes brasileiras de marketing para a página de Novidades do Hub.
-- Rode UMA vez no Supabase → SQL Editor (projeto bcpkwmzglbeguywsmdxm).
-- É idempotente: se rodar de novo, não duplica (checa feed_url).
--
-- Todas em português (idioma='pt') — o coletor já trata qualquer fonte por
-- domínio, então elas entram na próxima coleta das 07h sem mais nenhuma mudança.
-- Feeds validados em 21/07/2026 (retornam RSS com itens recentes).
-- ============================================================================

insert into news_sources (nome, fornecedor, feed_url, site_url, categoria, idioma, confianca, ativo)
select v.nome, v.fornecedor, v.feed_url, v.site_url, v.categoria, v.idioma, v.confianca, true
from (values
  ('Meio & Mensagem', 'Meio & Mensagem', 'https://www.meioemensagem.com.br/feed',        'https://www.meioemensagem.com.br/',      'marketing', 'pt', 'editorial'),
  ('Adnews',          'Adnews',          'https://adnews.com.br/feed/',                   'https://adnews.com.br/',                 'marketing', 'pt', 'editorial'),
  ('Update or Die',   'Update or Die',   'https://www.updateordie.com/feed/',             'https://www.updateordie.com/',           'marketing', 'pt', 'editorial'),
  ('Rock Content',    'Rock Content',    'https://rockcontent.com/br/blog/feed/',         'https://rockcontent.com/br/blog/',       'seo',       'pt', 'editorial'),
  ('Hostinger Tutoriais', 'Hostinger',   'https://www.hostinger.com.br/tutoriais/feed',   'https://www.hostinger.com.br/tutoriais', 'web',       'pt', 'editorial')
) as v(nome, fornecedor, feed_url, site_url, categoria, idioma, confianca)
where not exists (
  select 1 from news_sources s where s.feed_url = v.feed_url
);

-- Conferir o que ficou ativo:
-- select nome, categoria, idioma, ativo from news_sources order by idioma, nome;
