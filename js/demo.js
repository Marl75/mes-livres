// ===== MODE DÉMO =====
// ?demo dans l'adresse : l'appli s'ouvre sans compte sur une collection d'exemple.
// Rien n'est enregistré (ni en ligne, ni sur l'appareil) : tout disparaît au rechargement.
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

function startDemo() {
  state = { profiles: [{ id: 'demo', name: 'Demo', color: PROFILE_COLORS[0], books: demoItems(), createdAt: Date.now() }], deletedProfiles: {}, currentId: 'demo' };
  bindBooksToProfile();
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-container').style.display = '';
  refreshUI();
  setSyncStatus(t('demoBanner'));
}
