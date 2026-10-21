// ===== MES COLLECTIONS : TYPES AFFICHÉS PAR PROFIL =====
// Une même fenêtre sert de réglage (menu du profil) et d'accueil (nouveau compte ou
// nouveau profil : « Que veux-tu suivre ? »). Le choix est gardé dans le profil
// (profile.types, synchronisé comme le reste) ; tout coché = pas de réglage, ce qui
// affiche aussi les types ajoutés plus tard. Voir visibleTypes() dans types.js.
let typesDraft = [];
let typesOnboarding = false;

function openTypesModal(opts) {
  document.getElementById('profile-dropdown').classList.remove('active');
  typesOnboarding = !!(opts && opts.onboarding);
  // Accueil : rien n'est coché, c'est une vraie question ; réglage : le choix actuel
  typesDraft = typesOnboarding ? [] : [...visibleTypes()];
  renderTypesModal();
  document.getElementById('types-modal').classList.add('active');
}

function closeTypesModal() {
  document.getElementById('types-modal').classList.remove('active');
}

function toggleTypeDraft(type) {
  typesDraft = typesDraft.includes(type) ? typesDraft.filter(ty => ty !== type) : [...typesDraft, type];
  renderTypesModal();
}

function renderTypesModal() {
  const p = getCurrentProfile();
  const counts = {};
  books.forEach(b => { counts[typeOf(b)] = (counts[typeOf(b)] || 0) + 1; });
  const title = typesOnboarding
    ? (state.profiles.length > 1 ? t('typesWelcomeProfile', { name: escapeHtml(p ? p.name : '') }) : t('typesWelcome'))
    : t('typesTitle');
  const choices = TYPES.map(ty => {
    const on = typesDraft.includes(ty);
    const n = counts[ty] || 0;
    return `
      <label class="type-choice ${on ? 'on' : ''}">
        <input type="checkbox" ${on ? 'checked' : ''} onchange="toggleTypeDraft('${ty}')">
        <span class="type-choice-icon">${typeIcon(ty, 22)}</span>
        <span class="type-choice-label">${t('type_' + ty)}</span>
        ${n ? `<span class="type-choice-count">${ttn('items', ty, n)}${on ? '' : ' · ' + t('typesKept')}</span>` : ''}
      </label>`;
  }).join('');
  const none = typesDraft.length === 0;
  document.getElementById('types-content').innerHTML = `
    <h2>${title}</h2>
    <p class="share-intro">${typesOnboarding ? t('typesWelcomeIntro') : t('typesIntro')}</p>
    <div class="type-choices">${choices}</div>
    <p class="types-hint">${none && !typesOnboarding ? t('typesNone') : t('typesHint')}</p>
    <div class="modal-actions">
      <button class="btn-secondary" onclick="${typesOnboarding ? 'skipTypes()' : 'closeTypesModal()'}">${typesOnboarding ? t('typesSkip') : t('cancel')}</button>
      <button class="btn-primary" onclick="saveTypes()" ${none ? 'disabled' : ''}>${typesOnboarding ? t('typesGo') : t('save')}</button>
    </div>`;
}

function applyTypes(types) {
  const p = getCurrentProfile();
  if (!p) return;
  if (types.length === TYPES.length) delete p.types;
  else p.types = TYPES.filter(ty => types.includes(ty));
  touch(p);
  save();
  render();
}

function saveTypes() {
  if (!typesDraft.length) return;
  applyTypes(typesDraft);
  closeTypesModal();
}

// Accueil passé : tout reste affiché
function skipTypes() {
  closeTypesModal();
}

// Réaffiche un type masqué (ex. : lien partagé vers un jeu alors que les jeux sont masqués)
function showType(type) {
  if (!isVisibleType(type)) applyTypes([...visibleTypes(), type]);
}

document.getElementById('types-modal').addEventListener('click', e => {
  if (e.target.id === 'types-modal') closeTypesModal();
});
