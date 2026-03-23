# GIVE WebDesignRepo — Diretrizes de Arquitetura e IA

Este documento define as regras arquiteturais, a estética e os procedimentos operacionais padrão do repositório **GIVE - WebDesignRepo**. Qualquer modelo de Inteligência Artificial que interagir com esta base de código deve ler e aderir rigorosamente a estas diretrizes.

## 1. Identidade Visual e Estética (Premium UI & Creativity Engine)
- **O Conceito:** O projeto não é um painel SaaS tradicional, mas sim uma **Galeria de Arte Brutalista** interativa ("Living System"). O conteúdo (design systems, componentes) é a obra predefinida em exibição.
- **Paleta de Cores:** **Estritamente Dark Mode Monocromático**. Utilizar apenas pretos profundos (ex: `#050505`, `#0a0a0a`), cinzas, pratas e brancos puros (`#ffffff`).
- **PROIBIDO:** Usar laranjas, teals, azuis vibrantes ou gradientes coloridos na interface estrutural nativa.
- **Micro-interações:** Utilizar *Glassmorphism* (desfoque e transparência simulando vidro) e transições CSS refinadas (staggered fade-ins, hover magnético) conforme estipulado pelo "The Playful Serious".

## 2. Arquitetura de Software e Dados
- **Stack:** Vanilla Web (HTML, CSS em `web/styles.css`, JS em `web/app.js`). Sem frameworks pesados para garantir fluidez.
- **Banco de Dados (Catálogo):** O arquivo `data/catalog.json` é a fonte única da verdade (Single Source of Truth).
- **Validação:** Qualquer modificação no `catalog.json` DEVE ser acompanhada do comando `npm run validate` para rodar o script local e assegurar a integridade do JSON em relação ao schema.

## 3. Gestão e Ingestão de Modelos / Referências Locais
- **Armazenamento:** Todos os templates, design systems e referencias copiadas da web ou diretórios externos DEVEM ser salvos fisicamente em subpastas de `web/models/`.
- **Paths Relativos:** O arquivo `catalog.json` não deve conter caminhos absolutos atrelados à máquina de um usuário local (`file:///...`). Eles devem partir de referências diretas, por exemplo: `"src": "models/vibe_referencias/design systems/nome_do_modelo/index.html"`.
- **Desacoplamento de Assets Múltiplos:** Caso o modelo injetado contenha o site finalizado (`index.html`) e a sua biblioteca formal (`design-system.html`), eles devem ser indexados de forma binária e separada no `catalog.json`:
  1. A página do site (`index.html`) configurada como `kind: "component"`.
  2. O design system (`design-system.html`) configurado como `kind: "design-system"` adicionando ao seu título original a flag textual `" - Design System"`.
- **Git Safety:** Antes de adicionar novos modelos no GitHub, garanta que os sub-repositórios incorporados nestes templates percam as suas instâncias originárias removendo os eventuais diretórios `.git/` soltos na pasta. 

## 4. Manutenção de Estilos (`web/styles.css`)
- Priorize a organização através de variáveis CSS no escopo `:root`. 
- Atenção ao Lint: Sempre use a ordem recomendada de webkit em rules dependentes. Exemplo: `-webkit-backdrop-filter` deve ocorrer imediatamente antes de `backdrop-filter`. O `user-select` exige `-webkit-user-select` como fallback em navegadores Apple.
