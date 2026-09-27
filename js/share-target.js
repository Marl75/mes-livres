// ===== AJOUT DEPUIS LE BOUTON « PARTAGER » DU TÉLÉPHONE =====
// L'appli installée apparaît dans le menu Partager d'Android (voir « share_target » dans
// manifest.json). Elle reçoit alors ?title=…&text=…&url=… et ouvre le formulaire d'ajout
// avec une recherche déjà lancée.
let pendingShare = null;

(function readSharedParams() {
  const params = new URLSearchParams(location.search);
  const shared = { title: params.get('title') || '', text: params.get('text') || '', url: params.get('url') || '' };
  if (!shared.title && !shared.text && !shared.url) return;
  pendingShare = shared;
  // On retire les paramètres de l'adresse pour ne pas rouvrir le formulaire au prochain chargement
  history.replaceState(null, '', location.pathname);
})();

const SHARE_SITES = [
  // [morceau d'adresse, type ('?' = film ou série, décidé par TMDB)]
  ['allocine.fr/series', 'serie'], ['allocine.fr/film', 'film'], ['senscritique.com/serie', 'serie'],
  ['senscritique.com/film', 'film'], ['senscritique.com/livre', 'livre'], ['senscritique.com/jeuvideo', 'jeu'],
  ['themoviedb.org/tv', 'serie'], ['themoviedb.org/movie', 'film'], ['justwatch.com', '?'], ['letterboxd.com', 'film'],
  ['imdb.com', '?'], ['netflix.com', '?'], ['primevideo.com', '?'], ['disneyplus.com', '?'], ['canalplus.com', '?'],
  ['max.com', '?'], ['tv.apple.com', '?'], ['arte.tv', '?'], ['france.tv', '?'],
  ['steampowered.com', 'jeu'], ['nintendo.', 'jeu'], ['playstation.com', 'jeu'], ['xbox.com', 'jeu'], ['gog.com', 'jeu'],
  ['epicgames.com', 'jeu'], ['rawg.io', 'jeu'], ['jeuxvideo.com', 'jeu'], ['metacritic.com/game', 'jeu'],
  ['babelio.com', 'livre'], ['goodreads.com', 'livre'], ['openlibrary.org', 'livre'], ['decitre.fr', 'livre'],
  ['leslibraires.fr', 'livre'], ['fnac.com', 'livre'], ['/gp/video', '?'], ['amazon.', 'livre'], ['gallimard.fr', 'livre'],
];

function guessSharedType(shared) {
  const hay = (shared.url + ' ' + shared.text).toLowerCase();
  const site = SHARE_SITES.find(([part]) => hay.includes(part));
  return site ? site[1] : null;
}

// Extrait un titre exploitable du texte partagé
function sharedQuery(shared) {
  const all = `${shared.title} ${shared.text} ${shared.url}`;
  const isbn = all.match(/\b(97[89]\d{10}|\d{9}[\dX])\b/);
  if (isbn && guessSharedType(shared) === 'livre') return isbn[1];
  let text = (shared.title || shared.text || '').replace(/https?:\/\/\S+/g, ' ').trim();
  const quoted = text.match(/[«“"]\s*([^»”"]+?)\s*[»”"]/);
  if (quoted) text = quoted[1];
  text = text.split(/\s[|–—-]\s/)[0]
    .replace(/^(regarde|découvre|check out|watch|voici|je te recommande)\s+/i, '')
    .replace(/\s+(sur|on)\s+(netflix|prime video|disney\+?|canal\+?|max|apple tv\+?|steam|gog(\.com)?|epic games( store)?|playstation store|nintendo eshop|xbox|babelio|goodreads|allociné|allocine|imdb)\s*$/i, '')
    .trim();
  if (!text && shared.url) {
    // Dernier recours : le texte de l'adresse (« mon-titre-2024 » → « mon titre »)
    const parts = new URL(shared.url).pathname.split('/').filter(p => p && !/^\d+$/.test(p) && p.length > 2);
    text = (parts.pop() || '').replace(/[-_]+/g, ' ').replace(/\b\d{4,}\b/g, '').trim();
  }
  return text;
}

async function handleSharedItem() {
  if (!pendingShare || !currentUser) return;
  const shared = pendingShare;
  pendingShare = null;
  const query = sharedQuery(shared);
  let type = guessSharedType(shared);
  if ((type === '?' || !type) && query && TMDB_KEY && !/^\d+$/.test(query)) {
    // Film ou série ? On demande à TMDB ce que ce titre est le plus probablement
    try {
      const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&language=${locale()}&query=${encodeURIComponent(query)}`);
      const top = ((await res.json()).results || []).find(r => r.media_type === 'movie' || r.media_type === 'tv');
      if (top) type = top.media_type === 'tv' ? 'serie' : 'film';
    } catch (e) {}
  }
  if (!TYPES.includes(type)) type = TYPES.includes(currentType) ? currentType : 'livre';
  openModal();
  pickType(type);
  if (!query) return;
  if (lookupAvailable(type)) {
    document.getElementById('f-lookup').value = query;
    runLookup(query);
  } else {
    document.getElementById('f-titre').value = query;
    checkDuplicate();
  }
}
