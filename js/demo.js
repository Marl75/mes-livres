// ===== MODE DÉMO =====
// ?demo dans l'adresse : l'appli s'ouvre sans compte sur une collection d'exemple.
// Rien n'est enregistré (ni en ligne, ni sur l'appareil) : tout disparaît au rechargement.
// Seule l'ouverture est comptée, de façon anonyme (countDemoOpening).
function demoItems() {
  const en = currentLang === 'en';
  const ol = isbn => `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
  const day = (y, m, d) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const items = [
    { type: 'livre', titre: 'Project Hail Mary', auteur: 'Andy Weir', categorie: 'lu', note: 5, cover: ol('9780593135204'), dateFinished: day(2026, 8, 14), tags: ['sci-fi'],
      avis: en ? 'Clever, funny and moving. Could not put it down.' : 'Malin, drôle et émouvant. Impossible à lâcher.' },
    { type: 'livre', titre: 'Sapiens', auteur: 'Yuval Noah Harari', categorie: 'lu', note: 4, cover: ol('9780062316097'), dateFinished: day(2026, 3, 2), tags: [en ? 'history' : 'histoire'],
      avis: en ? 'A big picture of human history, full of ideas to discuss.' : 'Une grande fresque de l’histoire humaine, plein d’idées à discuter.' },
    { type: 'livre', titre: 'Inspired', auteur: 'Marty Cagan', categorie: 'lu', note: 5, cover: ol('9781119387503'), dateFinished: day(2025, 11, 20), tags: ['product'],
      avis: en ? 'The reference on building products customers love.' : 'La référence pour construire des produits que les clients adorent.' },
    { type: 'livre', titre: 'The Midnight Library', auteur: 'Matt Haig', categorie: 'lu', note: 4, cover: ol('9780525559474'), dateFinished: day(2025, 7, 8), tags: ['feel-good'] },
    { type: 'livre', titre: 'Atomic Habits', auteur: 'James Clear', categorie: 'en-cours', note: 0, cover: ol('9780735211292'), tags: [en ? 'personal growth' : 'développement perso'] },
    { type: 'livre', titre: 'Dune', auteur: 'Frank Herbert', categorie: 'a-lire', note: 0, cover: ol('9780441172719'), tags: ['sci-fi'] },
    { type: 'livre', titre: 'The Little Prince', auteur: 'Antoine de Saint-Exupéry', categorie: 'wishlist', note: 0, cover: ol('9780156012195'), recoBy: 'Sophie', tags: [en ? 'classic' : 'classique'] },
    { type: 'film', titre: 'Dune: Part Two', auteur: 'Denis Villeneuve', annee: 2024, categorie: 'lu', note: 5, dateFinished: day(2026, 5, 18), tags: ['sci-fi'],
      avis: en ? 'Stunning on the big screen.' : 'Grandiose sur grand écran.' },
    { type: 'film', titre: 'Past Lives', auteur: 'Celine Song', annee: 2023, categorie: 'lu', note: 4, dateFinished: day(2026, 1, 25), tags: [en ? 'drama' : 'drame'] },
    { type: 'film', titre: 'Inception', auteur: 'Christopher Nolan', annee: 2010, categorie: 'a-lire', note: 0, tags: ['sci-fi'] },
    { type: 'serie', titre: 'The Bear', auteur: 'Christopher Storer', annee: 2022, categorie: 'en-cours', note: 0, progression: en ? 'season 3 next' : 'saison 3 ensuite', tags: [en ? 'drama' : 'drame'] },
    { type: 'serie', titre: 'Severance', auteur: 'Dan Erickson', annee: 2022, categorie: 'lu', note: 5, dateFinished: day(2026, 4, 3), tags: ['sci-fi'] },
    { type: 'jeu', titre: 'The Legend of Zelda: Tears of the Kingdom', auteur: 'Nintendo', annee: 2023, plateforme: 'Switch', categorie: 'en-cours', note: 0, tags: [en ? 'adventure' : 'aventure'] },
    { type: 'jeu', titre: 'Hades', auteur: 'Supergiant Games', annee: 2020, plateforme: 'PC', categorie: 'lu', note: 5, dateFinished: day(2026, 2, 11), tags: ['roguelike'] },
    { type: 'jeu', titre: 'Stardew Valley', auteur: 'ConcernedApe', annee: 2016, plateforme: 'Switch', categorie: 'wishlist', note: 0, recoBy: 'Léa', tags: ['cosy'] },
  ];
  const now = Date.now();
  return items.map((it, i) => ({
    avis: '', recoBy: '', cover: '', dateFinished: null, annee: null, plateforme: '', progression: '', tags: [],
    ...it, id: `demo-${i}`, dateAdded: now - i * 86400000, updatedAt: now,
  }));
}

// Compteur anonyme des ouvertures de la démo (page de suivi marl75.github.io/admin) :
// un événement GoatCounter « collection-demo » sur le site marlenemenoire, sans cookie ni
// identifiant, et rien sur la collection. Seulement les ouvertures qui ne viennent pas du site :
// celles-là y sont déjà comptées (clic-demo), on peut donc additionner les deux sans doublon.
// Pas compté en local, ni sur un appareil où le site a été ouvert avec #toggle-goatcounter
// (GoatCounter ne se souvient de ce réglage que sur le site : ici, ouvrir ?demo#toggle-goatcounter).
function countDemoOpening() {
  try {
    if (location.hash === '#toggle-goatcounter') {
      const skip = localStorage.getItem('skipgc') === 't';
      skip ? localStorage.removeItem('skipgc') : localStorage.setItem('skipgc', 't');
      alert(skip ? 'GoatCounter : ouvertures de la démo à nouveau comptées sur cet appareil.' : 'GoatCounter : ouvertures de la démo plus comptées sur cet appareil.');
      return;
    }
    if (localStorage.getItem('skipgc') === 't') return;
  } catch (e) { /* stockage local bloqué : on compte quand même */ }
  if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname) || navigator.webdriver) return;
  let from = '';
  try { from = document.referrer ? new URL(document.referrer).hostname : ''; } catch (e) { /* adresse illisible */ }
  if (/(^|\.)marlenemenoire\.com$/.test(from)) return;
  const url = 'https://marlenemenoire.goatcounter.com/count?e=true&p=collection-demo&t=' + encodeURIComponent('Démo Collection')
    + (from ? '&r=' + encodeURIComponent('https://' + from) : '') + '&rnd=' + Math.random().toString(36).slice(2);
  try { if (navigator.sendBeacon && navigator.sendBeacon(url)) return; } catch (e) { /* repli sur l'image */ }
  new Image().src = url;
}

function startDemo() {
  countDemoOpening();
  state = { profiles: [{ id: 'demo', name: 'Demo', color: PROFILE_COLORS[0], books: demoItems(), createdAt: Date.now() }], deletedProfiles: {}, currentId: 'demo' };
  bindBooksToProfile();
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-container').style.display = '';
  refreshUI();
  setSyncStatus(t('demoBanner'));
}
