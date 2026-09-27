// ===== PARTAGE DE LA COLLECTION (lecture seule, par lien) =====
// Un profil partagé porte un identifiant secret (shareId) et des réglages (shareConfig) :
// catégories et types montrés, notes et avis inclus ou non. Une copie de la sélection est
// tenue à jour dans shares/{shareId}, lisible sans compte par toute personne qui a le lien
// (voir firestore.rules). Par défaut : la wishlist seule, sans notes ni avis.
const SHARE_VIEW_ID = new URLSearchParams(location.search).get('share');
const lastShareSig = {};
const DEFAULT_SHARE = { cats: ['wishlist'], types: TYPES, notes: false, avis: false };

function shareConfig(profile) {
  return { ...DEFAULT_SHARE, ...(profile.shareConfig || {}) };
}

function sharedItems(profile, cfg) {
  return (profile.books || []).filter(b => cfg.cats.includes(b.categorie) && cfg.types.includes(typeOf(b)));
}

function shareLink(shareId) {
  return `${location.origin}${location.pathname}?share=${shareId}`;
}

function newShareId() {
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  return Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 24);
}

function sharedPayload(profile) {
  const cfg = shareConfig(profile);
  const items = sharedItems(profile, cfg).map(b => {
    const item = { titre: b.titre, type: typeOf(b), categorie: b.categorie };
    if (cfg.notes && b.note) item.note = b.note;
    if (cfg.avis && b.avis) item.avis = b.avis;
    if (b.auteur) item.auteur = b.auteur;
    if (b.annee) item.annee = b.annee;
    if (b.cover) item.cover = b.cover;
    if (b.plateforme) item.plateforme = b.plateforme;
    return item;
  });
  return { owner: currentUser.uid, name: profile.name, items, config: { cats: cfg.cats, types: cfg.types, notes: cfg.notes, avis: cfg.avis } };
}

async function writeShare(profile) {
  const payload = sharedPayload(profile);
  const sig = JSON.stringify(payload);
  if (lastShareSig[profile.shareId] === sig) return;
  await db.collection('shares').doc(profile.shareId).set({ ...payload, updatedAt: Date.now() });
  lastShareSig[profile.shareId] = sig;
}

// Appelée après chaque sauvegarde réussie : met à jour les wishlists partagées
function syncShares() {
  if (!currentUser) return;
  state.profiles.filter(p => p.shareId).forEach(p => {
    writeShare(p).catch(e => console.warn('Partage non mis à jour :', e));
  });
}

// ----- Fenêtre « Partager ma wishlist » -----
function openShareModal() {
  document.getElementById('profile-dropdown').classList.remove('active');
  renderShareModal();
  document.getElementById('share-modal').classList.add('active');
}

function closeShareModal() {
  document.getElementById('share-modal').classList.remove('active');
}

function shareOptionsHtml(p) {
  const cfg = shareConfig(p);
  const count = sharedItems(p, cfg).length;
  const check = (group, value, label, on) => `
    <label class="check-chip ${on ? 'on' : ''}">
      <input type="checkbox" data-group="${group}" value="${value}" ${on ? 'checked' : ''} onchange="updateShareConfig()">${label}
    </label>`;
  return `
    <div class="share-options">
      <div class="share-option-title">${t('shareCats')}</div>
      <div class="check-row">${ALL_CATS.map(c => check('cats', c, catLabel(c, 'tout'), cfg.cats.includes(c))).join('')}</div>
      <div class="share-option-title">${t('shareTypes')}</div>
      <div class="check-row">${TYPES.map(ty => check('types', ty, `${typeIcon(ty, 14)} ${t('type_' + ty)}`, cfg.types.includes(ty))).join('')}</div>
      <div class="check-row">
        ${check('notes', '1', `★ ${t('shareNotes')}`, cfg.notes)}
        ${check('avis', '1', t('shareAvis'), cfg.avis)}
      </div>
      <p class="share-count">${cfg.cats.length && cfg.types.length ? ttn('shareVisible', 'tout', count, { items: ttn('items', 'tout', count) }) : t('shareNothing')}</p>
    </div>`;
}

function updateShareConfig() {
  const p = getCurrentProfile();
  const picked = group => [...document.querySelectorAll(`#share-content input[data-group="${group}"]:checked`)].map(i => i.value);
  p.shareConfig = { cats: picked('cats'), types: picked('types'), notes: picked('notes').length > 0, avis: picked('avis').length > 0 };
  touch(p);
  if (p.shareId && p.shareConfig.cats.length && p.shareConfig.types.length) save();   // le lien se met à jour après l'envoi
  else cacheLocally();
  renderShareModal();
}

function renderShareModal(message) {
  const p = getCurrentProfile();
  const cfg = shareConfig(p);
  const box = document.getElementById('share-content');
  const note = message ? `<p class="share-message">${message}</p>` : '';
  const ready = cfg.cats.length > 0 && cfg.types.length > 0;
  if (!p.shareId) {
    box.innerHTML = `
      <p class="share-intro">${t('shareIntro')}</p>
      ${shareOptionsHtml(p)}
      ${note}
      <div class="modal-actions"><button class="btn-secondary" onclick="closeShareModal()">${t('close')}</button>
      <button class="btn-primary" onclick="startSharing()" ${ready ? '' : 'disabled'}>${t('shareCreate')}</button></div>`;
    return;
  }
  const link = shareLink(p.shareId);
  box.innerHTML = `
    <p class="share-intro">${t('shareActive')}</p>
    <input class="share-link" type="text" readonly value="${escapeHtml(link)}" onclick="this.select()">
    <div class="share-buttons">
      <button class="btn-primary" onclick="copyShareLink()">${t('shareCopy')}</button>
      ${navigator.share ? `<button class="btn-secondary" onclick="sendShareLink()">${t('shareSend')}</button>` : ''}
      <a class="btn-secondary" href="${escapeHtml(link)}" target="_blank" rel="noopener">${t('shareOpen')}</a>
    </div>
    ${note}
    ${shareOptionsHtml(p)}
    <div class="modal-actions" style="justify-content: space-between;">
      <button class="btn-secondary danger-link" onclick="stopSharing()">${t('shareStop')}</button>
      <button class="btn-secondary" onclick="closeShareModal()">${t('close')}</button>
    </div>`;
}

async function startSharing() {
  const p = getCurrentProfile();
  const shareId = newShareId();
  try {
    p.shareId = shareId;
    await writeShare(p);
  } catch (e) {
    delete p.shareId;
    console.warn('Partage refusé :', e);
    renderShareModal(e && e.code === 'permission-denied' ? t('shareRulesError') : t('shareError'));
    return;
  }
  touch(p);
  save();
  renderShareModal();
}

async function stopSharing() {
  const p = getCurrentProfile();
  if (!p.shareId || !confirm(t('shareStopConfirm'))) return;
  const shareId = p.shareId;
  delete p.shareId;
  touch(p);
  save();
  renderShareModal();
  try { await db.collection('shares').doc(shareId).delete(); } catch (e) { console.warn(e); }
}

async function copyShareLink() {
  const link = shareLink(getCurrentProfile().shareId);
  try { await navigator.clipboard.writeText(link); } catch (e) { document.querySelector('.share-link').select(); }
  renderShareModal(t('shareCopied'));
}

function sendShareLink() {
  const p = getCurrentProfile();
  const cfg = shareConfig(p);
  const onlyWishlist = cfg.cats.length === 1 && cfg.cats[0] === 'wishlist';
  navigator.share({ title: t(onlyWishlist ? 'sharedBy' : 'sharedCollectionBy', { name: p.name }), url: shareLink(p.shareId) }).catch(() => {});
}

// ----- Page publique : ?share=… -----
async function showSharedWishlist() {
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app-container').style.display = 'none';
  const view = document.getElementById('share-view');
  view.style.display = 'block';
  view.innerHTML = `<p class="share-loading">${t('loading')}</p>`;
  let data = null;
  try {
    const doc = await db.collection('shares').doc(SHARE_VIEW_ID).get();
    data = doc.exists ? doc.data() : null;
  } catch (e) {
    console.warn(e);
  }
  if (!data) {
    view.innerHTML = `<div class="empty-state"><div class="icon">🔗</div><h3>${t('sharedMissing')}</h3>
      <p><a href="${location.pathname}">${t('sharedOwn')}</a></p></div>`;
    return;
  }
  const cfg = { ...DEFAULT_SHARE, ...(data.config || {}) };
  const onlyWishlist = cfg.cats.length === 1 && cfg.cats[0] === 'wishlist';
  const pageTitle = t(onlyWishlist ? 'sharedBy' : 'sharedCollectionBy', { name: data.name });
  document.title = pageTitle;
  const sections = TYPES.map(type => {
    const items = (data.items || []).filter(i => i.type === type);
    if (!items.length) return '';
    return `
      <h2 class="share-section">${typeIcon(type, 18)} ${t('type_' + type)}</h2>
      <div class="grid posters">${items.map(i => `
        <div class="poster" data-cat="${i.categorie || 'wishlist'}">
          <div class="poster-img">${i.cover
            ? `<img class="poster-cover" src="${escapeHtml(i.cover)}" alt="" loading="lazy" data-title="${escapeHtml(i.titre)}" onerror="posterFallback(this)">`
            : posterPlaceholder(i.titre)}</div>
          <div class="poster-title">${escapeHtml(i.titre)}</div>
          <div class="poster-sub">${[i.auteur, i.annee, i.plateforme].filter(Boolean).map(escapeHtml).join(' · ')}</div>
          ${cfg.cats.length > 1 && i.categorie ? `<span class="share-cat" data-cat="${i.categorie}">${escapeHtml(catOneLabel(i.categorie, type))}</span>` : ''}
          ${i.note ? renderStars(i.note) : ''}
          ${i.avis ? `<p class="share-avis">${escapeHtml(i.avis)}</p>` : ''}
        </div>`).join('')}</div>`;
  }).join('');
  const updated = data.updatedAt ? new Date(data.updatedAt).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  view.innerHTML = `
    <header class="share-header">
      <p class="share-brand">${t('appTitle')}</p>
      <h1>${escapeHtml(pageTitle)}</h1>
      <p class="share-meta">${ttn('items', 'tout', (data.items || []).length)}${updated ? ' · ' + t('sharedUpdated', { date: updated }) : ''}</p>
    </header>
    ${sections || `<div class="empty-state"><div class="icon">✨</div><h3>${t('sharedEmpty')}</h3></div>`}
    <footer class="credits"><a href="${location.pathname}">${t('sharedOwn')}</a></footer>`;
}

if (SHARE_VIEW_ID) showSharedWishlist();
