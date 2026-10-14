// ===== RECOMMANDATIONS (Claude) =====
// La collection du profil courant est envoyée à la fonction serveur « recommendations »
// (functions/index.js), seule à connaître la clé Anthropic. Les dernières suggestions sont
// gardées sur l'appareil, par profil, pour ne pas refaire un appel payant à chaque ouverture.
// Les titres refusés (« Pas pour moi ») sont mémorisés dans le profil et synchronisés.
const RECO_KEY = 'mes-livres-reco';
let recoType = null;
let recoLoading = false;
let recoError = '';

function recoCacheKey() {
  const p = getCurrentProfile();
  return `${RECO_KEY}-${p ? p.id : ''}`;
}

// En démo, les suggestions restent en mémoire : rien n'est écrit sur l'appareil
let demoRecoCache = null;

function loadRecoCache() {
  if (DEMO) return demoRecoCache && JSON.parse(JSON.stringify(demoRecoCache));
  try { return JSON.parse(localStorage.getItem(recoCacheKey()) || 'null'); } catch (e) { return null; }
}

function saveRecoCache(data) {
  if (DEMO) { demoRecoCache = data; return; }
  try { localStorage.setItem(recoCacheKey(), JSON.stringify(data)); } catch (e) {}
}

function openReco() {
  recoType = currentType;
  recoError = '';
  renderReco();
  document.getElementById('reco-modal').classList.add('active');
}

function closeReco() {
  document.getElementById('reco-modal').classList.remove('active');
}

function setRecoType(type) {
  recoType = type;
  renderReco();
}

function renderReco() {
  const cache = loadRecoCache();
  const demande = document.getElementById('reco-demande');
  const typed = demande ? demande.value : '';
  const tabs = ['tout', ...TYPES].map(type => `
    <button type="button" class="reco-type ${recoType === type ? 'active' : ''}" onclick="setRecoType('${type}')">
      ${TYPE_EMOJI[type]} ${t('type_' + type)}
    </button>`).join('');
  const results = cache && cache.recommandations
    ? `<p class="reco-profil">${escapeHtml(cache.profil || '')}</p>
       <div class="reco-list">${cache.recommandations.map(recoCard).join('') || `<p class="share-intro">${t('recoAllDone')}</p>`}</div>`
    : '';
  document.getElementById('reco-content').innerHTML = `
    <p class="share-intro">${t('recoIntro')}</p>
    <div class="reco-types">${tabs}</div>
    <div class="field">
      <input type="text" id="reco-demande" maxlength="200" placeholder="${escapeHtml(t('recoAskPh'))}" value="${escapeHtml(typed)}">
    </div>
    <button class="btn-primary reco-go" onclick="runReco()" ${recoLoading ? 'disabled' : ''}>
      ${recoLoading ? t('recoLoading') : (cache ? t('recoAgain') : t('recoGo'))}
    </button>
    ${recoError ? `<div class="reco-error">${escapeHtml(recoError)}</div>` : ''}
    ${recoLoading ? '' : results}
    <p class="reco-privacy">${t('recoPrivacy')}</p>`;
  const input = document.getElementById('reco-demande');
  input.addEventListener('keydown', e => { if (e.key === 'Enter') runReco(); });
}

function recoCard(r, i) {
  // Si l'image ne charge pas (service saturé, lien mort), l'emoji du type la remplace
  const placeholder = `<span class="poster-cover placeholder">${TYPE_EMOJI[r.type] || ''}</span>`;
  const cover = r.cover
    ? `<img class="poster-cover" src="${escapeHtml(r.cover)}" alt="" loading="lazy" onerror="this.outerHTML='${escapeHtml(placeholder)}'">`
    : placeholder;
  const meta = [t('typeOne_' + r.type), r.createur, r.annee].filter(Boolean).map(escapeHtml).join(' · ');
  const because = (r.base_sur || []).length
    ? `<div class="reco-because">${t('recoBecause', { titles: r.base_sur.map(x => (currentLang === 'en' ? `“${escapeHtml(x)}”` : `« ${escapeHtml(x)} »`)).join(', ') })}</div>` : '';
  const actions = r.added
    ? `<span class="reco-added">${t('recoAdded')}</span>`
    : `<button class="btn-primary" onclick="addReco(${i})">${t('recoAdd')}</button>
       <button class="btn-secondary" onclick="dismissReco(${i})">${t('recoDismiss')}</button>`;
  return `
    <div class="reco-card">
      <div class="reco-cover">${cover}</div>
      <div class="reco-body">
        <div class="reco-title">${r.audacieux ? '<span class="reco-bold" title="' + escapeHtml(t('recoBoldTitle')) + '">🎲</span> ' : ''}${escapeHtml(r.titre)}</div>
        <div class="reco-meta">${meta}</div>
        <p class="reco-why">${escapeHtml(r.pourquoi)}</p>
        ${because}
        <div class="reco-actions">${actions}</div>
      </div>
    </div>`;
}

// Ce qui est envoyé : uniquement les champs utiles aux suggestions
function recoPayload() {
  const p = getCurrentProfile();
  const demande = document.getElementById('reco-demande');
  return {
    items: books.map(b => ({ titre: b.titre, auteur: b.auteur, type: typeOf(b), categorie: b.categorie, note: b.note, avis: b.avis, tags: b.tags })),
    type: recoType,
    demande: demande ? demande.value.trim() : '',
    refuses: (p && p.recoDismissed) || [],
    lang: currentLang,
  };
}

async function runReco() {
  if (recoLoading) return;
  recoError = '';
  if (!DEMO && !navigator.onLine) { recoError = t('recoOffline'); renderReco(); return; }
  recoLoading = true;
  renderReco();
  try {
    const data = DEMO ? await demoReco() : (await firebase.functions().httpsCallable('recommendations', { timeout: 130000 })(recoPayload())).data;
    const recommandations = await Promise.all(data.recommandations.map(withCover));
    saveRecoCache({ at: Date.now(), profil: data.profil, recommandations });
  } catch (e) {
    console.warn('Recommandations indisponibles :', e);
    recoError = e && e.code === 'functions/resource-exhausted' ? t('recoLimit') : t('recoFailed');
  }
  recoLoading = false;
  renderReco();
}

// Couverture et identifiant TMDB, cherchés avec les mêmes services que le remplissage automatique.
// Une suggestion sans résultat reste affichée, simplement sans image.
async function withCover(r) {
  const out = { ...r, cover: '' };
  try {
    let found = [];
    if (r.type === 'livre') found = await searchBooks(`${r.titre} ${r.createur || ''}`.trim());
    else if (r.type === 'film' || r.type === 'serie') found = await searchTmdb(r.type === 'film' ? 'movie' : 'tv', r.titre);
    else if (r.type === 'jeu') found = await searchRawg(r.titre);
    const wanted = normalize(r.titre);
    const match = found.find(x => normalize(x.titre) === wanted && (!r.annee || !x.annee || Math.abs(x.annee - r.annee) <= 1))
      || found.find(x => normalize(x.titre) === wanted) || found[0];
    if (match) {
      out.cover = match.cover || '';
      if (match.tmdb) out.tmdbId = match.tmdb.id;
      if (match.genres) out.genres = match.genres;
    }
  } catch (e) {}
  return out;
}

function updateCachedReco(change) {
  const cache = loadRecoCache();
  if (!cache) return;
  change(cache.recommandations);
  saveRecoCache(cache);
  renderReco();
}

function addReco(i) {
  const cache = loadRecoCache();
  const r = cache && cache.recommandations[i];
  if (!r) return;
  const type = TYPES.includes(r.type) ? r.type : 'livre';
  const dup = findDuplicate(r.titre, type);
  if (!dup) {
    const item = {
      titre: r.titre, auteur: r.createur || '', categorie: 'wishlist', note: 0, avis: '',
      recoBy: t('recoByClaude'), tags: (r.genres || []).slice(0, 2), cover: r.cover || '', dateFinished: null,
      type, annee: type !== 'livre' && r.annee ? r.annee : null, plateforme: '', progression: '',
    };
    if (r.tmdbId) item.tmdbId = r.tmdbId;
    books.push(touch({ id: newId(), dateAdded: Date.now(), ...item }));
    save();
    render();
  }
  updateCachedReco(list => { list[i].added = true; });
}

function dismissReco(i) {
  const cache = loadRecoCache();
  const r = cache && cache.recommandations[i];
  if (!r) return;
  const p = getCurrentProfile();
  if (p) {
    p.recoDismissed = [...(p.recoDismissed || []).filter(x => x !== r.titre), r.titre].slice(-100);
    touch(p);
    save();
  }
  updateCachedReco(list => { list.splice(i, 1); });
}

// Mode démo : suggestions d'exemple, sans appel au serveur
function demoReco() {
  const en = currentLang === 'en';
  const all = [
    { titre: en ? 'The Martian' : 'Seul sur Mars', type: 'livre', createur: 'Andy Weir', annee: 2011, audacieux: false, base_sur: ['Project Hail Mary'],
      pourquoi: en ? 'The same mix of science, humour and survival that you loved in Project Hail Mary.' : 'Le même mélange de science, d’humour et de survie que tu as adoré dans Project Hail Mary.' },
    { titre: 'Arrival', type: 'film', createur: 'Denis Villeneuve', annee: 2016, audacieux: false, base_sur: ['Dune: Part Two', 'Past Lives'],
      pourquoi: en ? 'Villeneuve again, with a more intimate story: a good bridge between Dune and Past Lives.' : 'Encore Villeneuve, avec une histoire plus intime : un pont entre Dune et Past Lives.' },
    { titre: 'Dark', type: 'serie', createur: 'Baran bo Odar', annee: 2017, audacieux: false, base_sur: ['Severance'],
      pourquoi: en ? 'A mind-bending mystery with the oppressive atmosphere you rated 5 stars in Severance.' : 'Un mystère vertigineux, avec l’ambiance oppressante que tu as notée 5 étoiles dans Severance.' },
    { titre: 'Outer Wilds', type: 'jeu', createur: 'Mobius Digital', annee: 2019, audacieux: true, base_sur: ['Hades', 'Project Hail Mary'],
      pourquoi: en ? 'A space exploration game driven by curiosity: less action than Hades, but pure science-fiction wonder.' : 'Un jeu d’exploration spatiale guidé par la curiosité : moins d’action que Hades, mais un pur émerveillement de science-fiction.' },
    { titre: en ? 'Klara and the Sun' : 'Klara et le Soleil', type: 'livre', createur: 'Kazuo Ishiguro', annee: 2021, audacieux: true, base_sur: ['The Midnight Library'],
      pourquoi: en ? 'Gentle and moving like The Midnight Library, with a touch of science fiction.' : 'Doux et émouvant comme La Bibliothèque de minuit, avec une touche de science-fiction.' },
  ];
  const list = all.filter(r => recoType === 'tout' || r.type === recoType);
  return new Promise(resolve => setTimeout(() => resolve({
    profil: en ? 'You love smart science fiction with heart, and stories that make you think without losing their humour.'
      : 'Tu aimes la science-fiction intelligente et pleine d’émotion, et les histoires qui font réfléchir sans perdre leur humour.',
    recommandations: list,
  }), 900));
}

document.getElementById('reco-modal').addEventListener('click', e => {
  if (e.target.id === 'reco-modal') closeReco();
});
