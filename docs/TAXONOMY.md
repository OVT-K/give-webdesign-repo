# Taxonomia GIVE

## `kind` (tipo de entrada)

| Valor | Uso |
|-------|-----|
| `design-system` | Conjuntos de tokens, bibliotecas e fundamentos de produto |
| `color-palette` | Paletas e padrões de cor (use `swatches` com hex quando aplicável) |
| `component` | Componentes de UI (botões, formulários, etc.) |
| `animation` | Snippets de movimento, keyframes, referências de motion |
| `style` | Diretrizes de estilo (tipografia editorial, tom de voz visual, etc.) |

## `source` (origem)

| Valor | Significado |
|-------|-------------|
| `internal` | Material mantido pelo time / repositório |
| `external` | Referência externa (sites, libs de terceiros) |
| `community` | Contribuições ou exemplos da comunidade |

## `colors` (filtros macro)

IDs usados para chips de filtro e consistência com o hub de referência:

`dark`, `light`, `purple`, `blue`, `green`, `teal`, `orange`, `amber`, `neutral`, `glass`, `multicolor`

Novos tons podem ser adicionados à lista em `web/app.js` (`COLOR_FILTERS`) e documentados aqui.

## Tags sugeridas (não exaustivo)

### Visual

`minimal`, `dark-ui`, `light-ui`, `glassmorphism`, `editorial`, `luxury`, `gradient`

### Layout / padrão

`grid`, `bento-layout`, `cards`, `sidebar-layout`, `hero-full`

### Interação

`scroll-animations`, `microinteraction`, `hover-glow`, `accessible`, `focus-ring`

### Domínio

`saas`, `dashboard`, `fintech`, `portfolio`, `education`, `tokens`, `documentation`

### Técnico

`css`, `tailwind`, `react`, `storybook`, `figma`, `prefers-reduced-motion`

Prefira **kebab-case** e vocabulário estável para diffs legíveis em PRs.

## Previews (`preview`)

| `type` | Campos | Notas |
|--------|--------|-------|
| `iframe` | `src` | Caminho relativo à pasta `web/` (ex.: `samples/demo.html`) |
| `image` | `src`, `alt?` | PNG, SVG, etc. |
| `code` | `code`, `language?` | Exibido com realce de sintaxe (Prism) |

## Convenções de `id`

- Slug em minúsculas: `cmp-button-primary`, `palette-aurora`
- Estável no tempo (evite renomear; prefira novos IDs para novas versões)
