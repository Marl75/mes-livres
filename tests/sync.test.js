// Tests de la fusion entre appareils (js/sync.js) : node --test tests/
// Chaque test simule deux appareils qui modifient la même collection, puis vérifie
// qu'aucun ajout, modification ou suppression ne se perd à l'envoi.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { TOMBSTONE_TTL, MAX_DOC_BYTES, mergeData, mergeStamps, replaceBooks, replaceAllProfiles, docSize } = require('../js/sync.js');

// Référence : 6 mois après l'an 1970, pour que les petites dates des tests ne soient pas
// prises pour des traces de suppression trop anciennes
const NOW = TOMBSTONE_TTL;
const DAY = 24 * 3600 * 1000;

const book = (id, updatedAt, extra = {}) => ({ id, title: id, updatedAt, ...extra });
const profile = (id, books = [], extra = {}) => ({ id, name: id, updatedAt: 1, books, deletedBooks: {}, ...extra });
const ids = p => p.books.map(b => b.id).sort();
const clone = x => JSON.parse(JSON.stringify(x));

// Fusionne dans les deux sens et vérifie que le résultat ne dépend pas de qui envoie en premier
function mergeBoth(a, b) {
  const ab = mergeData(a, b, NOW);
  const ba = mergeData(b, a, NOW);
  const norm = d => d.profiles.map(p => ({ id: p.id, books: ids(p) })).sort((x, y) => x.id.localeCompare(y.id));
  assert.deepEqual(norm(ab), norm(ba), 'le résultat dépend de l\'ordre');
  return ab;
}

test('premier envoi : document en ligne vide', () => {
  const local = { profiles: [profile('p1', [book('a', 1)])] };
  const m = mergeData({}, local, NOW);
  assert.deepEqual(ids(m.profiles[0]), ['a']);
});

test('ajouts sur deux appareils : les deux livres restent', () => {
  const base = { profiles: [profile('p1', [book('a', 1)])] };
  const phone = clone(base); phone.profiles[0].books.push(book('b', 10));
  const laptop = clone(base); laptop.profiles[0].books.push(book('c', 11));
  const m = mergeBoth(phone, laptop);
  assert.deepEqual(ids(m.profiles[0]), ['a', 'b', 'c']);
});

test('même livre modifié des deux côtés : la modification la plus récente gagne', () => {
  const phone = { profiles: [profile('p1', [book('a', 20, { rating: 5 })])] };
  const laptop = { profiles: [profile('p1', [book('a', 10, { rating: 2 })])] };
  const m = mergeBoth(phone, laptop);
  assert.equal(m.profiles[0].books[0].rating, 5);
});

test('à égalité de date (anciennes données sans date), la version locale gagne', () => {
  const remote = { profiles: [profile('p1', [{ id: 'a', note: 'en ligne' }])] };
  const local = { profiles: [profile('p1', [{ id: 'a', note: 'local' }])] };
  assert.equal(mergeData(remote, local, NOW).profiles[0].books[0].note, 'local');
});

test('livre supprimé sur un appareil, encore présent sur l\'autre : il ne revient pas', () => {
  const remote = { profiles: [profile('p1', [book('b', 1)], { deletedBooks: { a: 50 } })] };
  const local = { profiles: [profile('p1', [book('a', 10), book('b', 1)])] };
  const m = mergeBoth(remote, local);
  assert.deepEqual(ids(m.profiles[0]), ['b']);
  assert.equal(m.profiles[0].deletedBooks.a, 50);
});

test('livre modifié après sa suppression sur un autre appareil : il revient', () => {
  const remote = { profiles: [profile('p1', [], { deletedBooks: { a: 50 } })] };
  const local = { profiles: [profile('p1', [book('a', 60)])] };
  assert.deepEqual(ids(mergeBoth(remote, local).profiles[0]), ['a']);
});

test('suppression et modification à la même milliseconde : la suppression gagne', () => {
  const remote = { profiles: [profile('p1', [], { deletedBooks: { a: 50 } })] };
  const local = { profiles: [profile('p1', [book('a', 50)])] };
  assert.deepEqual(ids(mergeBoth(remote, local).profiles[0]), []);
});

test('import d\'une sauvegarde contenant un livre supprimé auparavant : il revient', () => {
  // Le livre a été supprimé (trace en ligne), puis la sauvegarde qui le contient est réimportée
  const remote = { profiles: [profile('p1', [], { deletedBooks: { a: NOW - DAY } })] };
  const local = { profiles: [profile('p1', [])] };
  replaceBooks(local.profiles[0], [book('a', 1)], NOW);
  assert.deepEqual(ids(mergeData(remote, local, NOW).profiles[0]), ['a']);
});

test('import : les livres absents de la sauvegarde sont supprimés partout', () => {
  const remote = { profiles: [profile('p1', [book('a', 1), book('b', 1)])] };
  const local = clone(remote);
  replaceBooks(local.profiles[0], [book('a', 1)], NOW);
  const m = mergeData(remote, local, NOW);
  assert.deepEqual(ids(m.profiles[0]), ['a']);
});

test('profils ajoutés sur deux appareils : les deux restent', () => {
  const phone = { profiles: [profile('p1'), profile('p2')] };
  const laptop = { profiles: [profile('p1'), profile('p3')] };
  assert.deepEqual(mergeBoth(phone, laptop).profiles.map(p => p.id).sort(), ['p1', 'p2', 'p3']);
});

test('profil supprimé sur un appareil : il ne revient pas depuis l\'autre', () => {
  const remote = { profiles: [profile('p1')], deletedProfiles: { p2: 50 } };
  const local = { profiles: [profile('p1'), profile('p2', [book('x', 10)], { updatedAt: 10 })] };
  assert.deepEqual(mergeBoth(remote, local).profiles.map(p => p.id), ['p1']);
});

test('import complet contenant un profil supprimé auparavant : il revient', () => {
  const remote = { profiles: [profile('p1')], deletedProfiles: { p2: NOW - DAY } };
  const local = { profiles: [profile('p1')], deletedProfiles: {} };
  replaceAllProfiles(local, [profile('p1'), profile('p2', [book('x', 1)])], NOW);
  const m = mergeData(remote, local, NOW);
  assert.deepEqual(m.profiles.map(p => p.id).sort(), ['p1', 'p2']);
  assert.deepEqual(ids(m.profiles.find(p => p.id === 'p2')), ['x']);
});

test('nom de profil modifié sur un appareil, livre ajouté sur l\'autre : les deux sont gardés', () => {
  const phone = { profiles: [profile('p1', [book('a', 1)], { name: 'Marlène', updatedAt: 30 })] };
  const laptop = { profiles: [profile('p1', [book('a', 1), book('b', 20)])] };
  const m = mergeBoth(phone, laptop);
  assert.equal(m.profiles[0].name, 'Marlène');
  assert.deepEqual(ids(m.profiles[0]), ['a', 'b']);
});

test('les traces de suppression de plus de 6 mois sont effacées', () => {
  const out = mergeStamps({ old: NOW - TOMBSTONE_TTL - 1, recent: NOW - DAY }, {}, NOW);
  assert.deepEqual(Object.keys(out), ['recent']);
});

test('traces de suppression : la plus récente des deux est gardée', () => {
  assert.deepEqual(mergeStamps({ a: 10, b: 30 }, { a: 20, b: 5 }, 40), { a: 20, b: 30 });
});

test('la fusion ne modifie pas les données d\'origine', () => {
  const remote = { profiles: [profile('p1', [book('a', 1)])], deletedProfiles: { p9: NOW } };
  const local = { profiles: [profile('p1', [book('b', 2)])] };
  const before = clone([remote, local]);
  mergeData(remote, local, NOW);
  assert.deepEqual([remote, local], before);
});

test('fusion répétée : le résultat ne change plus (pas de doublons)', () => {
  const remote = { profiles: [profile('p1', [book('a', 1)])] };
  const local = { profiles: [profile('p1', [book('a', 2), book('b', 3)])] };
  const once = mergeData(remote, local, NOW);
  const twice = mergeData(once, local, NOW);
  assert.deepEqual(twice, once);
});

test('taille du document : les accents comptent pour 2 octets', () => {
  assert.equal(docSize({ t: 'é' }), JSON.stringify({ t: 'x' }).length + 1);
  assert.ok(docSize({ big: 'x'.repeat(MAX_DOC_BYTES) }) > MAX_DOC_BYTES);
});

test('types affichés : le réglage passe d\'un appareil à l\'autre, sans rien supprimer', () => {
  const base = { profiles: [profile('p1', [book('a', 1, { type: 'livre' })])] };
  // Téléphone : ne garde que les livres ; ordinateur : ajoute un film en même temps
  const phone = clone(base); Object.assign(phone.profiles[0], { types: ['livre'], updatedAt: 10 });
  const laptop = clone(base); laptop.profiles[0].books.push(book('f', 11, { type: 'film' }));
  const m = mergeBoth(phone, laptop);
  assert.deepEqual(m.profiles[0].types, ['livre']);
  assert.deepEqual(ids(m.profiles[0]), ['a', 'f'], 'le film est masqué, pas supprimé');
  // Tout réaffiché (réglage retiré) sur l'ordinateur, plus récent : le téléphone le reçoit
  const laptop2 = clone(m); delete laptop2.profiles[0].types; laptop2.profiles[0].updatedAt = 20;
  const m2 = mergeData(m, laptop2, NOW);
  assert.equal(m2.profiles[0].types, undefined);
  assert.deepEqual(ids(m2.profiles[0]), ['a', 'f']);
});
