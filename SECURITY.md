# Segurança

## Chaves de API

### Chave do PageSpeed — pública por design

`lib/config.ts` contém a chave da API PageSpeed Insights **em texto claro, de propósito**.
A API é chamada direto do navegador do visitante, então qualquer chave usada nela é
visível — isso vale para qualquer site do mundo que use PageSpeed no cliente.

O que a torna segura não é escondê-la, e sim as restrições aplicadas no Google Cloud:

- **Restrição de referrer HTTP**: só aceita chamadas vindas de `hub.consiginvest.com`
- **Restrição de API**: habilitada **apenas** para o PageSpeed Insights
- **Sem faturamento** no projeto: a cota é gratuita e não gera cobrança

Verificado na prática: sem o referrer correto a chamada retorna **403**; em qualquer
outra API do Google retorna **REQUEST_DENIED**.

### Chave do Places — nunca no repositório

A chave do Google Places (que **tem** faturamento) vive exclusivamente na credencial do
n8n, no servidor. O navegador só conversa com o webhook:

```
POST https://n8n.vpsmozar.plusnetworks.com.br/webhook/gmb-analyze   { "link": "..." }
```

O workflow aplica **CORS restrito a `hub.consiginvest.com`**, **cache de 7 dias** e
**cota de 30 consultas/dia**. Assim, mesmo que alguém descubra a URL do webhook, não
consegue nem extrair a chave nem torrar o crédito.

## O que nunca versionar

- Chaves com faturamento ativo (Places, Maps, qualquer coisa que gere custo)
- Tokens de deploy do EasyPanel, credenciais do n8n, senhas de banco
- Qualquer arquivo `.env*` (já bloqueado no `.gitignore`)

Se uma chave vazar: revogar primeiro no Google Cloud, depois limpar o histórico.
Revogar é o que resolve — reescrever o histórico sozinho não, porque forks e caches já
copiaram o valor.

## Dados de usuário

O site **não tem cadastro, banco, cookie de rastreamento nem coleta de dados pessoais**.
Os arquivos processados pelos conversores não saem do navegador do visitante.

As duas exceções (e apenas o endereço público informado sai do dispositivo):

- a URL digitada na auditoria de velocidade vai para o Google PageSpeed;
- o link do Maps colado vai para o webhook n8n.

## Cabeçalhos HTTP

Definidos em `nginx.conf`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`

HTTPS com certificado Let's Encrypt gerenciado pelo EasyPanel. O DNS do subdomínio
`hub` fica em **DNS only** no Cloudflare (proxy desligado) — é o que permite a emissão
e a renovação automática do certificado.

## Dependências

As bibliotecas de conversão entram por CDN pública (cdnjs/jsDelivr) com versão fixa —
sem `latest`, para que uma atualização de terceiro não mude o comportamento do site sem
aviso. As URLs ficam centralizadas em `LIB`, dentro de `lib/config.ts`.

## Como reportar um problema

Fale com a Consig Invest pelo WhatsApp que aparece no topo do site. Não abra issue
pública para falha de segurança.
