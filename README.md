# Só Retro — Orçamentos e Recibos (PWA)

Aplicativo para **orçamento de peças**, **orçamento de serviços** (com peças e mão de obra no mesmo documento) e **recibos**, com **PDF real** compartilhável pela folha nativa do iPhone. Funciona **offline** e guarda tudo **só no aparelho** (IndexedDB). Sem servidor, sem login, sem custo.

## Rodar no computador

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:5173
npm test           # testes automatizados (cálculos, extenso, banco, backup, PDF, formulários)
npm run build      # gera a pasta dist/ (é ela que vai para a hospedagem)
npm run preview    # serve o build em http://localhost:4173
```

Requer Node 20+.

## Colocar no iPhone

1. Publique a pasta `dist/` em uma hospedagem HTTPS gratuita → [docs/HOSPEDAGEM.md](docs/HOSPEDAGEM.md)
2. Instale pelo Safari → [docs/IPHONE.md](docs/IPHONE.md)
3. Confira no aparelho → [docs/CHECKLIST-IPHONE.md](docs/CHECKLIST-IPHONE.md)

A hospedagem só é necessária para a **primeira abertura**. Depois de instalado, o app abre e funciona sem internet.

## Como usar (resumo)

- **+** (canto inferior direito): novo orçamento de peças, de serviços ou recibo.
- Em um documento: **Compartilhar PDF** (abre a folha do iOS: WhatsApp, Mail, AirDrop, Arquivos), Visualizar, Baixar, Imprimir.
- Orçamento **enviado** não é editado: use **Criar nova versão** (o original fica preservado).
- Recibo **emitido** não é editado: use **Substituir** ou **Cancelar** (ficam no histórico).
- Recibo parcial mostra recebido, total e saldo e **nunca** declara quitação nem altera o orçamento.

## Personalizar (sem mexer no código)

Tudo em **Config.**:

| O quê | Onde |
|---|---|
| Logo | Config. → Empresa → *Trocar logo* (PNG/JPG). *Usar logo padrão* volta à original. A logo padrão muda sozinha: escura no tema claro, branca no tema escuro (uma logo trocada por você é usada igual nos dois temas) |
| Dados da empresa, Pix, observações, validade padrão | Config. → Empresa / Padrões dos documentos |
| Numeração | Config. → Numeração: prefixo (ex. `ORC-S-`), número inicial e quantidade de dígitos |
| Tema | Config. → Tema (automático, claro ou escuro) |
| Mostrar custo da peça no PDF | Config. → Padrões (desligado por padrão; custo é sempre interno) |

Para trocar a logo **padrão** do projeto: substitua `assets-src/logo-original.png` e rode `node scripts/make-icons.mjs` (gera `public/logo.png` e os ícones do app).

## Backup (importante)

Os dados ficam só neste aparelho. Em **Config. → Backup e dados**:

- **Exportar backup**: gera `so-retro-backup-AAAA-MM-DD.json`. No iPhone abre a folha de compartilhamento → salve em **Arquivos/iCloud** ou envie a si mesmo.
- **Restaurar backup**: escolha o arquivo `.json`. Substitui todos os dados atuais (pede confirmação). Arquivos inválidos são recusados sem alterar nada.
- Para trocar de celular: exporte no antigo, instale o app no novo e restaure.
- O app avisa quando o último backup passou de 14 dias. **Faça backup com frequência.**

## Limitações

- **Sem sincronização** entre aparelhos: cada aparelho tem seus próprios dados (use o backup para mover).
- O Safari pode apagar dados de sites que ficam muito tempo sem uso. Instalado na **Tela de Início** e com armazenamento persistente (o app solicita) esse risco cai, mas o backup continua sendo a garantia.
- Offline funciona para tudo (criar, consultar, gerar PDF); como não há servidor, não há o que sincronizar.
- A folha de compartilhamento de arquivos depende do navegador: no Safari do iPhone funciona; em alguns navegadores de computador o app oferece Baixar/Visualizar/Imprimir.
- O PDF usa fonte padrão (Helvetica): acentos do português funcionam; emojis e símbolos fora do alfabeto latino viram `?`.

## Estrutura

```
src/domain   regras puras e testadas (dinheiro em centavos, totais, extenso, numeração, status, recibo parcial)
src/db       IndexedDB (clientes, peças, documentos, configurações, contadores)
src/backup   exportar/restaurar JSON validado
src/pdf      geração do PDF (A4) — só usa dados públicos (sem custo/observações internas)
src/share    compartilhar, baixar, visualizar, imprimir
src/pwa      armazenamento persistente e aviso de backup
src/ui       telas (início, orçamentos, recibos, clientes, configurações)
scripts      make-icons.mjs (logo e ícones)
```

Detalhes de projeto: `../docs/superpowers/specs/2026-10-13-so-retro-pwa-design.md`.
