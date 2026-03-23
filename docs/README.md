# GIVE — Web Design Repository

Repositório colaborativo para **Design Systems**, **padrões de cor**, **componentes front-end**, **estilos** e **animações**. A interface web em `web/` carrega o catálogo versionado em [`data/catalog.json`](../data/catalog.json).

## Como executar localmente

O app precisa ser servido por HTTP (iframes e `fetch` não funcionam de forma confiável com `file://`).

Na pasta raiz do projeto `GIVE - WebDesignRepo/`:

```bash
npx --yes serve .
```

Abra no navegador a URL indicada (geralmente `http://localhost:3000/web/`).

Alternativas: extensão **Live Server** no VS Code/Cursor apontando para `web/index.html`, ou qualquer servidor estático na raiz do repositório.

## Estrutura

| Caminho | Descrição |
|---------|-----------|
| [`data/catalog.json`](../data/catalog.json) | Fonte da verdade do catálogo (itens, metadados, previews) |
| [`data/catalog.schema.json`](../data/catalog.schema.json) | JSON Schema para validação (import na UI e script `npm run validate`) |
| [`web/`](../web/) | SPA estática (HTML, CSS, JS) |
| [`docs/TAXONOMY.md`](TAXONOMY.md) | Tipos (`kind`), tags sugeridas e convenções |
| [`docs/CONTRIBUTING.md`](CONTRIBUTING.md) | Fluxo Git, PRs e boas práticas de edição |

## Colaboração

Alterações ao catálogo entram via **Git**: edite `data/catalog.json` no editor ou use a UI (import/export) e submeta um PR. Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Validar o catálogo (JSON Schema)

Na pasta raiz `GIVE - WebDesignRepo` (onde está o `package.json`):

```bash
npm install
npm run validate
```

O script confere `data/catalog.json` contra `data/catalog.schema.json`.
