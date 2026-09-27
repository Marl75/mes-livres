// ===== PROFILS =====
function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase() || '?';
}

function renderProfileSelector() {
  const cur = getCurrentProfile();
  if (!cur) return;
  const avatar = document.getElementById('profile-pill-avatar');
  avatar.textContent = initials(cur.name);
  avatar.style.background = cur.color;
  document.getElementById('profile-pill-name').textContent = cur.name;

  const dd = document.getElementById('profile-dropdown');
  let userEmail = currentUser ? currentUser.email : '';
  dd.innerHTML =
    (userEmail ? `<div style="padding: 6px 12px 8px; font-size: 12px; color: var(--text-faint); overflow: hidden; text-overflow: ellipsis;">${escapeHtml(userEmail)}</div><div class="profile-divider"></div>` : '') +
    state.profiles.map(p => `
    <div class="profile-item ${p.id === state.currentId ? 'current' : ''}" onclick="switchProfile('${p.id}')">
      <span class="avatar" style="background:${p.color}">${initials(p.name)}</span>
      <span>${escapeHtml(p.name)}</span>
      <span style="color: var(--text-faint); font-size: 12px; margin-left: auto;">${ttn('items', 'tout', (p.books || []).length)}</span>
    </div>
  `).join('') + `
    <div class="profile-divider"></div>
    <button class="profile-action" onclick="openProfileModal()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
      ${t('manageProfilesAction')}
    </button>
    <button class="profile-action mobile-only" onclick="toggleProfileDropdown(); manualSync()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>
      ${t('sync')}
    </button>
    <button class="profile-action" onclick="toggleLanguage()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      ${t('langSwitch')}
    </button>
    <button class="profile-action danger" onclick="logoutUser()">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      ${t('logout')}
    </button>
  `;
}

function toggleProfileDropdown(e) {
  if (e) e.stopPropagation();
  document.getElementById('profile-dropdown').classList.toggle('active');
}

function switchProfile(id) {
  syncBooksToProfile();
  state.currentId = id;
  bindBooksToProfile();
  document.getElementById('profile-dropdown').classList.remove('active');
  activeTagFilters = [];
  currentSearch = '';
  document.getElementById('search').value = '';
  rememberCurrentProfile();
  renderProfileSelector();
  render();
}

function openProfileModal() {
  document.getElementById('profile-dropdown').classList.remove('active');
  document.getElementById('f-profile-name').value = '';
  newProfileColor = PROFILE_COLORS[state.profiles.length % PROFILE_COLORS.length];
  renderColorPicker();
  renderProfileList();
  document.getElementById('profile-modal').classList.add('active');
}

function closeProfileModal() {
  document.getElementById('profile-modal').classList.remove('active');
}

function renderColorPicker() {
  document.getElementById('color-picker').innerHTML = PROFILE_COLORS.map(c =>
    `<div class="color-swatch ${c === newProfileColor ? 'active' : ''}" style="background:${c}" onclick="pickColor('${c}')"></div>`
  ).join('');
}

function pickColor(c) {
  newProfileColor = c;
  renderColorPicker();
}

function renderProfileList() {
  const list = document.getElementById('profile-list');
  if (state.profiles.length === 0) { list.innerHTML = ''; return; }
  list.innerHTML = state.profiles.map(p => `
    <div class="profile-row">
      <span class="avatar" style="background:${p.color}">${initials(p.name)}</span>
      <div class="info">
        <div class="name">${escapeHtml(p.name)}${p.id === state.currentId ? ` <span style="color:var(--accent); font-size:11px;">${t('active')}</span>` : ''}</div>
        <div class="meta">${ttn('items', 'tout', (p.books || []).length)}</div>
      </div>
      <div class="row-actions">
        <button onclick="renameProfile('${p.id}')">${t('rename')}</button>
        ${state.profiles.length > 1 ? `<button class="danger" onclick="deleteProfile('${p.id}')">${t('delete')}</button>` : ''}
      </div>
    </div>
  `).join('');
}

function createProfileFromForm() {
  const name = document.getElementById('f-profile-name').value.trim();
  if (!name) { alert(t('profileNameRequired')); return; }
  const profile = touch({ id: newId(), name, color: newProfileColor, books: [], createdAt: Date.now() });
  state.profiles.push(profile);
  state.currentId = profile.id;
  rememberCurrentProfile();
  bindBooksToProfile();
  save();
  activeTagFilters = [];
  currentSearch = '';
  document.getElementById('search').value = '';
  renderProfileSelector();
  render();
  closeProfileModal();
}

function renameProfile(id) {
  const p = state.profiles.find(x => x.id === id);
  if (!p) return;
  const name = prompt(t('renamePrompt'), p.name);
  if (!name || !name.trim()) return;
  p.name = name.trim();
  touch(p);
  save();
  renderProfileSelector();
  renderProfileList();
}

function deleteProfile(id) {
  const p = state.profiles.find(x => x.id === id);
  if (!p) return;
  if (state.profiles.length <= 1) { alert(t('cantDeleteLast')); return; }
  if (!confirm(t('confirmDeleteProfile', { name: p.name, n: (p.books || []).length }))) return;
  removeProfile(id);
  if (state.currentId === id) { state.currentId = state.profiles[0].id; rememberCurrentProfile(); }
  bindBooksToProfile();
  save();
  renderProfileSelector();
  renderProfileList();
  render();
}

// Export / Import
function exportBooks() {
  syncBooksToProfile();
  const blob = new Blob([JSON.stringify({ profiles: state.profiles, exportedAt: Date.now() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `collection-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function importBooks(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data.profiles) && data.profiles.length) {
        if (confirm(t('confirmImportProfiles', { n: data.profiles.length }))) {
          replaceProfiles(data.profiles);
          state.currentId = state.profiles[0].id;
          rememberCurrentProfile();
          bindBooksToProfile();
          save();
          renderProfileSelector();
          render();
          closeProfileModal();
        }
      } else {
        const imported = Array.isArray(data) ? data : data.books;
        if (!Array.isArray(imported)) throw new Error(t('invalidFormat'));
        if (confirm(t('confirmImportBooks', { n: imported.length, name: getCurrentProfile().name }))) {
          replaceBooks(getCurrentProfile(), imported);
          bindBooksToProfile();
          save();
          render();
          closeProfileModal();
        }
      }
    } catch (err) {
      alert(t('importError') + err.message);
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// Fermer le dropdown si clic en dehors
document.addEventListener('click', e => {
  const dd = document.getElementById('profile-dropdown');
  const pill = document.getElementById('profile-pill');
  if (dd && dd.classList.contains('active') && !dd.contains(e.target) && !pill.contains(e.target)) {
    dd.classList.remove('active');
  }
});

// ===== RENDER =====
function render() {
  const grid = document.getElementById('grid');
  const items = scopedItems();
  renderTypeUI();
  const matchesSearch = b => !currentSearch
    || b.titre.toLowerCase().includes(currentSearch)
    || (b.auteur || '').toLowerCase().includes(currentSearch)
    || (b.tags || []).some(t => t.toLowerCase().includes(currentSearch));

  const matchesTagFilter = b => activeTagFilters.length === 0 || activeTagFilters.every(t => (b.tags || []).includes(t));
  const counts = { 'lu': 0, 'en-cours': 0, 'a-lire': 0, 'abandonne': 0, 'wishlist': 0 };
  items.filter(b => matchesSearch(b) && matchesTagFilter(b)).forEach(b => { if (b.categorie in counts) counts[b.categorie]++; });
  const someFilterActive = currentSearch || activeTagFilters.length > 0;
  Object.keys(counts).forEach(k => {
    const el = document.getElementById('count-' + k);
    el.textContent = counts[k];
    el.closest('.stat-card').style.opacity = (someFilterActive && counts[k] === 0) ? '0.4' : '1';
  });

  renderTagFilterBar();

  const filtered = sortBooks(items.filter(b =>
    b.categorie === currentCat
    && matchesSearch(b)
    && (activeTagFilters.length === 0 || activeTagFilters.every(t => (b.tags || []).includes(t)))
  ));

  document.getElementById('list-count').textContent = filtered.length
    ? ttn('items', currentType, filtered.length)
    : '';

  if (filtered.length === 0) {
    const msg = currentSearch ? t('noResults') : t('emptyTitle');
    const sub = currentSearch ? t('tryAnother') : tt('emptyHint', currentType);
    grid.innerHTML = `<div class="empty-state"><div class="icon">${TYPE_EMOJI[currentType]}</div><h3>${msg}</h3><p>${sub}</p></div>`;
    return;
  }

  const posters = viewMode() === 'posters';
  grid.classList.toggle('posters', posters);
  if (posters) {
    grid.innerHTML = filtered.map(renderPoster).join('');
    return;
  }

  grid.innerHTML = filtered.map(b => {
    const stars = b.note ? renderStars(b.note) : '';
    const reco = b.recoBy ? `<div class="reco-by">✨ ${escapeHtml(b.recoBy)}</div>` : '';
    const note = b.avis ? `<div class="note">${escapeHtml(b.avis)}</div>` : '';
    const tags = (b.tags && b.tags.length)
      ? `<div class="tags">${b.tags.map(t => `<span class="tag" onclick="filterByTag('${escapeAttr(t)}')">${escapeHtml(t)}</span>`).join('')}</div>`
      : '';
    const type = typeOf(b);
    const meta = [];
    if (b.categorie === 'lu' && b.dateFinished) meta.push(tt('readIn', type, { date: formatMonthYear(b.dateFinished) }));
    if (b.annee) meta.push(b.annee);
    const chip = currentType === 'tout'
      ? `<span class="type-chip">${typeIcon(type, 12)}${t('typeOne_' + type)}${b.plateforme ? ' · ' + escapeHtml(b.plateforme) : ''}</span>`
      : (b.plateforme ? `<span class="type-chip">${typeIcon(type, 12)}${escapeHtml(b.plateforme)}</span>` : '');
    const progress = type === 'serie' && b.progression && b.categorie !== 'lu'
      ? `<div class="progress-chip">${escapeHtml(b.progression)}</div>` : '';
    return `
      <div class="card" data-cat="${b.categorie}">
        <div class="card-top">
          ${renderCover(b)}
          <div class="card-info">
            <div class="card-header">
              <div class="card-title">${escapeHtml(b.titre)}</div>
              <button class="card-menu" onclick="openCardMenu(event, '${b.id}')" aria-label="${t('actions')}" title="${t('actions')}">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
              </button>
            </div>
            ${chip}
            ${b.auteur ? `<div class="card-author">${escapeHtml(b.auteur)}</div>` : ''}
            ${meta.length ? `<div class="card-meta">${meta.join(' · ')}</div>` : ''}
            ${progress}
            ${stars}
            ${reco}
          </div>
        </div>
        ${tags}
        ${note}
      </div>
    `;
  }).join('');
}

// ===== VUE AFFICHES =====
function renderPoster(b) {
  const type = typeOf(b);
  const sub = [b.auteur, b.annee].filter(Boolean).map(escapeHtml).join(' · ');
  const chip = type === 'serie' && b.progression && b.categorie !== 'lu'
    ? `<span class="poster-chip">${escapeHtml(b.progression)}</span>` : '';
  const image = b.cover
    ? `<img class="poster-cover" src="${escapeHtml(b.cover)}" alt="" loading="lazy" data-title="${escapeHtml(b.titre)}" onerror="posterFallback(this)">`
    : posterPlaceholder(b.titre);
  return `
    <div class="poster" data-cat="${b.categorie}">
      <button class="poster-img${chip ? ' has-chip' : ''}" onclick="editBook('${b.id}')" aria-label="${escapeHtml(b.titre)}">${image}${chip}</button>
      <button class="card-menu poster-menu" onclick="openCardMenu(event, '${b.id}')" aria-label="${t('actions')}" title="${t('actions')}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>
      </button>
      <div class="poster-title">${escapeHtml(b.titre)}</div>
      ${sub ? `<div class="poster-sub">${sub}</div>` : ''}
      ${b.note ? renderStars(b.note) : ''}
    </div>`;
}

function posterPlaceholder(titre) {
  return `<span class="poster-cover placeholder">${escapeHtml(titre || '')}</span>`;
}

function posterFallback(img) {
  img.outerHTML = posterPlaceholder(img.dataset.title);
}

function setViewMode(mode) {
  viewByType[currentType] = mode;
  try { localStorage.setItem(VIEWS_KEY, JSON.stringify(viewByType)); } catch (e) {}
  render();
}

// ===== TYPES (interface) =====
const LAST_TYPE_KEY = 'mes-livres-last-type';

// Onglets de type, cartes de catégories et libellés qui dépendent du type affiché
function renderTypeUI() {
  const counts = { tout: books.length, livre: 0, film: 0, serie: 0, jeu: 0 };
  books.forEach(b => counts[typeOf(b)]++);
  document.getElementById('type-tabs').innerHTML = ['tout', ...TYPES].map(ty => `
    <button class="type-tab ${ty === currentType ? 'active' : ''}" onclick="setActiveType('${ty}')" aria-pressed="${ty === currentType}">
      ${typeIcon(ty, 17)}<span class="type-tab-label">${t('type_' + ty)}</span><span class="type-tab-count">${counts[ty]}</span>
    </button>`).join('');
  const cats = catsFor(currentType);
  document.querySelectorAll('.stat-card').forEach(c => {
    const cat = c.dataset.cat;
    c.style.display = cats.includes(cat) ? '' : 'none';
    c.querySelector('.cat-name').textContent = catLabel(cat, currentType);
    c.querySelector('.stat-sub').textContent = tt('sub_' + cat, currentType);
  });
  document.getElementById('sort-author').textContent = tt('sort_author', currentType);
  const mode = viewMode();
  document.querySelectorAll('#view-toggle button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === mode);
    btn.setAttribute('aria-pressed', btn.dataset.view === mode);
  });
}

function setActiveType(type, cat) {
  if (type === currentType && !cat) return;
  currentType = type;
  const cats = catsFor(type);
  const wanted = cat || catByType[type] || currentCat;
  currentCat = cats.includes(wanted) ? wanted : cats[0];
  catByType[type] = currentCat;
  rememberView();
  activeTagFilters = activeTagFilters.filter(tag => scopedItems().some(b => (b.tags || []).includes(tag)));
  closeCardMenu();
  render();
  showActiveCat('instant');
  if (document.getElementById('stats-modal').classList.contains('active')) renderStats();
}

// Type proposé par défaut dans le formulaire : l'onglet ouvert, sinon le dernier type ajouté
function defaultAddType() {
  if (TYPES.includes(currentType)) return currentType;
  try {
    const last = localStorage.getItem(LAST_TYPE_KEY);
    if (TYPES.includes(last)) return last;
  } catch (e) {}
  return 'livre';
}

function renderTypePicker() {
  const current = document.getElementById('f-type').value;
  document.getElementById('type-picker').innerHTML = TYPES.map(ty => `
    <button type="button" role="radio" aria-checked="${ty === current}" class="type-option ${ty === current ? 'active' : ''}" onclick="pickType('${ty}')">
      ${typeIcon(ty, 18)}<span>${t('typeOne_' + ty)}</span>
    </button>`).join('');
}

function pickType(type) {
  document.getElementById('f-type').value = type;
  document.getElementById('f-lookup').value = '';
  hideLookup();
  renderTypePicker();
  fillCategorySelect(document.getElementById('f-categorie').value);
  updateModalFields(true);
}

// Liste des catégories du formulaire, limitée à celles qui ont un sens pour le type choisi
function fillCategorySelect(selected) {
  const type = document.getElementById('f-type').value || 'livre';
  const cats = catsFor(type);
  const select = document.getElementById('f-categorie');
  select.innerHTML = cats.map(c => `<option value="${c}">${tt('catOne_' + c, type) !== 'catOne_' + c ? tt('catOne_' + c, type) : catLabel(c, type)}</option>`).join('');
  select.value = cats.includes(selected) ? selected : cats[0];
}

// ===== TRI =====
const SORT_KEY = 'mes-livres-sort';
let currentSort = 'recent';
try { currentSort = localStorage.getItem(SORT_KEY) || 'recent'; } catch (e) {}
if (!['recent', 'finished', 'title', 'author', 'rating'].includes(currentSort)) currentSort = 'recent';

function lastName(author) {
  return (author || '').split(',')[0].trim().split(/\s+/).pop() || '';
}

function sortBooks(list) {
  const byTitle = (a, b) => a.titre.localeCompare(b.titre, locale(), { sensitivity: 'base' });
  const byRecent = (a, b) => (b.dateAdded || 0) - (a.dateAdded || 0);
  const sorters = {
    recent: byRecent,
    title: byTitle,
    author: (a, b) => {
      if (!a.auteur !== !b.auteur) return a.auteur ? -1 : 1;
      return lastName(a.auteur).localeCompare(lastName(b.auteur), locale(), { sensitivity: 'base' }) || byTitle(a, b);
    },
    rating: (a, b) => (b.note || 0) - (a.note || 0) || byTitle(a, b),
    finished: (a, b) => (b.dateFinished || '').localeCompare(a.dateFinished || '') || byRecent(a, b),
  };
  return list.sort(sorters[currentSort] || byRecent);
}

// ===== COUVERTURES & PROGRESSION =====
function coverPlaceholder(titre) {
  const letter = escapeHtml(((titre || '?').trim()[0] || '?').toUpperCase());
  return `<div class="cover placeholder">${letter}</div>`;
}

function renderCover(b) {
  if (!b.cover) return coverPlaceholder(b.titre);
  return `<img class="cover" src="${escapeHtml(b.cover)}" alt="" loading="lazy" data-letter="${escapeHtml(b.titre)}" onerror="coverFallback(this)">`;
}

function coverFallback(img) {
  img.outerHTML = coverPlaceholder(img.dataset.letter);
}

// ===== DATES =====
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatMonthYear(iso) {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d) ? '' : d.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
}

// ===== MENU DES CARTES =====
let cardMenuId = null;
let cardMenuScrollY = 0;

function openCardMenu(e, id) {
  e.stopPropagation();
  const pop = document.getElementById('card-popover');
  if (cardMenuId === id && pop.classList.contains('active')) { closeCardMenu(); return; }
  const b = books.find(x => x.id === id);
  if (!b) return;
  cardMenuId = id;
  cardMenuScrollY = window.scrollY;
  const catColors = { 'lu': '#6dbfa8', 'en-cours': '#6a9bd4', 'a-lire': '#d4936a', 'abandonne': '#c97070', 'wishlist': '#b899d8' };
  const icon = path => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
  pop.innerHTML = `
    <button class="profile-action" onclick="closeCardMenu(); editBook('${id}')">${icon('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>')}${t('edit')}</button>
    <div class="profile-divider"></div>
    <div class="menu-label">${t('moveTo')}</div>
    ${catsFor(typeOf(b)).filter(k => k !== b.categorie).map(k =>
      `<button class="profile-action" onclick="closeCardMenu(); moveBook('${id}', '${k}')"><span class="dot" style="background:${catColors[k]}"></span>${catLabel(k, typeOf(b))}</button>`
    ).join('')}
    <div class="profile-divider"></div>
    <button class="profile-action danger" onclick="closeCardMenu(); deleteBook('${id}')">${icon('<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>')}${t('delete')}</button>
  `;
  pop.classList.add('active');
  const r = e.currentTarget.getBoundingClientRect();
  const w = pop.offsetWidth, h = pop.offsetHeight;
  const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
  const top = r.bottom + 6 + h > window.innerHeight - 8 ? Math.max(8, r.top - h - 6) : r.bottom + 6;
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';
}

function closeCardMenu() {
  document.getElementById('card-popover').classList.remove('active');
  cardMenuId = null;
}

// ===== STATISTIQUES =====
function openStatsModal() {
  renderStats();
  document.getElementById('stats-modal').classList.add('active');
}

function closeStatsModal() {
  document.getElementById('stats-modal').classList.remove('active');
}

function setGoal(value) {
  const p = getCurrentProfile();
  if (!p) return;
  const n = parseInt(value, 10);
  p.goals = { ...(p.goals || {}), [currentType]: n > 0 ? n : null };
  touch(p);
  save();
  renderStats();
}

function barRows(entries) {
  const max = Math.max(...entries.map(e => e[1]), 1);
  return entries.map(([name, n]) => `
    <div class="bar-row">
      <span class="name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>
      <span class="track"><span style="width:${(n / max * 100).toFixed(0)}%"></span></span>
      <span class="n">${n}</span>
    </div>`).join('');
}

function topCounts(values, limit) {
  const counts = {};
  values.forEach(v => { if (v) counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], locale())).slice(0, limit);
}

function renderStats() {
  const p = getCurrentProfile();
  const ty = currentType;
  const read = scopedItems().filter(b => b.categorie === 'lu');
  const year = String(new Date().getFullYear());
  const readThisYear = read.filter(b => (b.dateFinished || '').startsWith(year));
  // Objectif par type ; l'ancien objectif unique était celui des livres
  const goal = (p && ((p.goals && p.goals[ty]) || (ty === 'livre' && !(p.goals && 'livre' in p.goals) ? p.goal : 0))) || 0;
  const authorCount = new Set(read.map(b => (b.auteur || '').trim().toLowerCase()).filter(Boolean)).size;
  const rated = read.filter(b => b.note);
  const avg = rated.length ? (rated.reduce((n, b) => n + b.note, 0) / rated.length).toLocaleString(locale(), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '–';
  const undated = read.filter(b => !b.dateFinished).length;

  const byYear = topCounts(read.map(b => (b.dateFinished || '').slice(0, 4)), 100)
    .sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
  const authors = topCounts(read.map(b => (b.auteur || '').trim()), 5);
  const tags = topCounts(read.flatMap(b => b.tags || []), 5);

  const pct = goal ? Math.min(100, Math.round(readThisYear.length / goal * 100)) : 0;
  document.getElementById('stats-content').innerHTML = `
    <div class="goal-card">
      <div class="goal-head">
        <div class="goal-count">${readThisYear.length} <small>${goal ? tt('goalOf', ty, { goal, year }) : ttn('readYear', ty, readThisYear.length, { year })}</small></div>
        <label class="goal-input">${t('goal')} <input type="number" min="1" value="${goal || ''}" placeholder="–" onchange="setGoal(this.value)"></label>
      </div>
      ${goal ? `<div class="progress-bar"><span style="width:${pct}%"></span></div>` : ''}
    </div>
    <div class="kpis">
      <div class="kpi"><div class="v">${read.length}</div><div class="l">${tt('totalRead', ty)}</div></div>
      <div class="kpi"><div class="v">${authorCount}</div><div class="l">${tt('authorsRead', ty)}</div></div>
      <div class="kpi"><div class="v">${avg}${rated.length ? ' ★' : ''}</div><div class="l">${t('avgRating')}</div></div>
    </div>
    ${byYear.length ? `<div class="stats-section"><h3>${tt('byYear', ty)}</h3>${barRows(byYear)}</div>` : ''}
    ${authors.length ? `<div class="stats-section"><h3>${tt('topAuthors', ty)}</h3>${barRows(authors)}</div>` : ''}
    ${tags.length ? `<div class="stats-section"><h3>${t('topTags')}</h3>${barRows(tags)}</div>` : ''}
    ${undated ? `<p class="stats-hint">${ttn('undated', ty === 'livre' ? 'livre' : 'tout', undated)}</p>` : ''}
    ${read.length === 0 ? `<p class="stats-hint">${tt('noneRead', ty)}</p>` : ''}
  `;
}

function updateCoverPreview() {
  const url = document.getElementById('f-cover').value.trim();
  const titre = document.getElementById('f-titre').value;
  document.getElementById('cover-preview').innerHTML = renderCover({ cover: url, titre });
}

function renderTagFilterBar() {
  const bar = document.getElementById('tag-filter-bar');
  const matchesSearch = b => !currentSearch
    || b.titre.toLowerCase().includes(currentSearch)
    || (b.auteur || '').toLowerCase().includes(currentSearch)
    || (b.tags || []).some(t => t.toLowerCase().includes(currentSearch));
  const tagCounts = {};
  scopedItems().filter(matchesSearch).forEach(b => (b.tags || []).forEach(t => {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  }));
  const tags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b));
  if (tags.length === 0) { bar.innerHTML = ''; bar.style.display = 'none'; return; }
  bar.style.display = 'flex';
  bar.innerHTML =
    '<span class="label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>' + t('tags') + '</span>'
    + tags.map(t => `<span class="tag ${activeTagFilters.includes(t) ? 'active' : ''}" onclick="toggleTagFilter('${escapeAttr(t)}')">${escapeHtml(t)}<span class="count">${tagCounts[t]}</span></span>`).join('')
    + (activeTagFilters.length ? `<button class="clear" onclick="clearTagFilter()">${t('clearTags')}</button>` : '');
}

function toggleTagFilter(tag) {
  const i = activeTagFilters.indexOf(tag);
  if (i >= 0) activeTagFilters.splice(i, 1);
  else activeTagFilters.push(tag);
  render();
}

function filterByTag(tag) { toggleTagFilter(tag); }
function clearTagFilter() { activeTagFilters = []; render(); }

function renderStars(n) {
  let s = '<div class="stars">';
  for (let i = 1; i <= 5; i++) {
    s += i <= n
      ? '<svg class="filled" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'
      : '<svg class="empty" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  }
  return s + '</div>';
}

function moveBook(id, cat) {
  const b = books.find(x => x.id === id);
  if (!b) return;
  b.categorie = cat;
  if (cat === 'lu' && !b.dateFinished) b.dateFinished = todayISO();
  touch(b);
  save();
  render();
}

function deleteBook(id) {
  const item = books.find(b => b.id === id);
  if (!item || !confirm(t('confirmDeleteItem', { title: item.titre }))) return;
  removeBook(id);
  save();
  render();
}

function openModal(book) {
  document.getElementById('edit-id').value = book ? book.id : '';
  document.getElementById('f-type').value = book ? typeOf(book) : defaultAddType();
  renderTypePicker();
  fillCategorySelect(book ? book.categorie : currentCat);
  document.getElementById('f-titre').value = book ? book.titre : '';
  document.getElementById('f-auteur').value = book ? (book.auteur || '') : '';
  document.getElementById('f-avis').value = book ? (book.avis || '') : '';
  document.getElementById('f-reco').value = book ? (book.recoBy || '') : '';
  document.getElementById('f-cover').value = book ? (book.cover || '') : '';
  document.getElementById('f-finished').value = book ? (book.dateFinished || '') : '';
  document.getElementById('f-year').value = book && book.annee ? book.annee : '';
  document.getElementById('f-platform').value = book ? (book.plateforme || '') : '';
  document.getElementById('f-progress').value = book ? (book.progression || '') : '';
  document.getElementById('f-lookup').value = '';
  hideLookup();
  updateCoverPreview();
  setRating(book ? (book.note || 0) : 0);
  currentTags = book && book.tags ? [...book.tags] : [];
  renderTagEditor();
  updateModalFields();
  document.getElementById('modal').classList.add('active');
  const focusLookup = !book && lookupAvailable(document.getElementById('f-type').value);
  setTimeout(() => document.getElementById(focusLookup ? 'f-lookup' : 'f-titre').focus(), 50);
}

function renderTagEditor() {
  const editor = document.getElementById('tag-editor');
  editor.innerHTML = currentTags.map((tag, i) =>
    `<span class="chip">${escapeHtml(tag)}<button type="button" onclick="removeTag(${i})" aria-label="${t('removeTag')}">×</button></span>`
  ).join('') + `<input type="text" id="f-tag-input" placeholder="${t('tagPh')}" autocomplete="off">`;
  bindTagInput();
}

function addTag(raw) {
  const t = raw.trim().toLowerCase();
  if (!t) return;
  if (!currentTags.includes(t)) currentTags.push(t);
  renderTagEditor();
  const inp = document.getElementById('f-tag-input');
  inp.focus();
  suggestionIndex = -1;
  renderSuggestions('');
}

function removeTag(i) {
  currentTags.splice(i, 1);
  renderTagEditor();
  const inp = document.getElementById('f-tag-input');
  inp.focus();
  renderSuggestions(inp.value);
}

function bindTagInput() {
  const inp = document.getElementById('f-tag-input');
  if (!inp) return;
  inp.addEventListener('input', () => { suggestionIndex = -1; renderSuggestions(inp.value); });
  inp.addEventListener('focus', () => renderSuggestions(inp.value));
  inp.addEventListener('keydown', e => {
    const sugBox = document.getElementById('tag-suggestions');
    const items = sugBox.querySelectorAll('.tag-suggestion[data-tag]');
    if (e.key === 'ArrowDown') {
      if (items.length) { e.preventDefault(); suggestionIndex = (suggestionIndex + 1) % items.length; highlightSuggestion(items); }
    } else if (e.key === 'ArrowUp') {
      if (items.length) { e.preventDefault(); suggestionIndex = (suggestionIndex - 1 + items.length) % items.length; highlightSuggestion(items); }
    } else if (e.key === 'Tab' && items.length && inp.value.trim()) {
      e.preventDefault();
      const pick = items[suggestionIndex >= 0 ? suggestionIndex : 0];
      addTag(pick.dataset.tag);
      inp.value = '';
    } else if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (suggestionIndex >= 0 && items[suggestionIndex]) {
        addTag(items[suggestionIndex].dataset.tag);
      } else {
        addTag(inp.value);
      }
      inp.value = '';
    } else if (e.key === 'Escape' && sugBox.classList.contains('active')) {
      e.preventDefault();
      sugBox.classList.remove('active');
    } else if (e.key === 'Backspace' && !inp.value && currentTags.length) {
      removeTag(currentTags.length - 1);
    }
  });
  inp.addEventListener('blur', () => {
    setTimeout(() => {
      const sugBox = document.getElementById('tag-suggestions');
      if (sugBox) sugBox.classList.remove('active');
      if (inp.value.trim()) { addTag(inp.value); inp.value = ''; }
    }, 150);
  });
}

function highlightSuggestion(items) {
  items.forEach((it, i) => it.classList.toggle('highlight', i === suggestionIndex));
  if (items[suggestionIndex]) items[suggestionIndex].scrollIntoView({ block: 'nearest' });
}

function getAllTags() {
  const counts = {};
  books.forEach(b => (b.tags || []).forEach(t => { counts[t] = (counts[t] || 0) + 1; }));
  return Object.keys(counts).map(t => ({ tag: t, count: counts[t] }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

function renderSuggestions(query) {
  const box = document.getElementById('tag-suggestions');
  if (!box) return;
  const q = (query || '').trim().toLowerCase();
  let all = getAllTags().filter(t => !currentTags.includes(t.tag));
  if (q) all = all.filter(t => t.tag.includes(q));
  all = all.slice(0, 8);

  let html = all.map(t => `<div class="tag-suggestion" data-tag="${escapeAttr(t.tag)}" onmousedown="event.preventDefault(); pickSuggestion('${escapeAttr(t.tag)}')">${escapeHtml(t.tag)}<span class="usage">${ttn('items', 'tout', t.count)}</span></div>`).join('');

  if (q && !getAllTags().some(t => t.tag === q) && !currentTags.includes(q)) {
    html += `<div class="tag-suggestion" data-tag="${escapeAttr(q)}" onmousedown="event.preventDefault(); pickSuggestion('${escapeAttr(q)}')"><span>${t('createTag', { q: escapeHtml(q) })}</span><span class="new">${t('newTag')}</span></div>`;
  }

  if (!html) { box.classList.remove('active'); return; }
  box.innerHTML = html;
  box.classList.add('active');
}

function pickSuggestion(tag) {
  addTag(tag);
  const inp = document.getElementById('f-tag-input');
  if (inp) inp.value = '';
}

function closeModal() { document.getElementById('modal').classList.remove('active'); }

function editBook(id) {
  const b = books.find(x => x.id === id);
  if (b) openModal(b);
}

function saveBook() {
  const titre = document.getElementById('f-titre').value.trim();
  if (!titre) { document.getElementById('f-titre').focus(); return; }
  const id = document.getElementById('edit-id').value;
  const pendingTag = document.getElementById('f-tag-input');
  if (pendingTag && pendingTag.value.trim()) addTag(pendingTag.value);
  const categorie = document.getElementById('f-categorie').value;
  const type = document.getElementById('f-type').value;
  const annee = parseInt(document.getElementById('f-year').value, 10);
  let dateFinished = document.getElementById('f-finished').value || null;
  if (categorie === 'lu' && !dateFinished && !id) dateFinished = todayISO();
  const data = {
    titre,
    auteur: document.getElementById('f-auteur').value.trim(),
    categorie,
    note: currentRating,
    avis: document.getElementById('f-avis').value.trim(),
    recoBy: document.getElementById('f-reco').value.trim(),
    tags: [...currentTags],
    cover: document.getElementById('f-cover').value.trim(),
    dateFinished,
    type,
    annee: type !== 'livre' && annee > 0 ? annee : null,
    plateforme: type === 'jeu' ? document.getElementById('f-platform').value.trim() : '',
    progression: type === 'serie' ? document.getElementById('f-progress').value.trim() : '',
  };
  if (id) {
    touch(Object.assign(books.find(b => b.id === id), data));
  } else {
    books.push(touch({ id: newId(), dateAdded: Date.now(), ...data }));
  }
  save();
  closeModal();
  try { localStorage.setItem(LAST_TYPE_KEY, type); } catch (e) {}
  if (currentType !== 'tout' && currentType !== type) setActiveType(type, data.categorie);
  else setActiveCat(data.categorie);
}

function setRating(n) {
  currentRating = n;
  document.querySelectorAll('#star-input span').forEach(s => {
    s.classList.toggle('on', parseInt(s.dataset.v) <= n);
  });
}

function setActiveCat(cat) {
  currentCat = cat;
  catByType[currentType] = cat;
  rememberView();
  showActiveCat('smooth');
  render();
}

// Met en évidence la catégorie courante ; sur mobile, fait défiler la rangée jusqu'à elle
function showActiveCat(behavior) {
  document.querySelectorAll('.stat-card').forEach(c => {
    const isActive = c.dataset.cat === currentCat;
    c.classList.toggle('active', isActive);
    if (isActive && c.offsetParent && window.matchMedia('(max-width: 700px)').matches) {
      c.scrollIntoView({ behavior, inline: 'center', block: 'nearest' });
    }
  });
}

function updateModalFields(fromChange) {
  const type = document.getElementById('f-type').value || 'livre';
  const cat = document.getElementById('f-categorie').value;
  const isEdit = !!document.getElementById('edit-id').value;
  document.getElementById('modal-title').textContent = tt(isEdit ? 'editBook' : 'addBook', type);
  document.getElementById('field-lookup').style.display = lookupAvailable(type) ? 'block' : 'none';
  document.getElementById('f-lookup').placeholder = tt('lookupPh', type);
  document.getElementById('lookup-hint').textContent = tt('lookupHint', type);
  document.getElementById('f-titre').placeholder = tt('titlePh', type);
  document.getElementById('label-auteur').textContent = tt('author', type);
  document.getElementById('f-auteur').placeholder = tt('authorPh', type);
  document.getElementById('label-cover').textContent = tt('cover', type);
  document.getElementById('label-finished').textContent = tt('finishedOn', type);
  document.getElementById('field-year').style.display = type === 'livre' ? 'none' : 'block';
  document.getElementById('field-platform').style.display = type === 'jeu' ? 'block' : 'none';
  document.getElementById('field-progress').style.display = type === 'serie' && cat !== 'lu' ? 'block' : 'none';
  document.getElementById('field-note').style.display = (cat === 'lu' || cat === 'abandonne') ? 'block' : 'none';
  document.getElementById('field-avis').style.display = (cat === 'lu' || cat === 'en-cours' || cat === 'abandonne') ? 'block' : 'none';
  document.getElementById('field-reco').style.display = cat === 'wishlist' ? 'block' : 'none';
  document.getElementById('field-finished').style.display = cat === 'lu' ? 'block' : 'none';
  const finished = document.getElementById('f-finished');
  // Pas de date automatique sur un ancien livre déjà lu (on ne connaît pas sa vraie date)
  const isNew = !document.getElementById('edit-id').value;
  if (cat === 'lu' && !finished.value && (isNew || fromChange)) finished.value = todayISO();
  const avis = document.getElementById('f-avis');
  if (cat === 'en-cours') avis.placeholder = t('reviewPhReading');
  else if (cat === 'abandonne') avis.placeholder = t('reviewPhAbandoned');
  else avis.placeholder = t('reviewPh');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function escapeAttr(s) {
  return String(s).replace(/['"\\]/g, '\\$&');
}

// Events
document.querySelectorAll('.stat-card').forEach(c => {
  c.addEventListener('click', () => setActiveCat(c.dataset.cat));
});

document.getElementById('search').addEventListener('input', e => {
  currentSearch = e.target.value.toLowerCase().trim();
  render();
});

document.getElementById('star-input').addEventListener('click', e => {
  // Recliquer sur la note actuelle la remet à zéro
  if (e.target.dataset.v) {
    const v = parseInt(e.target.dataset.v);
    setRating(v === currentRating ? 0 : v);
  }
});

document.getElementById('f-categorie').addEventListener('change', () => updateModalFields(true));
document.getElementById('platform-list').innerHTML = PLATFORMS.map(p => `<option value="${p}">`).join('');

document.getElementById('f-lookup').addEventListener('input', onLookupInput);
document.getElementById('f-lookup').addEventListener('keydown', e => {
  const items = document.querySelectorAll('#lookup-results .lookup-item');
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    if (!items.length) return;
    e.preventDefault();
    lookupIndex = (lookupIndex + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items.forEach((it, i) => it.classList.toggle('highlight', i === lookupIndex));
    items[lookupIndex].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (items.length) pickLookup(Math.max(lookupIndex, 0));
  } else if (e.key === 'Escape' && document.getElementById('lookup-results').classList.contains('active')) {
    e.stopPropagation();
    hideLookup();
  }
});
document.getElementById('f-lookup').addEventListener('blur', () => setTimeout(hideLookup, 150));
document.getElementById('f-cover').addEventListener('input', updateCoverPreview);
document.getElementById('f-titre').addEventListener('input', () => {
  if (!document.getElementById('f-cover').value.trim()) updateCoverPreview();
});

document.getElementById('sort-select').value = currentSort;
document.getElementById('sort-select').addEventListener('change', e => {
  currentSort = e.target.value;
  try { localStorage.setItem(SORT_KEY, currentSort); } catch (err) {}
  render();
});

document.getElementById('stats-modal').addEventListener('click', e => {
  if (e.target.id === 'stats-modal') closeStatsModal();
});

document.addEventListener('click', e => {
  const pop = document.getElementById('card-popover');
  if (pop.classList.contains('active') && !pop.contains(e.target)) closeCardMenu();
});
// Ferme le menu seulement sur un vrai défilement (pas sur les micro-mouvements de la barre d'adresse mobile)
window.addEventListener('scroll', () => {
  if (cardMenuId && Math.abs(window.scrollY - cardMenuScrollY) > 40) closeCardMenu();
}, { passive: true });

document.getElementById('modal').addEventListener('click', e => {
  if (e.target.id === 'modal') closeModal();
});

document.getElementById('profile-modal').addEventListener('click', e => {
  if (e.target.id === 'profile-modal') closeProfileModal();
});

// Copie locale de l'appli pour pouvoir l'ouvrir sans connexion
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(err => console.warn('Service worker :', err));
}

applyTranslations();
renderTypePicker();
fillCategorySelect(currentCat);
updateModalFields();
renderTypeUI();
showActiveCat('instant');

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeCardMenu(); closeModal(); closeProfileModal(); closeStatsModal(); }
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); document.getElementById('search').focus(); }
});
