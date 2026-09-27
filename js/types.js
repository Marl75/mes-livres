// ===== TYPES : livres, films, séries, jeux =====
// Un élément sans champ `type` (tous les livres enregistrés avant) est un livre :
// les données existantes restent valables telles quelles.
const TYPES = ['livre', 'film', 'serie', 'jeu'];
const ALL_CATS = ['lu', 'en-cours', 'a-lire', 'abandonne', 'wishlist'];
// Catégories proposées pour chaque type (un film ne se regarde pas « en cours »)
const TYPE_CATS = {
  tout: ALL_CATS,
  livre: ALL_CATS,
  film: ['lu', 'a-lire', 'wishlist'],
  serie: ALL_CATS,
  jeu: ALL_CATS,
};
const PLATFORMS = ['Switch', 'PS5', 'PS4', 'Xbox', 'PC', 'Mac', 'Mobile'];

const TYPE_ICONS = {
  tout: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  livre: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  film: '<rect x="2" y="2" width="20" height="20" rx="2.18"/><path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5"/>',
  serie: '<rect x="2" y="7" width="20" height="15" rx="2"/><polyline points="17 2 12 7 7 2"/>',
  jeu: '<rect x="2" y="6" width="20" height="12" rx="6"/><path d="M6 12h4M8 10v4"/><circle cx="15" cy="13" r="1"/><circle cx="18" cy="11" r="1"/>',
};
const TYPE_EMOJI = { tout: '✨', livre: '📖', film: '🎬', serie: '📺', jeu: '🎮' };

function typeIcon(type, size) {
  return `<svg width="${size || 16}" height="${size || 16}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${TYPE_ICONS[type]}</svg>`;
}

function typeOf(item) {
  return TYPES.includes(item.type) ? item.type : 'livre';
}

function catsFor(type) {
  return TYPE_CATS[type] || ALL_CATS;
}

// Texte propre à un type (clé « cle__type »), sinon le texte général (clé « cle »)
function hasKey(key) {
  return I18N[currentLang][key] !== undefined || I18N.fr[key] !== undefined;
}
function tt(key, type, params) {
  return hasKey(`${key}__${type}`) ? t(`${key}__${type}`, params) : t(key, params);
}
function ttn(key, type, n, params) {
  const one = currentLang === 'fr' ? n <= 1 : n === 1;
  return tt(key + (one ? '_one' : '_other'), type, { n, ...params });
}

function catLabel(cat, type) {
  return tt('cat_' + cat, type || 'livre');
}

// Libellé d'une catégorie au singulier (« Vu », « À lire »…) pour un type donné
function catOneLabel(cat, type) {
  const key = 'catOne_' + cat;
  const label = tt(key, type);
  return label !== key ? label : catLabel(cat, type);
}

// ----- Onglet de type et catégorie, mémorisés sur l'appareil -----
const TYPE_KEY = 'mes-livres-type';
const CATS_KEY = 'mes-livres-cats';
let currentType = 'tout';
let catByType = {};
try {
  const savedType = localStorage.getItem(TYPE_KEY);
  if (savedType === 'tout' || TYPES.includes(savedType)) currentType = savedType;
  catByType = JSON.parse(localStorage.getItem(CATS_KEY) || '{}') || {};
} catch (e) {}

function rememberView() {
  try {
    localStorage.setItem(TYPE_KEY, currentType);
    localStorage.setItem(CATS_KEY, JSON.stringify(catByType));
  } catch (e) {}
}

// Affichage en cartes ou en affiches, mémorisé par onglet (affiches par défaut pour films et séries)
const VIEWS_KEY = 'mes-livres-views';
let viewByType = {};
try { viewByType = JSON.parse(localStorage.getItem(VIEWS_KEY) || '{}') || {}; } catch (e) {}

function viewMode() {
  return viewByType[currentType] || (currentType === 'film' || currentType === 'serie' ? 'posters' : 'cards');
}

// Éléments du profil dans l'onglet de type courant
function scopedItems() {
  return currentType === 'tout' ? books : books.filter(b => typeOf(b) === currentType);
}
