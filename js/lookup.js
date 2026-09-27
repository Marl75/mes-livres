// ===== REMPLISSAGE AUTOMATIQUE =====
// Livres : Google Books + Open Library (sans clé). Films et séries : TMDB. Jeux : RAWG.
// Ces clés ne donnent accès qu'à des fiches publiques, en lecture seule : comme la
// configuration Firebase, elles peuvent figurer dans le code de l'appli.
const TMDB_KEY = '580753634de21f5801eed720e022c2b5';
const RAWG_KEY = '0ee3d95391e3443487b5386446eb2621';
const TMDB_IMG = 'https://image.tmdb.org/t/p/w342';

let lookupTimer = null;
let lookupSeq = 0;
let lookupResults = [];
let lookupIndex = -1;
let pickedTmdb = null;   // identifiant TMDB du résultat choisi (pour « Où regarder »)

function lookupAvailable(type) {
  if (type === 'film' || type === 'serie') return !!TMDB_KEY;
  if (type === 'jeu') return !!RAWG_KEY;
  return true;
}

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

// ----- Genres, ajoutés en tags (deux au plus) -----
const MAX_GENRES = 2;
// Sujets de livres (Open Library, Google Books) reconnus : [mots-clés, tag fr, tag en]
const BOOK_GENRES = [
  [['science fiction', 'science-fiction'], 'science-fiction', 'science fiction'],
  [['fantasy'], 'fantasy', 'fantasy'],
  [['detective', 'mystery', 'crime', 'policier'], 'policier', 'crime'],
  [['thriller', 'suspense'], 'thriller', 'thriller'],
  [['horror', 'horreur'], 'horreur', 'horror'],
  [['romance', 'love stories'], 'romance', 'romance'],
  [['biograph'], 'biographie', 'biography'],
  [['comic', 'graphic novel', 'bandes dessin'], 'bd', 'comics'],
  [['juvenile', 'children', 'jeunesse'], 'jeunesse', 'children'],
  [['poetry', 'poésie'], 'poésie', 'poetry'],
  [['philosoph'], 'philosophie', 'philosophy'],
  [['history', 'histoire'], 'histoire', 'history'],
  [['humor', 'humour'], 'humour', 'humour'],
  [['essay', 'essais'], 'essai', 'essay'],
  [['classic'], 'classique', 'classic'],
];
const RAWG_GENRES_FR = {
  'action': 'action', 'indie': 'indé', 'adventure': 'aventure', 'rpg': 'rpg', 'strategy': 'stratégie',
  'shooter': 'tir', 'casual': 'casual', 'simulation': 'simulation', 'puzzle': 'réflexion', 'arcade': 'arcade',
  'platformer': 'plateforme', 'massively multiplayer': 'mmo', 'racing': 'course', 'sports': 'sport',
  'fighting': 'combat', 'family': 'famille', 'board games': 'jeu de société', 'card': 'cartes', 'educational': 'éducatif',
};
const TMDB_GENRES_FIX = {
  fr: { 'action & adventure': 'action', 'war & politics': 'guerre', 'kids': 'jeunesse', 'reality': 'téléréalité', 'soap': 'feuilleton', 'news': 'actualité', 'talk': 'talk-show', 'sci-fi & fantasy': 'science-fiction' },
  en: { 'action & adventure': 'action', 'war & politics': 'war', 'sci-fi & fantasy': 'science fiction' },
};
const tmdbGenreLists = {};

function bookGenres(subjects) {
  const text = (subjects || []).join(' | ').toLowerCase();
  const found = BOOK_GENRES.filter(([keys]) => keys.some(k => text.includes(k))).map(g => currentLang === 'fr' ? g[1] : g[2]);
  return [...new Set(found)].slice(0, MAX_GENRES);
}

async function tmdbGenreNames(kind, ids) {
  const key = kind + '|' + currentLang;
  if (!tmdbGenreLists[key]) {
    tmdbGenreLists[key] = fetch(`https://api.themoviedb.org/3/genre/${kind}/list?api_key=${TMDB_KEY}&language=${locale()}`)
      .then(r => r.json()).then(d => Object.fromEntries((d.genres || []).map(g => [g.id, g.name]))).catch(() => ({}));
  }
  const names = await tmdbGenreLists[key];
  const fix = TMDB_GENRES_FIX[currentLang] || {};
  return [...new Set((ids || []).map(id => names[id]).filter(Boolean).map(n => {
    const low = n.toLowerCase();
    return fix[low] || low.split(' & ')[0];
  }))].slice(0, MAX_GENRES);
}

function rawgGenres(genres) {
  return [...new Set((genres || []).map(g => {
    const low = (g.name || '').toLowerCase();
    return currentLang === 'fr' ? (RAWG_GENRES_FR[low] || low) : low;
  }).filter(Boolean))].slice(0, MAX_GENRES);
}

// ----- Livres -----
async function searchGoogleBooks(q, isbn) {
  const query = isbn ? 'isbn:' + isbn : q;
  const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=6&printType=books`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items || []).map(it => {
    const v = it.volumeInfo || {};
    const img = (v.imageLinks && (v.imageLinks.thumbnail || v.imageLinks.smallThumbnail)) || '';
    return {
      titre: v.title || '',
      auteur: (v.authors || []).slice(0, 2).join(', '),
      cover: img.replace(/^http:/, 'https:').replace('&edge=curl', ''),
      genres: bookGenres(v.categories),
    };
  }).filter(r => r.titre);
}

async function searchOpenLibrary(q, isbn) {
  const params = isbn ? 'isbn=' + isbn : 'q=' + encodeURIComponent(q);
  const res = await fetch(`https://openlibrary.org/search.json?${params}&limit=6&lang=fr&fields=title,author_name,cover_i,subject`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.docs || []).map(d => ({
    titre: d.title || '',
    auteur: (d.author_name || []).slice(0, 2).join(', '),
    cover: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : '',
    genres: bookGenres(d.subject),
  })).filter(r => r.titre);
}

async function searchBooks(q) {
  const compact = q.replace(/[-\s]/g, '');
  const isbn = /^(97[89])?\d{9}[\dXx]$/.test(compact) ? compact : null;
  const [gb, ol] = await Promise.all([
    searchGoogleBooks(q, isbn).catch(() => []),
    searchOpenLibrary(q, isbn).catch(() => []),
  ]);
  // Fusionne en gardant la version la plus complète de chaque livre
  const merged = new Map();
  [...gb, ...ol].forEach(r => {
    const key = normalize(r.titre) + '|' + normalize(r.auteur.split(',')[0]);
    const prev = merged.get(key);
    if (!prev) merged.set(key, r);
    else merged.set(key, { ...prev, cover: prev.cover || r.cover, genres: prev.genres && prev.genres.length ? prev.genres : r.genres });
  });
  // Classe par pertinence : les mots tapés présents dans le titre/auteur (favorise l'édition française)
  const words = normalize(q).split(' ').filter(Boolean);
  const score = r => {
    const hay = ' ' + normalize(r.titre + ' ' + r.auteur) + ' ';
    return words.filter(w => hay.includes(' ' + w)).length / (words.length || 1) + (r.cover ? 0.01 : 0);
  };
  return [...merged.values()]
    .map((r, i) => ({ r, s: score(r), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map(x => x.r);
}

// ----- Films et séries (TMDB) -----
async function searchTmdb(kind, q) {
  const res = await fetch(`https://api.themoviedb.org/3/search/${kind}?api_key=${TMDB_KEY}&language=${locale()}&include_adult=false&query=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return Promise.all((data.results || []).map(async r => ({
    titre: r.title || r.name || '',
    auteur: '',
    annee: parseInt((r.release_date || r.first_air_date || '').slice(0, 4), 10) || null,
    cover: r.poster_path ? TMDB_IMG + r.poster_path : '',
    // Le réalisateur ou le créateur demande un second appel, fait seulement pour le résultat choisi
    details: () => tmdbCreators(kind, r.id),
    genres: await tmdbGenreNames(kind, r.genre_ids),
    tmdb: { kind, id: r.id },
  }))).then(list => list.filter(r => r.titre));
}

async function tmdbCreators(kind, id) {
  if (kind === 'movie') {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${id}/credits?api_key=${TMDB_KEY}`);
    const data = await res.json();
    return (data.crew || []).filter(c => c.job === 'Director').slice(0, 2).map(c => c.name).join(', ');
  }
  const res = await fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${TMDB_KEY}&language=${locale()}`);
  const data = await res.json();
  return (data.created_by || []).slice(0, 2).map(c => c.name).join(', ');
}

// ----- Jeux vidéo (RAWG) -----
async function searchRawg(q) {
  const res = await fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(q)}&page_size=8`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map(g => ({
    titre: g.name || '',
    auteur: '',
    annee: parseInt((g.released || '').slice(0, 4), 10) || null,
    cover: g.background_image ? g.background_image.replace('/media/', '/media/resize/420/-/') : '',
    platforms: (g.platforms || []).map(p => p.platform && p.platform.name).filter(Boolean),
    genres: rawgGenres(g.genres),
    details: () => rawgDevelopers(g.id),
  })).filter(r => r.titre);
}

async function rawgDevelopers(id) {
  const res = await fetch(`https://api.rawg.io/api/games/${id}?key=${RAWG_KEY}`);
  const data = await res.json();
  return (data.developers || []).slice(0, 2).map(d => d.name).join(', ');
}

// ----- Champ de recherche -----
function onLookupInput() {
  clearTimeout(lookupTimer);
  const q = document.getElementById('f-lookup').value.trim();
  if (q.length < 2) { hideLookup(); return; }
  lookupTimer = setTimeout(() => runLookup(q), 350);
}

async function runLookup(q) {
  const seq = ++lookupSeq;
  const type = document.getElementById('f-type').value || 'livre';
  const box = document.getElementById('lookup-results');
  box.innerHTML = `<div class="lookup-empty">${t('searching')}</div>`;
  box.classList.add('active');
  let results = [];
  try {
    if (type === 'film') results = await searchTmdb('movie', q);
    else if (type === 'serie') results = await searchTmdb('tv', q);
    else if (type === 'jeu') results = await searchRawg(q);
    else results = await searchBooks(q);
  } catch (e) {
    console.warn('Recherche impossible :', e);
  }
  if (seq !== lookupSeq) return;
  lookupResults = results.slice(0, 8);
  lookupIndex = -1;
  if (!lookupResults.length) {
    box.innerHTML = `<div class="lookup-empty">${t('noneFound')}</div>`;
    return;
  }
  box.innerHTML = lookupResults.map((r, i) => {
    const sub = [r.auteur, r.annee, (r.platforms || []).slice(0, 3).join(', ')].filter(Boolean).join(' · ');
    return `
    <div class="lookup-item" data-i="${i}" onmousedown="event.preventDefault(); pickLookup(${i})">
      ${r.cover ? `<img src="${escapeHtml(r.cover)}" alt="" loading="lazy" onerror="this.outerHTML='<span class=noimg></span>'">` : '<span class="noimg"></span>'}
      <div>
        <div class="t">${escapeHtml(r.titre)}</div>
        <div class="a">${escapeHtml(sub)}</div>
      </div>
    </div>`;
  }).join('');
}

function hideLookup() {
  lookupSeq++;
  document.getElementById('lookup-results').classList.remove('active');
}

function pickLookup(i) {
  const r = lookupResults[i];
  if (!r) return;
  const titre = document.getElementById('f-titre');
  const auteur = document.getElementById('f-auteur');
  titre.value = r.titre;
  auteur.value = r.auteur;
  if (r.cover) document.getElementById('f-cover').value = r.cover;
  if (r.annee) document.getElementById('f-year').value = r.annee;
  if (r.genres && r.genres.length) {
    r.genres.forEach(g => { if (!currentTags.includes(g)) currentTags.push(g); });
    renderTagEditor();
  }
  pickedTmdb = r.tmdb || null;
  updateCoverPreview();
  checkDuplicate();
  document.getElementById('f-lookup').value = '';
  hideLookup();
  if (r.details) {
    r.details().then(name => {
      // Ne remplit que si la fiche n'a pas changé entre-temps
      if (name && titre.value === r.titre && !auteur.value.trim()) auteur.value = name;
    }).catch(() => {});
  }
}

