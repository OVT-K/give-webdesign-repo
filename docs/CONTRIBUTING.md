# Contribuindo com o catálogo GIVE

## Fluxo recomendado (Git)

1. Crie uma branch a partir da principal: `feature/add-primary-button`.
2. Edite [`data/catalog.json`](../data/catalog.json) **ou** use a UI em `web/` (importar/exportar) e substitua o arquivo no repositório.
3. Valide localmente: `npm install` (na raiz `GIVE - WebDesignRepo`) e `npm run validate`.
4. Abra um **Pull Request** com descrição clara: o que foi adicionado/alterado e por quê.
5. Revise o **diff do JSON** — prefira PRs pequenos para reduzir conflitos de merge.

## Editar pela interface web

1. Sirva o projeto com HTTP (ver [README.md](README.md)).
2. Use **Importar JSON** para mesclar entradas de um arquivo validado pelo schema.
3. Use **Editar** em um card para ajustar metadados e **Exportar catálogo completo** para baixar o JSON atualizado.
4. Copie o arquivo baixado para `data/catalog.json` e faça commit.

## Boas práticas

- **IDs únicos**: não duplique `id`; import com substituição sobrescreve o existente com o mesmo `id`.
- **Paths de preview**: mantenha assets em `web/samples/` ou caminhos relativos coerentes com a pasta `web/`.
- **Acessibilidade**: para `preview.type === image`, preencha `alt` quando fizer sentido.
- **Datas**: use `updatedAt` em formato ISO (`YYYY-MM-DD`).

## Conflitos em `catalog.json`

Se dois PRs alteram o mesmo trecho, resolva manualmente mantendo ambos os conjuntos de `items` e validando com `npm run validate` após o merge.

## Validação

O schema está em [`data/catalog.schema.json`](../data/catalog.schema.json). O script `npm run validate` garante que o arquivo do catálogo está em conformidade antes do commit.
