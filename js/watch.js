// ===== OÙ REGARDER (films et séries) =====
// Plateformes de streaming du pays de l'utilisateur, fournies par TMDB (données JustWatch).
// Affiché pour les films et séries « à voir », « en cours » ou en wishlist.
const WATCH_CACHE_KEY = 'mes-livres-watch';
const WATCH_IDS_KEY = 'mes-livres-tmdb-ids';
const WATCH_TTL = 3 * 24 * 3600 * 1000;   // les disponibilités changent : on revérifie tous les 3 jours
const WATCH_CATS = ['a-lire', 'en-cours', 'wishlist'];
const watchInFlight = {};
let watchCache = {};
let tmdbIds = {};
try {
  watchCache = JSON.parse(localStorage.getItem(WATCH_CACHE_KEY) || '{}') || {};
  tmdbIds = JSON.parse(localStorage.getItem(WATCH_IDS_KEY) || '{}') || {};
} catch (e) {}

function watchRegion() {
  const region = (navigator.language || '').split('-')[1];
  return (region || (currentLang === 'fr' ? 'FR' : 'GB')).toUpperCase();
}

function wantsWatchInfo(item) {
  const type = typeOf(item);
  return !!TMDB_KEY && (type === 'film' || type === 'serie') && WATCH_CATS.includes(item.categorie);
}

function saveWatchCaches() {
  try {
    localStorage.setItem(WATCH_CACHE_KEY, JSON.stringify(watchCache));
    localStorage.setItem(WATCH_IDS_KEY, JSON.stringify(tmdbIds));
  } catch (e) {}
}

// Identifiant TMDB : celui gardé lors du remplissage automatique, sinon une recherche par titre (+ année)
async function resolveTmdbId(item) {
  const kind = typeOf(item) === 'film' ? 'movie' : 'tv';
  if (item.tmdbId) return { kind, id: item.tmdbId };
  const key = `${kind}|${normalize(item.titre)}|${item.annee || ''}`;
  if (tmdbIds[key] !== undefined) return tmdbIds[key] ? { kind, id: tmdbIds[key] } : null;
  const yearParam = item.annee ? `&${kind === 'movie' ? 'year' : 'first_air_date_year'}=${item.annee}` : '';
  const res = await fetch(`https://api.themoviedb.org/3/search/${kind}?api_key=${TMDB_KEY}&language=${locale()}&query=${encodeURIComponent(item.titre)}${yearParam}`);
  const data = res.ok ? await res.json() : {};
  const id = data.results && data.results[0] ? data.results[0].id : 0;
  tmdbIds[key] = id;
  saveWatchCaches();
  return id ? { kind, id } : null;
}

async function fetchProviders(item) {
  const ref = await resolveTmdbId(item);
  if (!ref) return null;
  const region = watchRegion();
  const key = `${ref.kind}:${ref.id}:${region}`;
  const cached = watchCache[key];
  if (cached && Date.now() - cached.at < WATCH_TTL) return cached;
  if (!watchInFlight[key]) {
    watchInFlight[key] = fetch(`https://api.themoviedb.org/3/${ref.kind}/${ref.id}/watch/providers?api_key=${TMDB_KEY}`)
      .then(r => r.json())
      .then(d => {
        const r = (d.results || {})[region] || {};
        const streaming = [...(r.flatrate || []), ...(r.free || []), ...(r.ads || [])];
        const seen = new Set();
        const entry = {
          at: Date.now(),
          link: r.link || '',
          stream: streaming.filter(p => !seen.has(p.provider_id) && seen.add(p.provider_id))
            .slice(0, 4).map(p => ({ name: p.provider_name, logo: p.logo_path })),
          rentOrBuy: !!((r.rent || []).length || (r.buy || []).length),
        };
        watchCache[key] = entry;
        saveWatchCaches();
        return entry;
      })
      .finally(() => { delete watchInFlight[key]; });
  }
  return watchInFlight[key];
}

function renderProviders(entry) {
  if (!entry) return '';
  if (entry.stream.length) {
    return `<span class="providers-label">${t('watchOn')}</span>` + entry.stream.map(p =>
      `<img src="https://image.tmdb.org/t/p/w92${escapeHtml(p.logo)}" alt="${escapeHtml(p.name)}" title="${escapeHtml(p.name)}" loading="lazy">`).join('');
  }
  return entry.rentOrBuy ? `<span class="providers-label">${t('watchRentBuy')}</span>` : `<span class="providers-label">${t('watchNone')}</span>`;
}

// Remplit les emplacements [data-watch] après chaque affichage de la liste
function hydrateProviders() {
  document.querySelectorAll('[data-watch]').forEach(async el => {
    const item = books.find(b => b.id === el.dataset.watch);
    if (!item) return;
    try {
      const entry = await fetchProviders(item);
      if (el.isConnected) el.innerHTML = renderProviders(entry);
    } catch (e) { /* hors connexion : on n'affiche rien */ }
  });
}
