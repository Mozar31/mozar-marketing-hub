# Consig Invest | Marketing Hub

Site estático de ferramentas de marketing digital para captação de leads da **Consig Invest Marketing Digital**. No ar em **https://hub.consiginvest.com**.

## Ferramentas

1. **Análise de Velocidade & SEO** — API pública do Google PageSpeed Insights (aceita URL com ou sem www/https; auto-retry em caso de fila)
2. **Análise da ficha do Google** — o visitante cola o link do Maps; links curtos (maps.app.goo.gl) são resolvidos por um webhook n8n; checklist guiado + dicas de SEO local
3. **Simulador de ROI de Tráfego Pago** — abas Google Ads (CPC) e Meta Ads (CPM)
4. **Conversores** (100% no navegador, sem upload): PDF→Word, Word→PDF, Imagem→PDF, PDF→JPG, Converter imagem (JPG/PNG/WebP), Comprimir imagem, Juntar PDFs, Dividir PDF, Excel↔CSV

## Stack

- HTML + CSS + JavaScript puro — sem framework, sem build step, sem backend próprio
- Bibliotecas de conversão via CDN (cdnjs), carregadas sob demanda: pdf.js, pdf-lib, mammoth, SheetJS, html2pdf
- Servido por `nginx:alpine` via Dockerfile
- Webhook auxiliar (resolver link curto do Maps): workflow `gmb-resolve` no n8n (`dinastia-n8n-webhook.u9dep8.easypanel.host/webhook/gmb-resolve`)

## Configuração

No topo de [app.js](app.js):

```js
const WHATSAPP = "5551983493659";   // número dos CTAs
const PAGESPEED_KEY = "";            // opcional: chave gratuita da API PageSpeed (aumenta o limite)
const GMB_RESOLVER = "https://...";  // webhook n8n que resolve links curtos do Maps
```

- **Logo**: `logo.png` (ícone redondo do header), `logo-full.png` (logo completa) e `og.png` (imagem de compartilhamento).

## Rodando localmente

Abra `index.html` no navegador. Com Docker:

```bash
docker build -t marketing-hub .
docker run -p 8080:80 marketing-hub
```

## Deploy (EasyPanel)

Serviço `marketing-hub` no projeto `mozar`. Após `git push`, clique em **Implantar** no painel ou chame a URL de gatilho (aba Implantações do serviço).
