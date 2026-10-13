# Hospedagem HTTPS gratuita (só para instalar)

O iPhone só instala um PWA a partir de um endereço **HTTPS**. Você precisa de hospedagem **apenas para a primeira abertura**; depois o app roda offline no aparelho. O que for publicado é só o programa (arquivos da pasta `dist/`): **seus dados nunca vão para lá**.

> Eu (Claude) não publico nada na internet por conta própria. Os passos abaixo são para você fazer.

Antes de qualquer opção:

```bash
npm install
npm run build
```

O build usa caminhos relativos (`base: './'`), então funciona em qualquer subcaminho.

## Opção A — Cloudflare Pages (upload direto, sem Git)

1. Crie uma conta gratuita em <https://dash.cloudflare.com> → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Dê um nome ao projeto e arraste a pasta `dist/`.
3. Abra o endereço `https://SEU-PROJETO.pages.dev` no Safari do iPhone.

## Opção B — Netlify (arrastar e soltar)

1. Entre em <https://app.netlify.com/drop>.
2. Arraste a pasta `dist/`. Você recebe um endereço `https://….netlify.app`.

## Opção C — GitHub Pages

1. Crie um repositório no GitHub e envie o projeto.
2. Em *Settings → Pages*, escolha publicar via **GitHub Actions** (modelo "Static HTML/Vite") ou envie o conteúdo de `dist/` para a branch `gh-pages`.
3. O endereço será `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Privacidade do endereço

O endereço público não tem login. Qualquer pessoa com o link vê **o programa vazio** (sem seus dados). Se preferir, use um nome de projeto difícil de adivinhar.

## Atualizar o app depois

Gere um novo `npm run build` e publique `dist/` de novo. O app instalado se atualiza sozinho na próxima abertura com internet (os dados continuam no aparelho).
