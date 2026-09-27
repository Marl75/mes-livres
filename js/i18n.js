// ===== LANGUE (FR / EN) =====
const I18N = {
  fr: {
    locale: 'fr-FR', docTitle: 'Mes Livres', langSwitch: 'English',
    appTitle: 'Bibliothèque', authSubtitle: 'Connecte-toi pour retrouver tes livres', tagline: 'Lectures, en attente, et envies',
    tabLogin: 'Connexion', tabRegister: 'Inscription', email: 'Email', emailPh: 'ton@email.com',
    password: 'Mot de passe', passwordPh: '6 caractères minimum', firstName: 'Prénom (nom du profil)', firstNamePh: 'ex : Marlène',
    login: 'Se connecter', createAccount: 'Créer mon compte', forgot: 'Mot de passe oublié ?', loading: 'Chargement…',
    fillAll: 'Remplis tous les champs.', resetEnterEmail: 'Entre ton email pour réinitialiser le mot de passe.',
    resetSent: 'Email de réinitialisation envoyé ! Vérifie ta boîte mail.',
    'auth/invalid-email': 'Adresse email invalide.', 'auth/user-disabled': 'Ce compte a été désactivé.',
    'auth/user-not-found': 'Aucun compte avec cet email.', 'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.', 'auth/email-already-in-use': 'Un compte existe déjà avec cet email.',
    'auth/weak-password': 'Le mot de passe doit faire au moins 6 caractères.', 'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
    'auth/missing-password': 'Entre un mot de passe.', authDefault: 'Erreur de connexion. Vérifie tes identifiants.',
    searchPh: 'Rechercher…', add: 'Ajouter', stats: 'Statistiques', sync: 'Synchroniser',
    'cat_lu': 'Lu', 'cat_en-cours': 'En cours', 'cat_a-lire': 'À lire', 'cat_abandonne': 'Abandonné', 'cat_wishlist': 'Wishlist',
    'sub_lu': 'livres terminés', 'sub_en-cours': 'lectures en cours', 'sub_a-lire': "en attente sur l'étagère",
    'sub_abandonne': 'commencés, non terminés', 'sub_wishlist': 'recommandations à découvrir',
    sortLabel: 'Trier', sort_recent: 'Ajout récent', sort_finished: 'Date de lecture', sort_title: 'Titre A → Z',
    sort_author: 'Auteur A → Z', sort_rating: 'Mieux notés',
    close: 'Fermer', cancel: 'Annuler', save: 'Enregistrer', edit: 'Modifier', delete: 'Supprimer', rename: 'Renommer', actions: 'Actions',
    manageProfiles: 'Gérer les profils', manageProfilesAction: 'Nouveau profil / gérer', logout: 'Déconnexion', active: '(actif)',
    profilesIntro: "Chaque profil a sa propre liste de livres. Tous les profils sont synchronisés sur ton compte — accessibles depuis n'importe quel appareil.",
    newProfile: 'Nouveau profil', name: 'Nom', profileNamePh: 'ex : Marlène, Sophie…', color: 'Couleur',
    export: 'Exporter', import: 'Importer', createProfile: 'Créer le profil',
    profileNameRequired: 'Donne un nom au profil.', renamePrompt: 'Nouveau nom du profil :', cantDeleteLast: 'Impossible de supprimer le dernier profil.',
    confirmDeleteProfile: 'Supprimer le profil « {name} » et ses {n} livre(s) ? Cette action est irréversible.',
    confirmImportProfiles: 'Importer {n} profil(s) ? (Remplacera tous tes profils actuels)',
    confirmImportBooks: 'Importer {n} livre(s) dans le profil « {name} » ?', invalidFormat: 'Format invalide', importError: "Erreur d'import : ",
    addBook: 'Ajouter un livre', editBook: 'Modifier le livre', autofill: 'Remplir automatiquement', lookupPh: 'Titre, auteur ou ISBN…',
    lookupHint: "Choisis un résultat pour remplir le titre, l'auteur et la couverture",
    title: 'Titre', titlePh: 'Le nom du livre', author: 'Auteur', authorPh: "Qui l'a écrit ?", category: 'Catégorie',
    cover: 'Couverture', coverPh: "URL de l'image (remplie automatiquement)",
    finishedOn: 'Terminé le', rating: 'Note', review: 'Avis',
    reviewPh: 'Ce que tu en as pensé…', reviewPhReading: 'Tes impressions en cours de lecture…', reviewPhAbandoned: "Pourquoi l'as-tu abandonné ?",
    recoBy: 'Recommandé par', recoByPh: "Qui te l'a conseillé ?", tags: 'Tags', tagPh: 'Ajouter un tag…',
    tagHint: 'Tape pour voir les tags existants — Entrée / virgule pour valider, Tab pour autocompléter',
    removeTag: 'retirer', createTag: '+ Créer « {q} »', newTag: 'nouveau', clearTags: '✕ tout effacer',
    books_one: '{n} livre', books_other: '{n} livres', readIn: 'Lu en {date}',
    noResults: 'Aucun résultat', tryAnother: 'Essaie un autre terme.', emptyTitle: "Rien ici pour l'instant",
    emptyHint: 'Clique sur « Ajouter » pour commencer ta collection.', confirmDeleteBook: 'Supprimer ce livre ?',
    moveTo: 'Déplacer vers',
    goal: 'Objectif', goalOf: '/ {goal} livres en {year}', readYear_one: 'livre lu en {year}', readYear_other: 'livres lus en {year}',
    totalRead: 'Lus au total', authorsRead: 'Auteurs lus', avgRating: 'Note moyenne', byYear: 'Livres lus par année',
    topAuthors: 'Auteurs les plus lus', topTags: 'Tags favoris', noneRead: 'Pas encore de livre lu dans ce profil.',
    undated_one: '{n} livre lu sans date de fin : ajoute-la via « Modifier » pour le compter par année.',
    undated_other: '{n} livres lus sans date de fin : ajoute-la via « Modifier » pour les compter par année.',
    searching: 'Recherche…', noneFound: 'Aucun livre trouvé. Tu peux remplir la fiche à la main.',
    migrated: '✓ {n} livre(s) migré(s) depuis cet appareil', connected: '✓ Connecté — {email}', saved: '✓ Sauvegardé — {email}',
    offline: 'Mode hors-ligne — données locales',
    syncRetry: 'Pas de connexion : tes changements sont gardés sur cet appareil et partiront automatiquement.',
    sizeWarning: 'Ta collection occupe {pct} % de la place disponible. Pense à exporter une sauvegarde.', loadError: 'Erreur de chargement : ', saveError: 'Erreur de sauvegarde : ',
  },
  en: {
    locale: 'en-GB', docTitle: 'My Books', langSwitch: 'Français',
    appTitle: 'Library', authSubtitle: 'Sign in to find your books', tagline: 'Read, waiting, and wished for',
    tabLogin: 'Log in', tabRegister: 'Sign up', email: 'Email', emailPh: 'you@email.com',
    password: 'Password', passwordPh: 'At least 6 characters', firstName: 'First name (profile name)', firstNamePh: 'e.g. Marlène',
    login: 'Log in', createAccount: 'Create my account', forgot: 'Forgot your password?', loading: 'Loading…',
    fillAll: 'Please fill in all fields.', resetEnterEmail: 'Enter your email to reset your password.',
    resetSent: 'Reset email sent! Check your inbox.',
    'auth/invalid-email': 'Invalid email address.', 'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account with this email.', 'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.', 'auth/email-already-in-use': 'An account already exists with this email.',
    'auth/weak-password': 'Password must be at least 6 characters.', 'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/missing-password': 'Enter a password.', authDefault: 'Sign-in error. Check your details.',
    searchPh: 'Search…', add: 'Add', stats: 'Statistics', sync: 'Sync',
    'cat_lu': 'Read', 'cat_en-cours': 'Reading', 'cat_a-lire': 'To read', 'cat_abandonne': 'Abandoned', 'cat_wishlist': 'Wishlist',
    'sub_lu': 'finished books', 'sub_en-cours': 'currently reading', 'sub_a-lire': 'waiting on the shelf',
    'sub_abandonne': 'started, not finished', 'sub_wishlist': 'recommendations to discover',
    sortLabel: 'Sort', sort_recent: 'Recently added', sort_finished: 'Date read', sort_title: 'Title A → Z',
    sort_author: 'Author A → Z', sort_rating: 'Top rated',
    close: 'Close', cancel: 'Cancel', save: 'Save', edit: 'Edit', delete: 'Delete', rename: 'Rename', actions: 'Actions',
    manageProfiles: 'Manage profiles', manageProfilesAction: 'New profile / manage', logout: 'Log out', active: '(active)',
    profilesIntro: 'Each profile has its own book list. All profiles are synced to your account — available from any device.',
    newProfile: 'New profile', name: 'Name', profileNamePh: 'e.g. Marlène, Sophie…', color: 'Colour',
    export: 'Export', import: 'Import', createProfile: 'Create profile',
    profileNameRequired: 'Give the profile a name.', renamePrompt: 'New profile name:', cantDeleteLast: "You can't delete the last profile.",
    confirmDeleteProfile: 'Delete the profile “{name}” and its {n} book(s)? This cannot be undone.',
    confirmImportProfiles: 'Import {n} profile(s)? (This will replace all your current profiles)',
    confirmImportBooks: 'Import {n} book(s) into the profile “{name}”?', invalidFormat: 'Invalid format', importError: 'Import error: ',
    addBook: 'Add a book', editBook: 'Edit book', autofill: 'Autofill', lookupPh: 'Title, author or ISBN…',
    lookupHint: 'Pick a result to fill in the title, author and cover',
    title: 'Title', titlePh: "The book's title", author: 'Author', authorPh: 'Who wrote it?', category: 'Category',
    cover: 'Cover', coverPh: 'Image URL (filled in automatically)',
    finishedOn: 'Finished on', rating: 'Rating', review: 'Review',
    reviewPh: 'What you thought of it…', reviewPhReading: 'Your thoughts so far…', reviewPhAbandoned: 'Why did you give up on it?',
    recoBy: 'Recommended by', recoByPh: 'Who recommended it?', tags: 'Tags', tagPh: 'Add a tag…',
    tagHint: 'Type to see existing tags — Enter / comma to confirm, Tab to autocomplete',
    removeTag: 'remove', createTag: '+ Create “{q}”', newTag: 'new', clearTags: '✕ clear all',
    books_one: '{n} book', books_other: '{n} books', readIn: 'Read in {date}',
    noResults: 'No results', tryAnother: 'Try another search.', emptyTitle: 'Nothing here yet',
    emptyHint: 'Click “Add” to start your collection.', confirmDeleteBook: 'Delete this book?',
    moveTo: 'Move to',
    goal: 'Goal', goalOf: '/ {goal} books in {year}', readYear_one: 'book read in {year}', readYear_other: 'books read in {year}',
    totalRead: 'Read in total', authorsRead: 'Authors read', avgRating: 'Average rating', byYear: 'Books read per year',
    topAuthors: 'Most-read authors', topTags: 'Favourite tags', noneRead: 'No books read in this profile yet.',
    undated_one: '{n} read book has no finish date: add it via “Edit” to count it by year.',
    undated_other: '{n} read books have no finish date: add it via “Edit” to count them by year.',
    searching: 'Searching…', noneFound: 'No book found. You can fill in the details by hand.',
    migrated: '✓ {n} book(s) migrated from this device', connected: '✓ Signed in — {email}', saved: '✓ Saved — {email}',
    offline: 'Offline mode — local data',
    syncRetry: 'No connection: your changes are kept on this device and will be sent automatically.',
    sizeWarning: 'Your collection uses {pct}% of the available space. Consider exporting a backup.', loadError: 'Loading error: ', saveError: 'Saving error: ',
  },
};

const LANG_KEY = 'mes-livres-lang';
let currentLang = 'fr';
try {
  const savedLang = localStorage.getItem(LANG_KEY);
  currentLang = savedLang === 'en' || savedLang === 'fr'
    ? savedLang
    : ((navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en');
} catch (e) {}

function t(key, params) {
  let str = I18N[currentLang][key] ?? I18N.fr[key] ?? key;
  if (params) Object.entries(params).forEach(([k, v]) => { str = str.split(`{${k}}`).join(v); });
  return str;
}

// Pluriel : en français 0 et 1 sont au singulier, en anglais seul 1 l'est
function tn(key, n, params) {
  const one = currentLang === 'fr' ? n <= 1 : n === 1;
  return t(key + (one ? '_one' : '_other'), { n, ...params });
}

function locale() { return t('locale'); }
function catLabel(k) { return t('cat_' + k); }

function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); el.setAttribute('aria-label', t(el.dataset.i18nTitle)); });
  document.getElementById('auth-submit').textContent = authMode === 'login' ? t('login') : t('createAccount');
  document.getElementById('modal-title').textContent = document.getElementById('edit-id').value ? t('editBook') : t('addBook');
  const tagInput = document.getElementById('f-tag-input');
  if (tagInput) tagInput.placeholder = t('tagPh');
}

function toggleLanguage() {
  currentLang = currentLang === 'fr' ? 'en' : 'fr';
  try { localStorage.setItem(LANG_KEY, currentLang); } catch (e) {}
  applyTranslations();
  updateModalFields();
  document.getElementById('profile-dropdown').classList.remove('active');
  closeCardMenu();
  if (currentUser) {
    renderProfileSelector();
    renderProfileList();
    render();
    if (document.getElementById('stats-modal').classList.contains('active')) renderStats();
    setSyncStatus('');
  }
}

