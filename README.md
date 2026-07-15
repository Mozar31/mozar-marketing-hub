# Mozar Marketing Hub

Site estático de ferramentas gratuitas de marketing digital para captação de leads da **Consig Invest Marketing Digital**.

## Ferramentas

1. **Análise de Velocidade & SEO** — via API pública do Google PageSpeed Insights (sem chave)
2. **Diagnóstico Google Meu Negócio** — quiz de 10 perguntas com pontuação
3. **Simulador de ROI de Tráfego Pago** — projeção de cliques, leads, vendas, CPA e ROAS
4. **Gerador de Título e Meta Description SEO** — por template, com contador de caracteres
5. **Conversor PDF → Word** — 100% no navegador (pdf.js), o arquivo não sai do computador do usuário

## Stack

- HTML + CSS + JavaScript puro — **sem framework, sem build step, sem backend, sem chave de API**
- Servido por `nginx:alpine` via Dockerfile

## Personalização

- **WhatsApp**: edite a constante no topo de [app.js](app.js):
  ```js
  const WHATSAPP = "5551999999999"; // 55 + DDD + número
  ```
- **Logo**: substitua o arquivo `logo.png` na raiz (aparece no header).

## Rodando localmente

Basta abrir `index.html` no navegador. Todas as ferramentas funcionam via `file://`, exceto a Ferramenta 1 (PageSpeed), que precisa de internet.

Com Docker:

```bash
docker build -t mozar-marketing-hub .
docker run -p 8080:80 mozar-marketing-hub
# abra http://localhost:8080
```

## Deploy no EasyPanel

1. Suba este repositório para o GitHub.
2. No EasyPanel, crie um novo serviço do tipo **App**.
3. Em **Source**, conecte o repositório GitHub (branch `main`).
4. Em **Build**, selecione **Dockerfile** (o EasyPanel detecta o `Dockerfile` na raiz).
5. Em **Domains**, adicione seu domínio e aponte para a **porta 80** do container.
6. Clique em **Deploy**.

Cada `git push` na branch configurada pode disparar um novo deploy (ative o auto-deploy no EasyPanel se desejar).
