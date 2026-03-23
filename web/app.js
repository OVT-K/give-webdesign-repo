/* GIVE — Web Design Repository (app) */
(function () {
  'use strict';

  /** Resolve catalog URL: serve repo root so ../data/catalog.json is beside /web/ */
  function catalogFetchUrl() {
    return new URL('../data/catalog.json', window.location.href).href;
  }

  const KIND_LABELS = {
    'design-system': 'Design System',
    'color-palette': 'Paleta',
    'component': 'Componente',
    'animation': 'Animação',
    'style': 'Estilo',
  };

  const KIND_CLASS = {
    'design-system': 'kb-ds',
    'color-palette': 'kb-pal',
    'component': 'kb-comp',
    'animation': 'kb-anim',
    'style': 'kb-style',
  };

  const SOURCE_LABELS = {
    internal: 'Interna',
    external: 'Externa',
    community: 'Comunidade',
  };

  const COLOR_FILTERS = [
    { id: 'dark', label: 'Dark', hex: '#1a1a2e' },
    { id: 'light', label: 'Light', hex: '#f0f4f8' },
    { id: 'purple', label: 'Purple', hex: '#7c3aed' },
    { id: 'blue', label: 'Blue', hex: '#2563eb' },
    { id: 'green', label: 'Green', hex: '#16a34a' },
    { id: 'teal', label: 'Teal', hex: '#14b8a6' },
    { id: 'orange', label: 'Orange', hex: '#ea580c' },
    { id: 'amber', label: 'Amber', hex: '#f59e0b' },
    { id: 'neutral', label: 'Neutral', hex: '#6b7280' },
    { id: 'glass', label: 'Glass', hex: 'rgba(255,255,255,0.15)', isGlass: true },
    { id: 'multicolor', label: 'Multi', hex: 'conic-gradient(red,orange,yellow,green,blue,violet,red)', isGradient: true },
  ];

  function colorStyle(colorId) {
    const c = COLOR_FILTERS.find((x) => x.id === colorId);
    if (!c) return 'background:#444;';
    if (c.isGlass) return 'background:rgba(200,200,255,0.2);border:1px solid rgba(255,255,255,0.3);';
    if (c.isGradient) return 'background:conic-gradient(red,orange,yellow,green,blue,violet,red);';
    return `background:${c.hex};`;
  }

  function resolveAssetUrl(src) {
    if (!src) return '';
    if (/^https?:\/\//i.test(src)) return src;
    return new URL(src, window.location.href).href;
  }

  const state = {
    search: '',
    kind: 'all',
    source: 'all',
    selectedTags: new Set(),
    selectedColors: new Set(),
    viewMode: 'grid',
    tagAny: false,
  };

  let catalogVersion = '1';
  /** @type {Array<Object>} */
  let items = [];

  let editingId = null;
  let editingIsNew = false;

  const gridEl = document.getElementById('give-grid');
  const searchInput = document.getElementById('search-input');
  const kindChipsEl = document.getElementById('kind-chips');
  const colorChipsEl = document.getElementById('color-chips-row');
  const tagChipsEl = document.getElementById('tag-chips-row');
  const resultsEl = document.getElementById('results-count');
  const statFiltered = document.getElementById('stat-filtered');
  const statTotal = document.getElementById('stat-total');
  const footerCount = document.getElementById('footer-count');
  const btnClear = document.getElementById('btn-clear');
  const viewGrid = document.getElementById('view-grid');
  const viewList = document.getElementById('view-list');
  const tagModeAny = document.getElementById('tag-mode-any');
  const importFile = document.getElementById('import-file');
  const importMergeMode = document.getElementById('import-merge-mode');
  const importStatus = document.getElementById('import-status');
  const btnExportFull = document.getElementById('btn-export-full');
  const btnExportFiltered = document.getElementById('btn-export-filtered');
  const btnSaveFs = document.getElementById('btn-save-fs');
  const btnNewEntry = document.getElementById('btn-new-entry');

  const modalOverlay = document.getElementById('modal-overlay');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalOpenLink = document.getElementById('modal-open-link');
  const modalClose = document.getElementById('modal-close');
  const modalIframeWrap = document.getElementById('modal-iframe-wrap');

  const editOverlay = document.getElementById('edit-overlay');
  const editForm = document.getElementById('edit-form');
  const editClose = document.getElementById('edit-close');
  const editCancel = document.getElementById('edit-cancel');
  const editSave = document.getElementById('edit-save');

  const KIND_ORDER = ['all', 'design-system', 'color-palette', 'component', 'animation', 'style'];

  function validateItem(it, i) {
    const errs = [];
    const prefix = typeof i === 'number' ? `items[${i}]` : 'item';
    if (!it || typeof it !== 'object') return [`${prefix}: objeto inválido`];
    if (!it.id || typeof it.id !== 'string') errs.push(`${prefix}.id obrigatório`);
    if (!it.name) errs.push(`${prefix}.name obrigatório`);
    if (!it.nameEn) errs.push(`${prefix}.nameEn obrigatório`);
    if (!KIND_LABELS[it.kind]) errs.push(`${prefix}.kind inválido`);
    if (!it.preview || !it.preview.type) errs.push(`${prefix}.preview.type obrigatório`);
    else {
      const p = it.preview;
      if (p.type === 'iframe' || p.type === 'image') {
        if (!p.src) errs.push(`${prefix}.preview.src obrigatório para ${p.type}`);
      }
      if (p.type === 'code' && (p.code == null || p.code === '')) {
        errs.push(`${prefix}.preview.code obrigatório para code`);
      }
    }
    if (!Array.isArray(it.tags)) errs.push(`${prefix}.tags deve ser array`);
    if (!Array.isArray(it.colors)) errs.push(`${prefix}.colors deve ser array`);
    if (!['internal', 'external', 'community'].includes(it.source)) errs.push(`${prefix}.source inválido`);
    return errs;
  }

  function validateCatalog(data) {
    const errs = [];
    if (!data || typeof data !== 'object') return ['Raiz inválida'];
    if (!data.version) errs.push('version obrigatória');
    if (!Array.isArray(data.items)) errs.push('items deve ser array');
    else data.items.forEach((it, i) => validateItem(it, i).forEach((e) => errs.push(e)));
    return errs;
  }

  function buildCatalogObject() {
    return { version: catalogVersion, items: items.slice() };
  }

  function downloadJson(filename, obj) {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  function mergeImported(incoming, mode) {
    const byId = new Map(items.map((x) => [x.id, x]));
    const incomingItems = incoming.items || [];
    let added = 0;
    let replaced = 0;
    let skipped = 0;

    for (const it of incomingItems) {
      const err = validateItem(it, -1);
      if (err.length) throw new Error(err.join('; '));

      if (byId.has(it.id)) {
        if (mode === 'replace') {
          const idx = items.findIndex((x) => x.id === it.id);
          if (idx >= 0) {
            items[idx] = it;
            replaced++;
          }
        } else skipped++;
      } else {
        items.push(it);
        byId.set(it.id, it);
        added++;
      }
    }

    if (incoming.version) catalogVersion = String(incoming.version);

    return { added, replaced, skipped };
  }

  function filterModels() {
    return items.filter((m) => {
      if (state.kind !== 'all' && m.kind !== state.kind) return false;
      if (state.source !== 'all' && m.source !== state.source) return false;

      if (state.selectedColors.size > 0) {
        if (![...state.selectedColors].some((c) => m.colors.includes(c))) return false;
      }

      if (state.selectedTags.size > 0) {
        const tags = m.tags || [];
        if (state.tagAny) {
          if (![...state.selectedTags].some((t) => tags.includes(t))) return false;
        } else {
          if (![...state.selectedTags].every((t) => tags.includes(t))) return false;
        }
      }

      if (state.search) {
        const q = state.search;
        const hay = [
          m.name,
          m.nameEn,
          m.kind,
          m.highlight,
          m.highlightEn,
          ...(m.tags || []),
          ...(m.tech || []),
          ...(m.framework || []),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderCard(m) {
    const kindClass = KIND_CLASS[m.kind] || 'kb-comp';
    const kindLabel = KIND_LABELS[m.kind] || m.kind;
    const srcBadge = m.source || 'internal';

    const colorDots = (m.colors || []).slice(0, 5).map((c) => {
      const found = COLOR_FILTERS.find((f) => f.id === c);
      return `<span class="card-color-dot" style="${colorStyle(c)}" title="${found ? escHtml(found.label) : escHtml(c)}"></span>`;
    }).join('');

    const tags = (m.tags || []).slice(0, 8).map((t) => `<span class="card-tag" data-tag="${escHtml(t)}">${escHtml(t)}</span>`).join('');

    const swatches = Array.isArray(m.swatches)
      ? m.swatches
          .slice(0, 12)
          .map((s) => `<span class="card-swatch" style="background:${escHtml(s.hex)}" title="${escHtml(s.label || s.hex)}"></span>`)
          .join('')
      : '';

    let previewInner = '';
    const pv = m.preview || {};

    if (pv.type === 'iframe' && pv.src) {
      const url = resolveAssetUrl(pv.src);
      previewInner = `
        <iframe src="${escHtml(url)}" loading="lazy" title="Preview: ${escHtml(m.name)}" tabindex="-1" sandbox="allow-scripts allow-same-origin"></iframe>
        <div class="card-preview-overlay"></div>`;
    } else if (pv.type === 'image' && pv.src) {
      const url = resolveAssetUrl(pv.src);
      previewInner = `<img class="card-preview-img" src="${escHtml(url)}" alt="${escHtml(pv.alt || m.name)}" loading="lazy" />`;
    } else if (pv.type === 'code') {
      const code = (pv.code || '').slice(0, 1200);
      previewInner = `<div class="card-preview-code"><pre>${escHtml(code)}${pv.code && pv.code.length > 1200 ? '\n…' : ''}</pre></div>`;
    } else {
      previewInner = `<div class="card-preview-code"><pre>${escHtml('Preview inválido')}</pre></div>`;
    }

    let paletteStrip = '';
    if (m.kind === 'color-palette' && m.swatches && m.swatches.length) {
      paletteStrip = `<div class="card-preview-palette" aria-hidden="true">${m.swatches
        .map((s) => `<div class="sw" style="background:${escHtml(s.hex)}"></div>`)
        .join('')}</div>`;
    }

    const previewBlock =
      m.kind === 'color-palette' && paletteStrip
        ? paletteStrip
        : `<div class="card-preview-inner">${previewInner}</div>`;

    const openHref = pv.type === 'iframe' && pv.src ? resolveAssetUrl(pv.src) : pv.type === 'image' && pv.src ? resolveAssetUrl(pv.src) : '#';

    return `
      <article class="model-card" data-id="${escHtml(m.id)}">
        <div class="card-preview">
          <span class="source-badge ${escHtml(srcBadge)}">${escHtml(SOURCE_LABELS[srcBadge] || srcBadge)}</span>
          ${previewBlock}
          <div class="card-preview-actions">
            <button type="button" class="btn-preview" data-id="${escHtml(m.id)}">Preview</button>
            ${
              pv.type === 'iframe' && pv.src
                ? `<a class="btn-open" href="${escHtml(openHref)}" target="_blank" rel="noopener">Abrir</a>`
                : pv.type === 'image' && pv.src
                  ? `<a class="btn-open" href="${escHtml(openHref)}" target="_blank" rel="noopener">Abrir</a>`
                  : ''
            }
            <button type="button" class="btn-edit" data-edit="${escHtml(m.id)}">Editar</button>
          </div>
        </div>
        <div class="card-body">
          <div class="card-header">
            <div>
              <div class="card-name">${escHtml(m.name)}</div>
              <span class="card-name-en">${escHtml(m.nameEn)}</span>
            </div>
            <span class="kind-badge ${kindClass}">${escHtml(kindLabel)}</span>
          </div>
          ${m.highlight ? `<div class="card-highlight">${escHtml(m.highlight)}${m.highlightEn ? `<div class="card-highlight-en">${escHtml(m.highlightEn)}</div>` : ''}</div>` : ''}
          <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap;">
            <div class="card-colors">${colorDots}</div>
            <span class="card-color-label">${escHtml((m.colors || []).join(' · '))}</span>
          </div>
          ${swatches ? `<div class="card-swatches" title="Swatches">${swatches}</div>` : ''}
          <div class="card-tags">${tags}</div>
        </div>
      </article>`;
  }

  function updatePreviewScales() {
    document.querySelectorAll('.card-preview').forEach((wrap) => {
      const iframe = wrap.querySelector('.card-preview-inner iframe');
      if (!iframe) return;
      const w = wrap.offsetWidth || 340;
      wrap.style.setProperty('--preview-scale', (w / 1440).toFixed(4));
    });
  }

  function render() {
    const filtered = filterModels();

    resultsEl.innerHTML = `Mostrando <strong>${filtered.length}</strong> de <strong>${items.length}</strong> itens`;
    statFiltered.textContent = filtered.length;
    statTotal.textContent = items.length;
    footerCount.textContent = items.length;

    const hasFilters =
      state.search ||
      state.kind !== 'all' ||
      state.source !== 'all' ||
      state.selectedTags.size > 0 ||
      state.selectedColors.size > 0;
    btnClear.classList.toggle('hidden', !hasFilters);

    if (filtered.length === 0) {
      gridEl.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p>Nenhum item encontrado.</p>
          <small>Ajuste filtros ou importe novas entradas.</small>
        </div>`;
      return;
    }

    gridEl.innerHTML = filtered.map((m) => renderCard(m)).join('');
    requestAnimationFrame(updatePreviewScales);
  }

  function initFilterChips() {
    kindChipsEl.innerHTML = KIND_ORDER.map((k) =>
      k === 'all'
        ? `<button type="button" class="chip ${state.kind === 'all' ? 'active' : ''}" data-kind="all">Todos</button>`
        : `<button type="button" class="chip ${state.kind === k ? 'active' : ''}" data-kind="${k}">${KIND_LABELS[k]}</button>`
    ).join('');

    colorChipsEl.innerHTML =
      `<span class="filter-label">Cores</span>` +
      COLOR_FILTERS.map(
        (c) =>
          `<button type="button" class="color-chip" data-color="${c.id}" title="${escHtml(c.label)}">
          <span class="color-dot" style="${colorStyle(c.id)}"></span>${escHtml(c.label)}
        </button>`
      ).join('');

    const tagFreq = {};
    items.forEach((m) => (m.tags || []).forEach((t) => (tagFreq[t] = (tagFreq[t] || 0) + 1)));
    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 32)
      .map(([t]) => t);

    tagChipsEl.innerHTML =
      `<span class="filter-label">Tags</span>` +
      topTags.map((t) => `<button type="button" class="chip chip-tag" data-tag="${escHtml(t)}">${escHtml(t)}</button>`).join('');
  }

  function setKind(kind) {
    state.kind = kind;
    kindChipsEl.querySelectorAll('[data-kind]').forEach((b) => b.classList.toggle('active', b.dataset.kind === kind));
    document.querySelectorAll('.lib-chip').forEach((b) => {
      const fk = b.dataset.kindFilter;
      b.classList.toggle('active', fk === 'all' ? kind === 'all' : fk === kind);
    });
    render();
    persistState();
  }

  function openPreviewModal(id) {
    const m = items.find((x) => x.id === id);
    if (!m) return;

    modalTitle.textContent = m.name;
    modalSubtitle.textContent = `${KIND_LABELS[m.kind] || m.kind} · ${SOURCE_LABELS[m.source] || m.source}`;
    modalIframeWrap.innerHTML =
      '<div class="modal-loading"><div class="spinner"></div></div>';

    const pv = m.preview || {};
    modalOpenLink.hidden = true;

    const loadingEl = modalIframeWrap.querySelector('.modal-loading');

    if (pv.type === 'iframe' && pv.src) {
      const url = resolveAssetUrl(pv.src);
      modalOpenLink.href = url;
      modalOpenLink.hidden = false;
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      iframe.style.cssText = 'width:100%;height:100%;border:none;';
      iframe.onload = () => {
        if (loadingEl) loadingEl.remove();
      };
      modalIframeWrap.appendChild(iframe);
    } else if (pv.type === 'image' && pv.src) {
      const url = resolveAssetUrl(pv.src);
      modalOpenLink.href = url;
      modalOpenLink.hidden = false;
      modalIframeWrap.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'modal-img-wrap';
      const img = document.createElement('img');
      img.src = url;
      img.alt = pv.alt || m.name;
      wrap.appendChild(img);
      modalIframeWrap.appendChild(wrap);
    } else if (pv.type === 'code') {
      modalIframeWrap.innerHTML = '';
      const wrap = document.createElement('div');
      wrap.className = 'modal-code-wrap';
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      const lang = pv.language || 'css';
      code.className = `language-${lang}`;
      code.textContent = pv.code || '';
      pre.appendChild(code);
      wrap.appendChild(pre);
      modalIframeWrap.appendChild(wrap);
      if (window.Prism) Prism.highlightElement(code);
    } else {
      modalIframeWrap.innerHTML = '<p style="padding:1rem;color:var(--text-muted)">Sem preview disponível.</p>';
    }

    modalOverlay.removeAttribute('hidden');
    modalOverlay.classList.add('open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closePreviewModal() {
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('hidden', '');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    modalIframeWrap.innerHTML = '<div class="modal-loading"><div class="spinner"></div></div>';
  }

  function parseList(str) {
    return str
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function parseSwatches(str) {
    const lines = str.split('\n').map((l) => l.trim()).filter(Boolean);
    const out = [];
    for (const line of lines) {
      const parts = line.split(/\s+/);
      const hex = parts[0];
      if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(hex)) continue;
      const label = parts.slice(1).join(' ') || hex;
      out.push({ hex, label });
    }
    return out;
  }

  function openEditModal(id, isNew) {
    editingIsNew = !!isNew;
    editingId = id;
    const m = isNew
      ? {
          id: '',
          name: '',
          nameEn: '',
          kind: 'component',
          preview: { type: 'iframe', src: 'samples/demo.html' },
          tags: [],
          colors: ['neutral'],
          swatches: [],
          framework: [],
          tech: [],
          source: 'internal',
          links: {},
          highlight: '',
          highlightEn: '',
          updatedAt: new Date().toISOString().slice(0, 10),
          author: '',
        }
      : items.find((x) => x.id === id);

    if (!m) return;

    const links = m.links || {};
    editForm.innerHTML = `
      <div class="edit-row two">
        <div><label for="ef-id">ID</label><input id="ef-id" type="text" value="${escHtml(m.id)}" ${isNew ? '' : 'readonly'} /></div>
        <div><label for="ef-kind">Tipo (kind)</label>
          <select id="ef-kind">
            ${Object.keys(KIND_LABELS)
              .map((k) => `<option value="${k}" ${m.kind === k ? 'selected' : ''}>${KIND_LABELS[k]}</option>`)
              .join('')}
          </select>
        </div>
      </div>
      <div class="edit-row two">
        <div><label for="ef-name">Nome</label><input id="ef-name" type="text" value="${escHtml(m.name)}" /></div>
        <div><label for="ef-name-en">Nome (EN)</label><input id="ef-name-en" type="text" value="${escHtml(m.nameEn)}" /></div>
      </div>
      <div class="edit-row">
        <label for="ef-source">Origem</label>
        <select id="ef-source">
          <option value="internal" ${m.source === 'internal' ? 'selected' : ''}>Interna</option>
          <option value="external" ${m.source === 'external' ? 'selected' : ''}>Externa</option>
          <option value="community" ${m.source === 'community' ? 'selected' : ''}>Comunidade</option>
        </select>
      </div>
      <div class="edit-row">
        <label for="ef-preview-type">Preview type</label>
        <select id="ef-preview-type">
          <option value="iframe" ${m.preview?.type === 'iframe' ? 'selected' : ''}>iframe</option>
          <option value="image" ${m.preview?.type === 'image' ? 'selected' : ''}>image</option>
          <option value="code" ${m.preview?.type === 'code' ? 'selected' : ''}>code</option>
        </select>
      </div>
      <div class="edit-row">
        <label for="ef-preview-src">Preview src (iframe/image)</label>
        <input id="ef-preview-src" type="text" value="${escHtml(m.preview?.src || '')}" placeholder="samples/demo.html" />
      </div>
      <div class="edit-row">
        <label for="ef-preview-code">Preview code (type code)</label>
        <textarea id="ef-preview-code" placeholder="CSS/JS/HTML">${escHtml(m.preview?.code || '')}</textarea>
      </div>
      <div class="edit-row">
        <label for="ef-preview-lang">Linguagem (code)</label>
        <input id="ef-preview-lang" type="text" value="${escHtml(m.preview?.language || 'css')}" placeholder="css" />
      </div>
      <div class="edit-row">
        <label for="ef-tags">Tags (vírgula ou linha)</label>
        <textarea id="ef-tags">${escHtml((m.tags || []).join(', '))}</textarea>
      </div>
      <div class="edit-row">
        <label for="ef-colors">Cores macro (vírgula)</label>
        <input id="ef-colors" type="text" value="${escHtml((m.colors || []).join(', '))}" />
      </div>
      <div class="edit-row">
        <label for="ef-swatches">Swatches (uma por linha: #hex rótulo)</label>
        <textarea id="ef-swatches" rows="4">${escHtml(
          (m.swatches || []).map((s) => `${s.hex} ${s.label || ''}`.trim()).join('\n')
        )}</textarea>
      </div>
      <div class="edit-row two">
        <div><label for="ef-tech">Tech (vírgula)</label><input id="ef-tech" type="text" value="${escHtml((m.tech || []).join(', '))}" /></div>
        <div><label for="ef-fw">Framework (vírgula)</label><input id="ef-fw" type="text" value="${escHtml((m.framework || []).join(', '))}" /></div>
      </div>
      <div class="edit-row">
        <label for="ef-highlight">Destaque</label>
        <textarea id="ef-highlight">${escHtml(m.highlight || '')}</textarea>
      </div>
      <div class="edit-row">
        <label for="ef-highlight-en">Destaque (EN)</label>
        <textarea id="ef-highlight-en">${escHtml(m.highlightEn || '')}</textarea>
      </div>
      <div class="edit-row two">
        <div><label for="ef-author">Autor</label><input id="ef-author" type="text" value="${escHtml(m.author || '')}" /></div>
        <div><label for="ef-updated">updatedAt</label><input id="ef-updated" type="text" value="${escHtml(m.updatedAt || '')}" /></div>
      </div>
      <div class="edit-row two">
        <div><label for="ef-link-figma">Link Figma</label><input id="ef-link-figma" type="text" value="${escHtml(links.figma || '')}" /></div>
        <div><label for="ef-link-docs">Link docs</label><input id="ef-link-docs" type="text" value="${escHtml(links.docs || '')}" /></div>
      </div>
    `;

    editOverlay.removeAttribute('hidden');
    editOverlay.classList.add('open');
    editOverlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeEditModal() {
    editOverlay.classList.remove('open');
    editOverlay.setAttribute('hidden', '');
    editOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    editingId = null;
  }

  function readEditForm() {
    const id = document.getElementById('ef-id').value.trim();
    const kind = document.getElementById('ef-kind').value;
    const name = document.getElementById('ef-name').value.trim();
    const nameEn = document.getElementById('ef-name-en').value.trim();
    const source = document.getElementById('ef-source').value;
    const pType = document.getElementById('ef-preview-type').value;
    const src = document.getElementById('ef-preview-src').value.trim();
    const code = document.getElementById('ef-preview-code').value;
    const language = document.getElementById('ef-preview-lang').value.trim() || 'css';
    const tags = parseList(document.getElementById('ef-tags').value);
    const colors = parseList(document.getElementById('ef-colors').value);
    const swatches = parseSwatches(document.getElementById('ef-swatches').value);
    const tech = parseList(document.getElementById('ef-tech').value);
    const framework = parseList(document.getElementById('ef-fw').value);
    const highlight = document.getElementById('ef-highlight').value.trim();
    const highlightEn = document.getElementById('ef-highlight-en').value.trim();
    const author = document.getElementById('ef-author').value.trim();
    const updatedAt = document.getElementById('ef-updated').value.trim();
    const figma = document.getElementById('ef-link-figma').value.trim();
    const docs = document.getElementById('ef-link-docs').value.trim();

    const preview = { type: pType };
    if (pType === 'iframe' || pType === 'image') {
      preview.src = src;
      if (pType === 'image') preview.alt = name;
    }
    if (pType === 'code') {
      preview.code = code;
      preview.language = language;
    }

    const links = {};
    if (figma) links.figma = figma;
    if (docs) links.docs = docs;

    const item = {
      id,
      name,
      nameEn,
      kind,
      preview,
      tags,
      colors,
      source,
      tech,
      framework,
      highlight: highlight || undefined,
      highlightEn: highlightEn || undefined,
      author: author || undefined,
      updatedAt: updatedAt || undefined,
      links: Object.keys(links).length ? links : undefined,
    };
    if (swatches.length) item.swatches = swatches;

    return item;
  }

  function applyEdit() {
    let item;
    try {
      item = readEditForm();
    } catch (e) {
      importStatus.textContent = 'Erro ao ler formulário.';
      importStatus.className = 'give-status error';
      return;
    }

    const errs = validateItem(item, 0);
    if (errs.length) {
      importStatus.textContent = errs.join(' · ');
      importStatus.className = 'give-status error';
      return;
    }

    if (editingIsNew) {
      if (items.some((x) => x.id === item.id)) {
        importStatus.textContent = 'ID já existe.';
        importStatus.className = 'give-status error';
        return;
      }
      items.push(item);
    } else {
      const idx = items.findIndex((x) => x.id === editingId);
      if (idx < 0) return;
      if (item.id !== editingId && items.some((x) => x.id === item.id)) {
        importStatus.textContent = 'ID já em uso.';
        importStatus.className = 'give-status error';
        return;
      }
      items[idx] = item;
    }

    closeEditModal();
    initFilterChips();
    bindFilterClicks();
    render();
    importStatus.textContent = 'Entrada aplicada. Exporte o catálogo para salvar em disco/Git.';
    importStatus.className = 'give-status ok';
    persistState();
  }

  function bindFilterClicks() {
    kindChipsEl.querySelectorAll('[data-kind]').forEach((btn) => {
      btn.onclick = () => {
        setKind(btn.dataset.kind);
      };
    });

    document.querySelectorAll('[data-source]').forEach((btn) => {
      btn.onclick = () => {
        state.source = btn.dataset.source;
        document.querySelectorAll('[data-source]').forEach((b) => b.classList.toggle('active', b === btn));
        render();
        persistState();
      };
    });

    colorChipsEl.querySelectorAll('[data-color]').forEach((btn) => {
      btn.onclick = () => {
        const id = btn.dataset.color;
        if (state.selectedColors.has(id)) {
          state.selectedColors.delete(id);
          btn.classList.remove('active');
        } else {
          state.selectedColors.add(id);
          btn.classList.add('active');
        }
        render();
        persistState();
      };
    });

    tagChipsEl.querySelectorAll('[data-tag]').forEach((btn) => {
      btn.onclick = () => {
        const t = btn.dataset.tag;
        if (state.selectedTags.has(t)) state.selectedTags.delete(t);
        else state.selectedTags.add(t);
        tagChipsEl.querySelectorAll('[data-tag]').forEach((b) =>
          b.classList.toggle('active', state.selectedTags.has(b.dataset.tag))
        );
        render();
        persistState();
      };
    });
  }

  function toggleTagFromCard(tag) {
    if (state.selectedTags.has(tag)) state.selectedTags.delete(tag);
    else state.selectedTags.add(tag);
    initFilterChips();
    bindFilterClicks();
    tagChipsEl.querySelectorAll('[data-tag]').forEach((b) =>
      b.classList.toggle('active', state.selectedTags.has(b.dataset.tag))
    );
    render();
    persistState();
  }

  function clearFilters() {
    state.search = '';
    state.kind = 'all';
    state.source = 'all';
    state.selectedTags.clear();
    state.selectedColors.clear();
    state.tagAny = false;
    searchInput.value = '';
    tagModeAny.checked = false;
    initFilterChips();
    bindFilterClicks();
    document.querySelectorAll('[data-source]').forEach((b) => b.classList.toggle('active', b.dataset.source === 'all'));
    document.querySelectorAll('.lib-chip').forEach((b) => b.classList.toggle('active', b.dataset.kindFilter === 'all'));
    render();
    persistState();
  }

  function setView(mode) {
    state.viewMode = mode;
    gridEl.classList.toggle('list-mode', mode === 'list');
    viewGrid.classList.toggle('active', mode === 'grid');
    viewList.classList.toggle('active', mode === 'list');
    persistState();
    requestAnimationFrame(updatePreviewScales);
  }

  function persistState() {
    try {
      localStorage.setItem(
        'give-web-repo-state',
        JSON.stringify({
          search: state.search,
          kind: state.kind,
          source: state.source,
          tags: [...state.selectedTags],
          colors: [...state.selectedColors],
          viewMode: state.viewMode,
          tagAny: state.tagAny,
        })
      );
    } catch (_) {}
  }

  function restoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem('give-web-repo-state') || 'null');
      if (!saved) return;
      if (saved.search) {
        state.search = saved.search;
        searchInput.value = saved.search;
      }
      if (saved.kind) state.kind = saved.kind;
      if (saved.source) state.source = saved.source;
      if (typeof saved.tagAny === 'boolean') {
        state.tagAny = saved.tagAny;
        tagModeAny.checked = saved.tagAny;
      }
      if (Array.isArray(saved.tags)) saved.tags.forEach((t) => state.selectedTags.add(t));
      if (Array.isArray(saved.colors)) saved.colors.forEach((c) => state.selectedColors.add(c));
      if (saved.viewMode) state.viewMode = saved.viewMode;
    } catch (_) {}
  }

  function wireEvents() {
    searchInput.addEventListener('input', (e) => {
      state.search = e.target.value.trim().toLowerCase();
      render();
      persistState();
    });

    tagModeAny.addEventListener('change', () => {
      state.tagAny = tagModeAny.checked;
      render();
      persistState();
    });

    btnClear.addEventListener('click', clearFilters);
    viewGrid.addEventListener('click', () => setView('grid'));
    viewList.addEventListener('click', () => setView('list'));

    document.querySelectorAll('.lib-chip').forEach((b) => {
      b.addEventListener('click', () => {
        const k = b.dataset.kindFilter;
        setKind(k === 'all' ? 'all' : k);
      });
    });

    gridEl.addEventListener('click', (e) => {
      const tagEl = e.target.closest('.card-tag');
      if (tagEl) {
        toggleTagFromCard(tagEl.dataset.tag);
        return;
      }
      const previewBtn = e.target.closest('.btn-preview');
      if (previewBtn) {
        openPreviewModal(previewBtn.dataset.id);
        return;
      }
      const editBtn = e.target.closest('[data-edit]');
      if (editBtn) {
        openEditModal(editBtn.dataset.edit, false);
      }
    });

    modalClose.addEventListener('click', closePreviewModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closePreviewModal();
    });

    editClose.addEventListener('click', closeEditModal);
    editCancel.addEventListener('click', closeEditModal);
    editSave.addEventListener('click', applyEdit);
    editOverlay.addEventListener('click', (e) => {
      if (e.target === editOverlay) closeEditModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closePreviewModal();
        closeEditModal();
      }
    });

    btnExportFull.addEventListener('click', () => {
      downloadJson('catalog.json', buildCatalogObject());
      importStatus.textContent = 'Export completo baixado.';
      importStatus.className = 'give-status ok';
    });

    btnExportFiltered.addEventListener('click', () => {
      const filtered = filterModels();
      downloadJson('catalog-filtered.json', { version: catalogVersion, items: filtered });
      importStatus.textContent = `Export filtrado: ${filtered.length} itens.`;
      importStatus.className = 'give-status ok';
    });

    btnNewEntry.addEventListener('click', () => openEditModal(null, true));

    importFile.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      importFile.value = '';
      if (!file) return;
      importStatus.textContent = 'Importando…';
      importStatus.className = 'give-status';
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        const errs = validateCatalog(data);
        if (errs.length) {
          importStatus.textContent = 'Inválido: ' + errs.slice(0, 4).join('; ');
          importStatus.className = 'give-status error';
          return;
        }
        const mode = importMergeMode.value === 'replace' ? 'replace' : 'skip';
        const r = mergeImported(data, mode);
        initFilterChips();
        bindFilterClicks();
        render();
        importStatus.textContent = `Import OK — adicionados: ${r.added}, substituídos: ${r.replaced}, ignorados: ${r.skipped}. Exporte para persistir.`;
        importStatus.className = 'give-status ok';
        persistState();
      } catch (err) {
        importStatus.textContent = 'Falha: ' + (err && err.message ? err.message : String(err));
        importStatus.className = 'give-status error';
      }
    });

    if (window.showSaveFilePicker) {
      btnSaveFs.hidden = false;
      btnSaveFs.addEventListener('click', async () => {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: 'catalog.json',
            types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
          });
          const writable = await handle.createWritable();
          await writable.write(JSON.stringify(buildCatalogObject(), null, 2));
          await writable.close();
          importStatus.textContent = 'Arquivo salvo com sucesso.';
          importStatus.className = 'give-status ok';
        } catch (err) {
          if (err && err.name === 'AbortError') return;
          importStatus.textContent = 'Não foi possível salvar: ' + (err && err.message);
          importStatus.className = 'give-status error';
        }
      });
    }
  }

  async function boot() {
    wireEvents();
    importStatus.textContent = 'Carregando catálogo…';

    const url = catalogFetchUrl();

    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const errs = validateCatalog(data);
      if (errs.length) throw new Error(errs.join('; '));
      catalogVersion = String(data.version || '1');
      items = data.items.slice();
    } catch (e) {
      importStatus.textContent = 'Erro ao carregar catalog.json: ' + (e && e.message) + '. Verifique o servidor HTTP e o caminho ../data/catalog.json';
      importStatus.className = 'give-status error';
      items = [];
    }

    initFilterChips();
    restoreState();
    if (state.viewMode === 'list') {
      gridEl.classList.add('list-mode');
      viewGrid.classList.toggle('active', false);
      viewList.classList.toggle('active', true);
    }
    kindChipsEl.querySelectorAll('[data-kind]').forEach((b) => b.classList.toggle('active', b.dataset.kind === state.kind));
    document.querySelectorAll('[data-source]').forEach((b) => b.classList.toggle('active', b.dataset.source === state.source));
    colorChipsEl.querySelectorAll('[data-color]').forEach((b) => {
      b.classList.toggle('active', state.selectedColors.has(b.dataset.color));
    });
    tagChipsEl.querySelectorAll('[data-tag]').forEach((b) => {
      b.classList.toggle('active', state.selectedTags.has(b.dataset.tag));
    });
    document.querySelectorAll('.lib-chip').forEach((b) => {
      const fk = b.dataset.kindFilter;
      b.classList.toggle('active', fk === 'all' ? state.kind === 'all' : fk === state.kind);
    });

    bindFilterClicks();
    render();
    importStatus.textContent = '';
    importStatus.className = 'give-status';
  }

  boot();
})();
