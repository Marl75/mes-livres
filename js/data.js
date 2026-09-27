// ===== FIREBASE =====
const firebaseConfig = {
  apiKey: "AIzaSyDj2AnlTDxOv_sHD311icF540ijNPMJS2E",
  authDomain: "mes-livres-dafce.firebaseapp.com",
  projectId: "mes-livres-dafce",
  storageBucket: "mes-livres-dafce.firebasestorage.app",
  messagingSenderId: "832888789850",
  appId: "1:832888789850:web:82352a1b18640f89aab163",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== AUTH =====
let currentUser = null;
let authMode = 'login';

function switchAuthTab(mode) {
  authMode = mode;
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && mode === 'login') || (i === 1 && mode === 'register'));
  });
  document.getElementById('auth-name-field').style.display = mode === 'register' ? 'block' : 'none';
  document.getElementById('auth-submit').textContent = mode === 'login' ? t('login') : t('createAccount');
  document.getElementById('auth-reset-btn').style.display = mode === 'login' ? 'block' : 'none';
  document.getElementById('auth-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  document.getElementById('auth-error').classList.remove('visible');
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.classList.add('visible');
}

function translateAuthError(code) {
  return code && code.startsWith('auth/') && I18N.fr[code] ? t(code) : t('authDefault');
}

async function submitAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const btn = document.getElementById('auth-submit');
  if (!email || !password) { showAuthError(t('fillAll')); return; }
  btn.disabled = true;
  btn.textContent = t('loading');
  document.getElementById('auth-error').classList.remove('visible');
  try {
    if (authMode === 'login') {
      await auth.signInWithEmailAndPassword(email, password);
    } else {
      const name = document.getElementById('auth-name').value.trim() || 'Moi';
      const cred = await auth.createUserWithEmailAndPassword(email, password);
      await cred.user.updateProfile({ displayName: name });
    }
  } catch (e) {
    showAuthError(translateAuthError(e.code));
    btn.disabled = false;
    btn.textContent = authMode === 'login' ? t('login') : t('createAccount');
  }
}

async function resetPassword() {
  const email = document.getElementById('auth-email').value.trim();
  if (!email) { showAuthError(t('resetEnterEmail')); return; }
  try {
    await auth.sendPasswordResetEmail(email);
    showAuthError(t('resetSent'));
    document.getElementById('auth-error').style.color = '#6dbfa8';
    document.getElementById('auth-error').style.borderColor = 'rgba(109, 191, 168, 0.3)';
    document.getElementById('auth-error').style.background = 'rgba(109, 191, 168, 0.08)';
  } catch (e) {
    showAuthError(translateAuthError(e.code));
  }
}

function logoutUser() {
  auth.signOut();
}

// Enter key on auth fields
document.getElementById('auth-email').addEventListener('keydown', e => { if (e.key === 'Enter') submitAuth(); });
document.getElementById('auth-password').addEventListener('keydown', e => { if (e.key === 'Enter') submitAuth(); });

// ===== STATE =====
const PROFILE_COLORS = ['#c9a961', '#6dbfa8', '#b899d8', '#d4936a', '#6a9bd4', '#e07a6c', '#a3c971'];
const OLD_STATE_KEY = 'mes-livres-state-v2';
const OLD_STORAGE_KEY = 'mes-livres-v1';
const LOCAL_CACHE_KEY = 'mes-livres-cache';

let state = { profiles: [], deletedProfiles: {}, currentId: null };
let books = [];
let saveTimer = null;
let newProfileColor = PROFILE_COLORS[0];
// Catégorie affichée, mémorisée sur l'appareil pour la retrouver au prochain lancement
// (par onglet de type, cf. types.js ; l'ancienne mémoire unique sert de valeur par défaut)
const CAT_KEY = 'mes-livres-cat';
let currentCat = 'lu';
try {
  const wanted = catByType[currentType] || localStorage.getItem(CAT_KEY);
  if (catsFor(currentType).includes(wanted)) currentCat = wanted;
} catch (e) {}
let currentSearch = '';
let currentRating = 0;
let currentTags = [];
let activeTagFilters = [];
let suggestionIndex = -1;

function newId() { return Date.now() + '-' + Math.random().toString(36).slice(2, 8); }

function getCurrentProfile() {
  return state.profiles.find(p => p.id === state.currentId) || state.profiles[0];
}

function bindBooksToProfile() {
  const p = getCurrentProfile();
  books = p ? p.books : [];
}

function syncBooksToProfile() {
  const p = getCurrentProfile();
  if (p) p.books = books;
}

// ===== SYNCHRONISATION =====
// Chaque livre et chaque profil porte une date de modification (updatedAt) et chaque
// suppression laisse une trace datée (deletedBooks / deletedProfiles). À chaque envoi,
// on relit la version en ligne et on fusionne élément par élément : un appareil ne peut
// plus écraser ce qu'un autre vient d'ajouter. Le format reste celui d'avant (un seul
// document par compte), donc aucune migration n'est nécessaire.
const TOMBSTONE_TTL = 180 * 24 * 3600 * 1000;   // les traces de suppression sont gardées 6 mois
const SIZE_WARNING = 800 * 1024;                  // Firestore limite un document à 1 Mo
const PROFILE_KEY = 'mes-livres-profile';
let unsubscribeRemote = null;
let pendingSave = false;
let retryTimer = null;
let loadedOffline = false;   // l'appli a démarré sans réseau : on recharge au retour de la connexion

function setSyncStatus(msg, type) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.innerHTML = msg ? `<span class="${type || ''}">${msg}</span>` : '';
}

function setSyncBtnState(s) {
  const btn = document.getElementById('sync-btn');
  if (!btn) return;
  btn.classList.remove('syncing', 'synced', 'error');
  if (s) btn.classList.add(s);
}

function userDoc() {
  return db.collection('users').doc(currentUser.uid);
}

function touch(obj) {
  obj.updatedAt = Date.now();
  return obj;
}

// Garde la version la plus récente ; à égalité (anciennes données sans date), la version locale
function newest(local, remote) {
  return (remote.updatedAt || 0) > (local.updatedAt || 0) ? remote : local;
}

function mergeStamps(a, b) {
  const out = { ...(a || {}) };
  Object.entries(b || {}).forEach(([id, ts]) => { if (!out[id] || ts > out[id]) out[id] = ts; });
  const limit = Date.now() - TOMBSTONE_TTL;
  Object.keys(out).forEach(id => { if (out[id] < limit) delete out[id]; });
  return out;
}

function mergeData(remote, local) {
  const deletedProfiles = mergeStamps(remote.deletedProfiles, local.deletedProfiles);
  const pairs = new Map();
  (remote.profiles || []).forEach(p => pairs.set(p.id, { r: p }));
  (local.profiles || []).forEach(p => pairs.set(p.id, { ...pairs.get(p.id), l: p }));
  const profiles = [];
  pairs.forEach(({ r, l }, id) => {
    if (deletedProfiles[id]) return;
    const base = r && l ? newest(l, r) : (l || r);
    const deletedBooks = mergeStamps(r && r.deletedBooks, l && l.deletedBooks);
    const byId = new Map();
    ((r && r.books) || []).forEach(b => byId.set(b.id, b));
    ((l && l.books) || []).forEach(b => {
      const other = byId.get(b.id);
      byId.set(b.id, other ? newest(b, other) : b);
    });
    profiles.push({ ...base, books: [...byId.values()].filter(b => !deletedBooks[b.id]), deletedBooks });
  });
  return { profiles, deletedProfiles };
}

function localData() {
  syncBooksToProfile();
  return { profiles: state.profiles, deletedProfiles: state.deletedProfiles || {} };
}

// Intègre une version venue d'ailleurs sans perdre les changements locaux
function applyRemote(remote) {
  const merged = mergeData(remote, localData());
  state.profiles = merged.profiles;
  state.deletedProfiles = merged.deletedProfiles;
  if (!state.profiles.find(p => p.id === state.currentId)) {
    state.currentId = state.profiles[0] && state.profiles[0].id;
  }
  bindBooksToProfile();
  cacheLocally();
}

function refreshUI() {
  renderProfileSelector();
  render();
  if (document.getElementById('stats-modal').classList.contains('active')) renderStats();
  if (document.getElementById('profile-modal').classList.contains('active')) renderProfileList();
}

// ----- Modifications (appelées par l'interface) -----
function removeBook(id) {
  const p = getCurrentProfile();
  if (!p) return;
  p.deletedBooks = { ...(p.deletedBooks || {}), [id]: Date.now() };
  books = books.filter(b => b.id !== id);
  syncBooksToProfile();
}

function removeProfile(id) {
  state.deletedProfiles = { ...(state.deletedProfiles || {}), [id]: Date.now() };
  state.profiles = state.profiles.filter(x => x.id !== id);
}

// Remplace tous les livres d'un profil (import) : les anciens sont marqués supprimés
function replaceBooks(profile, imported) {
  const keep = new Set(imported.map(b => b.id));
  const now = Date.now();
  profile.deletedBooks = { ...(profile.deletedBooks || {}) };
  (profile.books || []).forEach(b => { if (!keep.has(b.id)) profile.deletedBooks[b.id] = now; });
  imported.forEach(b => { delete profile.deletedBooks[b.id]; b.updatedAt = now; });
  profile.books = imported;
}

// Remplace tous les profils (import d'une sauvegarde complète)
function replaceProfiles(imported) {
  const now = Date.now();
  const keep = new Set(imported.map(p => p.id));
  state.deletedProfiles = { ...(state.deletedProfiles || {}) };
  state.profiles.forEach(p => { if (!keep.has(p.id)) state.deletedProfiles[p.id] = now; });
  state.profiles = imported.map(ip => {
    delete state.deletedProfiles[ip.id];
    const existing = state.profiles.find(p => p.id === ip.id);
    const profile = { ...ip, books: existing ? existing.books : [], deletedBooks: existing ? existing.deletedBooks : {}, updatedAt: now };
    replaceBooks(profile, ip.books || []);
    return profile;
  });
}

function rememberCurrentProfile() {
  try { if (currentUser) localStorage.setItem(`${PROFILE_KEY}-${currentUser.uid}`, state.currentId); } catch (e) {}
}

function savedCurrentProfile() {
  try { return currentUser ? localStorage.getItem(`${PROFILE_KEY}-${currentUser.uid}`) : null; } catch (e) { return null; }
}

// ----- Échanges avec Firestore -----
async function loadFromFirestore() {
  setSyncStatus(t('loading'));
  setSyncBtnState('syncing');
  try {
    const doc = await userDoc().get();
    const cached = loadCache();
    if (doc.exists) {
      // Des changements faits hors connexion attendaient d'être envoyés : on les garde
      state.profiles = cached && cached.pending ? cached.profiles : [];
      state.deletedProfiles = cached && cached.pending ? (cached.deletedProfiles || {}) : {};
      state.currentId = savedCurrentProfile() || doc.data().currentId;
      bindBooksToProfile();   // sinon la fusion repartirait d'une liste de livres vide
      applyRemote(doc.data());
      if (cached && cached.pending) save();
    } else {
      const localState = loadLocalData();
      if (localState && localState.profiles && localState.profiles.length) {
        state.profiles = localState.profiles;
        state.currentId = localState.currentId || state.profiles[0].id;
        await saveToFirestore();
        const totalBooks = state.profiles.reduce((n, p) => n + (p.books || []).length, 0);
        setSyncStatus(t('migrated', { n: totalBooks }), 'ok');
      } else {
        const name = currentUser.displayName || 'Moi';
        const id = newId();
        state.profiles = [touch({ id, name, color: PROFILE_COLORS[0], books: [], createdAt: Date.now() })];
        state.currentId = id;
        await saveToFirestore();
      }
    }
    bindBooksToProfile();
    cacheLocally();
    listenRemote();
    loadedOffline = false;
    setSyncBtnState('synced');
    setSyncStatus(t('connected', { email: escapeHtml(currentUser.email) }), 'ok');
    setTimeout(() => setSyncBtnState(null), 2000);
  } catch (e) {
    const cached = loadCache();
    if (cached) {
      state = { deletedProfiles: {}, ...cached };
      if (!state.profiles.find(p => p.id === state.currentId)) state.currentId = state.profiles[0].id;
      bindBooksToProfile();
      setSyncBtnState('error');
      setSyncStatus(t('offline'), 'err');
      loadedOffline = true;
      listenRemote();
    } else {
      setSyncBtnState('error');
      setSyncStatus(t('loadError') + escapeHtml(e.message), 'err');
    }
  }
  refreshUI();
  handleSharedItem();
}

// Écoute en direct les changements faits depuis un autre appareil
function listenRemote() {
  if (unsubscribeRemote) unsubscribeRemote();
  unsubscribeRemote = userDoc().onSnapshot(snap => {
    if (!snap.exists || snap.metadata.hasPendingWrites) return;
    applyRemote(snap.data());
    refreshUI();
  }, err => console.warn('Écoute en direct interrompue :', err));
}

function stopListening() {
  if (unsubscribeRemote) unsubscribeRemote();
  unsubscribeRemote = null;
}

async function saveToFirestore() {
  if (!currentUser) return;
  clearTimeout(retryTimer);
  setSyncBtnState('syncing');
  const ref = userDoc();
  try {
    let merged, size = 0;
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      merged = mergeData(snap.exists ? snap.data() : {}, localData());
      const payload = { profiles: merged.profiles, deletedProfiles: merged.deletedProfiles, currentId: state.currentId, updatedAt: Date.now() };
      size = new Blob([JSON.stringify(payload)]).size;
      tx.set(ref, payload);
    });
    pendingSave = false;
    applyRemote(merged);
    syncShares();
    setSyncBtnState('synced');
    if (size > SIZE_WARNING) {
      setSyncStatus(t('sizeWarning', { pct: Math.round(size / (1024 * 1024) * 100) }), 'err');
    } else {
      setSyncStatus(t('saved', { email: escapeHtml(currentUser.email) }), 'ok');
    }
    setTimeout(() => setSyncBtnState(null), 2000);
  } catch (e) {
    console.warn('Envoi impossible :', e);
    pendingSave = true;
    cacheLocally();
    setSyncBtnState('error');
    setSyncStatus(t('syncRetry'), 'err');
    retryTimer = setTimeout(saveToFirestore, 15000);
  }
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToFirestore, 600);
}

function save() {
  pendingSave = true;
  syncBooksToProfile();
  cacheLocally();
  scheduleSave();
}

async function manualSync() {
  if (!currentUser) return;
  if (pendingSave) await saveToFirestore();
  await loadFromFirestore();
}

function cacheLocally() {
  try {
    syncBooksToProfile();
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify({
      uid: currentUser && currentUser.uid,
      profiles: state.profiles,
      deletedProfiles: state.deletedProfiles || {},
      currentId: state.currentId,
      pending: pendingSave,
    }));
  } catch (e) {}
}

// Le cache n'est utilisé que s'il appartient au compte connecté (ou vient d'une ancienne version)
function loadCache() {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    const cached = raw ? JSON.parse(raw) : null;
    if (!cached || !cached.profiles || !cached.profiles.length) return null;
    if (cached.uid && currentUser && cached.uid !== currentUser.uid) return null;
    if (!cached.uid) cached.pending = false;
    return cached;
  } catch (e) { return null; }
}

function loadLocalData() {
  try {
    const raw = localStorage.getItem(OLD_STATE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s.profiles && s.profiles.length) return s;
    }
    const oldBooks = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY) || '[]');
    if (oldBooks.length) {
      const id = newId();
      return { currentId: id, profiles: [{ id, name: 'Moi', color: PROFILE_COLORS[0], books: oldBooks, createdAt: Date.now() }] };
    }
  } catch (e) {}
  return null;
}

// ===== AUTH STATE LISTENER =====
auth.onAuthStateChanged(async user => {
  // Page publique d'une wishlist partagée : pas d'écran de connexion
  if (typeof SHARE_VIEW_ID !== 'undefined' && SHARE_VIEW_ID) return;
  if (user) {
    currentUser = user;
    document.getElementById('auth-screen').classList.add('hidden');
    document.getElementById('app-container').style.display = '';
    showActiveCat('instant');
    await loadFromFirestore();
  } else {
    stopListening();
    currentUser = null;
    state = { profiles: [], deletedProfiles: {}, currentId: null };
    books = [];
    pendingSave = false;
    document.getElementById('auth-screen').classList.remove('hidden');
    document.getElementById('app-container').style.display = 'none';
    switchAuthTab('login');
    document.getElementById('auth-error').style.color = '';
    document.getElementById('auth-error').style.borderColor = '';
    document.getElementById('auth-error').style.background = '';
  }
});

// Les changements en attente partent dès que la connexion revient ou que l'appli revient au premier plan
window.addEventListener('online', async () => {
  if (!currentUser) return;
  if (pendingSave) await saveToFirestore();
  if (loadedOffline) loadFromFirestore();
});
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && currentUser && pendingSave) saveToFirestore();
});
