// ===== PARTAGE DE LA WISHLIST (lecture seule, par lien) =====
// Un profil partagé porte un identifiant secret (shareId). Une copie de sa wishlist
// (titres, créateurs, couvertures : ni avis ni notes) est tenue à jour dans shares/{shareId},
// lisible sans compte par toute personne qui a le lien (voir firestore.rules).
const SHARE_VIEW_ID = new URLSearchParams(location.search).get('share');
const lastShareSig = {};

function shareLink(shareId) {
  return `${location.origin}${location.pathname}?share=${shareId}`;
}

function newShareId() {
  const bytes = crypto.getRandomValues(new Uint8Array(15));
  return Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('').slice(0, 24);
}

function sharedPayload(profile) {
  const items = (profile.books || []).filter(b => b.categorie === 'wishlist').map(b => {
    const item = { titre: b.titre, type: typeOf(b) };
    if (b.auteur) item.auteur = b.auteur;
    if (b.annee) item.annee = b.annee;
    if (b.cover) item.cover = b.cover;
    if (b.plateforme) item.plateforme = b.plateforme;
    return item;
  });
  return { owner: currentUser.uid, name: profile.name, items };
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

function renderShareModal(message) {
  const p = getCurrentProfile();
  const box = document.getElementById('share-content');
  const count = (p.books || []).filter(b => b.categorie === 'wishlist').length;
  const note = message ? `<p class="share-message">${message}</p>` : '';
  if (!p.shareId) {
    box.innerHTML = `
      <p class="share-intro">${t('shareIntro')}</p>
      <p class="share-count">${ttn('items', 'tout', count)} · ${escapeHtml(p.name)}</p>
      ${note}
      <div class="modal-actions"><button class="btn-secondary" onclick="closeShareModal()">${t('close')}</button>
      <button class="btn-primary" onclick="startSharing()">${t('shareCreate')}</button></div>`;
    return;
  }
  const link = shareLink(p.shareId);
  box.innerHTML = `
    <p class="share-intro">${t('shareActive')}</p>
    <input class="share-link" type="text" readonly value="${escapeHtml(link)}" onclick="this.select()">
    ${note}
    <div class="share-buttons">
      <button class="btn-primary" onclick="copyShareLink()">${t('shareCopy')}</button>
      ${navigator.share ? `<button class="btn-secondary" onclick="sendShareLink()">${t('shareSend')}</button>` : ''}
      <a class="btn-secondary" href="${escapeHtml(link)}" target="_blank" rel="noopener">${t('shareOpen')}</a>
    </div>
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
  navigator.share({ title: t('sharedBy', { name: p.name }), url: shareLink(p.shareId) }).catch(() => {});
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
  document.title = t('sharedBy', { name: data.name });
  const sections = TYPES.map(type => {
    const items = (data.items || []).filter(i => i.type === type);
    if (!items.length) return '';
    return `
      <h2 class="share-section">${typeIcon(type, 18)} ${t('type_' + type)}</h2>
      <div class="grid posters">${items.map(i => `
        <div class="poster" data-cat="wishlist">
          <div class="poster-img">${i.cover
            ? `<img class="poster-cover" src="${escapeHtml(i.cover)}" alt="" loading="lazy" data-title="${escapeHtml(i.titre)}" onerror="posterFallback(this)">`
            : posterPlaceholder(i.titre)}</div>
          <div class="poster-title">${escapeHtml(i.titre)}</div>
          <div class="poster-sub">${[i.auteur, i.annee, i.plateforme].filter(Boolean).map(escapeHtml).join(' · ')}</div>
        </div>`).join('')}</div>`;
  }).join('');
  const updated = data.updatedAt ? new Date(data.updatedAt).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  view.innerHTML = `
    <header class="share-header">
      <p class="share-brand">${t('appTitle')}</p>
      <h1>${escapeHtml(t('sharedBy', { name: data.name }))}</h1>
      <p class="share-meta">${ttn('items', 'tout', (data.items || []).length)}${updated ? ' · ' + t('sharedUpdated', { date: updated }) : ''}</p>
    </header>
    ${sections || `<div class="empty-state"><div class="icon">✨</div><h3>${t('sharedEmpty')}</h3></div>`}
    <footer class="credits"><a href="${location.pathname}">${t('sharedOwn')}</a></footer>`;
}

if (SHARE_VIEW_ID) showSharedWishlist();
