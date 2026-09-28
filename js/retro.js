// ===== RÉTROSPECTIVE DE L'ANNÉE =====
// Bilan d'une année pour le profil courant, tous types confondus : total, répartition,
// coups de cœur, mois par mois, thèmes et créateur le plus présent.
let retroYear = new Date().getFullYear();

function finishedIn(year) {
  return books.filter(b => b.categorie === 'lu' && (b.dateFinished || '').startsWith(String(year)))
    .sort((a, b) => a.dateFinished.localeCompare(b.dateFinished));
}

function retroYears() {
  const years = new Set(books.filter(b => b.categorie === 'lu' && b.dateFinished).map(b => +b.dateFinished.slice(0, 4)));
  years.add(new Date().getFullYear());
  return [...years].sort((a, b) => a - b);
}

function openRetro(year) {
  retroYear = year || new Date().getFullYear();
  closeStatsModal();
  renderRetro();
  document.getElementById('retro-modal').classList.add('active');
}

function closeRetro() {
  document.getElementById('retro-modal').classList.remove('active');
}

function changeRetroYear(delta) {
  const years = retroYears();
  const i = years.indexOf(retroYear);
  const next = years[i + delta];
  if (next) { retroYear = next; renderRetro(); }
}

function renderRetro() {
  const items = finishedIn(retroYear);
  const years = retroYears();
  const i = years.indexOf(retroYear);
  const nav = `
    <div class="retro-nav">
      <button class="icon-btn" onclick="changeRetroYear(-1)" ${i <= 0 ? 'disabled' : ''} aria-label="${retroYear - 1}">‹</button>
      <h2>${t('retroTitle', { year: retroYear })}</h2>
      <button class="icon-btn" onclick="changeRetroYear(1)" ${i >= years.length - 1 ? 'disabled' : ''} aria-label="${retroYear + 1}">›</button>
    </div>`;
  const box = document.getElementById('retro-content');
  if (!items.length) {
    box.innerHTML = nav + `<div class="empty-state"><div class="icon">✨</div><h3>${t('retroEmpty', { year: retroYear })}</h3></div>`;
    return;
  }

  const byType = TYPES.map(type => [type, items.filter(b => typeOf(b) === type).length]).filter(([, n]) => n);
  const favorites = [...items].filter(b => b.note).sort((a, b) => b.note - a.note || b.dateFinished.localeCompare(a.dateFinished)).slice(0, 8);
  const months = Array.from({ length: 12 }, (_, m) => items.filter(b => +b.dateFinished.slice(5, 7) === m + 1).length);
  const maxMonth = Math.max(...months);
  const monthName = m => new Date(retroYear, m, 1).toLocaleDateString(locale(), { month: 'short' }).replace('.', '');
  const busiest = months.indexOf(maxMonth);
  const tags = topCounts(items.flatMap(b => b.tags || []), 5);
  const creators = topCounts(items.map(b => (b.auteur || '').split(',')[0].trim()), 1);
  const first = items[0];
  const last = items[items.length - 1];

  box.innerHTML = nav + `
    <div class="retro-hero">
      <div class="retro-types-big">${byType.map(([type, n]) => `<div>${typeIcon(type, 18)}<strong>${n}</strong>${ttn('readYear', type, n, { year: retroYear }).replace(/\s\S+\s\d{4}$/, '')}</div>`).join('')}</div>
    </div>
    ${favorites.length ? `
      <h3 class="retro-h">${t('retroFavorites')}</h3>
      <div class="retro-favs">${favorites.map(b => `
        <div class="retro-fav" title="${escapeHtml(b.titre)}">
          ${b.cover ? `<img src="${escapeHtml(b.cover)}" alt="${escapeHtml(b.titre)}" loading="lazy" data-title="${escapeHtml(b.titre)}" onerror="posterFallback(this)" class="poster-cover">` : posterPlaceholder(b.titre)}
          <span class="retro-stars">${'★'.repeat(b.note)}</span>
        </div>`).join('')}</div>` : ''}
    <h3 class="retro-h">${t('retroMonths')}</h3>
    <div class="retro-months">${months.map((n, m) => `
      <div class="retro-month ${m === busiest ? 'top' : ''}">
        <span class="bar" style="height:${maxMonth ? Math.max(4, n / maxMonth * 100) : 4}%"></span>
        <span class="n">${n || ''}</span>
        <span class="m">${monthName(m)}</span>
      </div>`).join('')}</div>
    <p class="retro-fact">${t('retroBusiest', { month: new Date(retroYear, busiest, 1).toLocaleDateString(locale(), { month: 'long' }) })}</p>
    ${tags.length ? `<h3 class="retro-h">${t('retroTags')}</h3><div class="tags">${tags.map(([tag, n]) => `<span class="tag">${escapeHtml(tag)}<span class="count">${n}</span></span>`).join('')}</div>` : ''}
    ${creators.length && creators[0][1] > 1 ? `<p class="retro-fact">${t('retroCreator', { name: escapeHtml(creators[0][0]), n: creators[0][1] })}</p>` : ''}
    <p class="retro-fact">${t('retroFirstLast', { first: escapeHtml(first.titre), last: escapeHtml(last.titre) })}</p>
  `;
}
