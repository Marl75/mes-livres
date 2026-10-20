// ===== FUSION ENTRE APPAREILS =====
// Chaque livre et chaque profil porte une date de modification (updatedAt) et chaque
// suppression laisse une trace datée (deletedBooks / deletedProfiles). À chaque envoi,
// on relit la version en ligne et on fusionne élément par élément : un appareil ne peut
// plus écraser ce qu'un autre vient d'ajouter. Le format reste celui d'avant (un seul
// document par compte), donc aucune migration n'est nécessaire.
// Fonctions sans effet de bord, utilisées par data.js et vérifiées par tests/sync.test.js.
const TOMBSTONE_TTL = 180 * 24 * 3600 * 1000;   // les traces de suppression sont gardées 6 mois
const MAX_DOC_BYTES = 1024 * 1024;                // Firestore limite un document à 1 Mo
const SIZE_WARNING = 800 * 1024;                  // au-delà, on prévient

// Garde la version la plus récente ; à égalité (anciennes données sans date), la version locale
function newest(local, remote) {
  return (remote.updatedAt || 0) > (local.updatedAt || 0) ? remote : local;
}

// Un élément est supprimé si sa trace de suppression est au moins aussi récente que sa
// dernière modification : un élément réimporté ou modifié après coup revient.
function isDeleted(item, stamps) {
  const ts = stamps[item.id];
  return !!ts && ts >= (item.updatedAt || 0);
}

function mergeStamps(a, b, now = Date.now()) {
  const out = { ...(a || {}) };
  Object.entries(b || {}).forEach(([id, ts]) => { if (!out[id] || ts > out[id]) out[id] = ts; });
  const limit = now - TOMBSTONE_TTL;
  Object.keys(out).forEach(id => { if (out[id] < limit) delete out[id]; });
  return out;
}

function mergeData(remote, local, now = Date.now()) {
  const deletedProfiles = mergeStamps(remote.deletedProfiles, local.deletedProfiles, now);
  const pairs = new Map();
  (remote.profiles || []).forEach(p => pairs.set(p.id, { r: p }));
  (local.profiles || []).forEach(p => pairs.set(p.id, { ...pairs.get(p.id), l: p }));
  const profiles = [];
  pairs.forEach(({ r, l }) => {
    const base = r && l ? newest(l, r) : (l || r);
    if (isDeleted(base, deletedProfiles)) return;
    const deletedBooks = mergeStamps(r && r.deletedBooks, l && l.deletedBooks, now);
    const byId = new Map();
    ((r && r.books) || []).forEach(b => byId.set(b.id, b));
    ((l && l.books) || []).forEach(b => {
      const other = byId.get(b.id);
      byId.set(b.id, other ? newest(b, other) : b);
    });
    profiles.push({ ...base, books: [...byId.values()].filter(b => !isDeleted(b, deletedBooks)), deletedBooks });
  });
  return { profiles, deletedProfiles };
}

// Remplace tous les livres d'un profil (import) : les anciens sont marqués supprimés
function replaceBooks(profile, imported, now = Date.now()) {
  const keep = new Set(imported.map(b => b.id));
  profile.deletedBooks = { ...(profile.deletedBooks || {}) };
  (profile.books || []).forEach(b => { if (!keep.has(b.id)) profile.deletedBooks[b.id] = now; });
  imported.forEach(b => { delete profile.deletedBooks[b.id]; b.updatedAt = now; });
  profile.books = imported;
}

// Remplace tous les profils de st (import d'une sauvegarde complète)
function replaceAllProfiles(st, imported, now = Date.now()) {
  const keep = new Set(imported.map(p => p.id));
  st.deletedProfiles = { ...(st.deletedProfiles || {}) };
  st.profiles.forEach(p => { if (!keep.has(p.id)) st.deletedProfiles[p.id] = now; });
  st.profiles = imported.map(ip => {
    delete st.deletedProfiles[ip.id];
    const existing = st.profiles.find(p => p.id === ip.id);
    const profile = { ...ip, books: existing ? existing.books : [], deletedBooks: existing ? existing.deletedBooks : {}, updatedAt: now };
    replaceBooks(profile, ip.books || [], now);
    return profile;
  });
}

// Taille approximative du document envoyé à Firestore (en octets)
function docSize(payload) {
  return new TextEncoder().encode(JSON.stringify(payload)).length;
}

if (typeof module !== 'undefined') {
  module.exports = { TOMBSTONE_TTL, MAX_DOC_BYTES, SIZE_WARNING, newest, isDeleted, mergeStamps, mergeData, replaceBooks, replaceAllProfiles, docSize };
}
