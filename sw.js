// Service worker de Collection : permet d'ouvrir l'appli sans connexion.
// - Fichiers de l'appli : réseau d'abord (on reçoit toujours la dernière version),
//   copie locale seulement si le réseau manque.
// - Bibliothèques Firebase et polices (adresses versionnées) : copie locale d'abord.
// - Données (Firestore, connexion, recherches TMDB/RAWG/Open Library) : jamais interceptées.
const CACHE = 'collection-v2';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/i18n.js',
  './js/types.js',
  './js/data.js',
  './js/lookup.js',
  './js/scanner.js',
  './js/watch.js',
  './js/share-target.js',
  './js/app.js',
  './js/retro.js',
  './js/share.js',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico',
];
const LIBS = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
];
const STATIC_HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // Un fichier qui échoue ne doit pas empêcher l'installation
    await Promise.all([...CORE, ...LIBS].map(url => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req));
  } else if (STATIC_HOSTS.includes(url.hostname) && (url.hostname !== 'www.gstatic.com' || url.pathname.startsWith('/firebasejs/'))) {
    event.respondWith(cacheFirst(req));
  }
  // Tout le reste (Firestore, authentification, API de recherche, couvertures) passe normalement
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    // Hors connexion : la copie locale, en ignorant le numéro de version (?v=…)
    const cached = await cache.match(req, { ignoreSearch: true })
      || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}
