// ===== LANGUE (FR / EN) =====
const I18N = {
  fr: {
    locale: 'fr-FR', docTitle: 'Mes Livres', langSwitch: 'English',
    appTitle: 'Bibliothèque', authSubtitle: 'Connecte-toi pour retrouver tes livres',
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
    sortLabel: 'Trier', sort_recent: 'Ajout récent', sort_title: 'Titre A → Z',
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
    // --- Types ---
    type_tout: 'Tout', type_livre: 'Livres', type_film: 'Films', type_serie: 'Séries', type_jeu: 'Jeux',
    typeOne_livre: 'Livre', typeOne_film: 'Film', typeOne_serie: 'Série', typeOne_jeu: 'Jeu', typeLabel: 'Type',
    tagline: 'Livres, films, séries et jeux',
    'cat_lu__tout': 'Terminés', 'cat_en-cours__tout': 'En cours', 'cat_a-lire__tout': 'À découvrir', 'cat_abandonne__tout': 'Abandonnés',
    'sub_lu__tout': 'lus, vus, finis', 'sub_en-cours__tout': 'en ce moment', 'sub_a-lire__tout': 'à lire, voir, jouer', 'sub_abandonne__tout': 'commencés, non finis', 'sub_wishlist__tout': 'envies et recos',
    'cat_lu__film': 'Vus', 'cat_a-lire__film': 'À voir',
    'sub_lu__film': 'films vus', 'sub_a-lire__film': 'à regarder', 'sub_wishlist__film': 'films à découvrir',
    'cat_lu__serie': 'Vues', 'cat_a-lire__serie': 'À voir', 'cat_abandonne__serie': 'Abandonnées',
    'sub_lu__serie': 'séries terminées', 'sub_en-cours__serie': 'épisodes en cours', 'sub_a-lire__serie': 'à commencer', 'sub_abandonne__serie': 'laissées de côté', 'sub_wishlist__serie': 'séries à découvrir',
    'cat_lu__jeu': 'Terminés', 'cat_a-lire__jeu': 'À jouer', 'cat_abandonne__jeu': 'Abandonnés',
    'sub_lu__jeu': 'jeux terminés', 'sub_en-cours__jeu': 'parties en cours', 'sub_a-lire__jeu': 'dans la pile', 'sub_abandonne__jeu': 'laissés de côté', 'sub_wishlist__jeu': 'jeux à découvrir',
    'catOne_lu__livre': 'Lu', 'catOne_lu__film': 'Vu', 'catOne_lu__serie': 'Vue', 'catOne_lu__jeu': 'Terminé',
    'catOne_abandonne__serie': 'Abandonnée', 'catOne_abandonne__jeu': 'Abandonné',
    'items_one__tout': '{n} élément', 'items_other__tout': '{n} éléments',
    'items_one__livre': '{n} livre', 'items_other__livre': '{n} livres',
    'items_one__film': '{n} film', 'items_other__film': '{n} films',
    'items_one__serie': '{n} série', 'items_other__serie': '{n} séries',
    'items_one__jeu': '{n} jeu', 'items_other__jeu': '{n} jeux',
    'addBook__film': 'Ajouter un film', 'addBook__serie': 'Ajouter une série', 'addBook__jeu': 'Ajouter un jeu',
    'editBook__film': 'Modifier le film', 'editBook__serie': 'Modifier la série', 'editBook__jeu': 'Modifier le jeu',
    'titlePh__film': 'Le titre du film', 'titlePh__serie': 'Le titre de la série', 'titlePh__jeu': 'Le nom du jeu',
    'author__film': 'Réalisation', 'author__serie': 'Création', 'author__jeu': 'Studio',
    'authorPh__film': "Qui l'a réalisé ?", 'authorPh__serie': "Qui l'a créée ?", 'authorPh__jeu': 'Quel studio ?',
    'cover__film': 'Affiche', 'cover__serie': 'Affiche', 'cover__jeu': 'Jaquette',
    'finishedOn__livre': 'Lu le', 'finishedOn__film': 'Vu le', 'finishedOn__serie': 'Terminée le', 'finishedOn__jeu': 'Terminé le',
    'readIn__film': 'Vu en {date}', 'readIn__serie': 'Vue en {date}', 'readIn__jeu': 'Terminé en {date}',
    year: 'Année', yearPh: 'ex : 2024', platform: 'Plateforme', platformPh: 'Switch, PS5, PC…',
    progress: "Où j'en suis", progressPh: 'ex : saison 4 à voir', progressHint: 'Texte libre, affiché sur la carte',
    sort_finished: 'Date de fin', 'sort_author__tout': 'Créateur A → Z', 'sort_author__film': 'Réalisation A → Z', 'sort_author__serie': 'Création A → Z', 'sort_author__jeu': 'Studio A → Z',
    confirmDeleteItem: 'Supprimer « {title} » ?',
    'readYear_one__tout': 'terminé en {year}', 'readYear_other__tout': 'terminés en {year}',
    'readYear_one__film': 'film vu en {year}', 'readYear_other__film': 'films vus en {year}',
    'readYear_one__serie': 'série vue en {year}', 'readYear_other__serie': 'séries vues en {year}',
    'readYear_one__jeu': 'jeu terminé en {year}', 'readYear_other__jeu': 'jeux terminés en {year}',
    'goalOf__tout': '/ {goal} en {year}', 'goalOf__film': '/ {goal} films en {year}', 'goalOf__serie': '/ {goal} séries en {year}', 'goalOf__jeu': '/ {goal} jeux en {year}',
    'totalRead__tout': 'Terminés au total', 'totalRead__film': 'Vus au total', 'totalRead__serie': 'Vues au total', 'totalRead__jeu': 'Terminés au total',
    'authorsRead__tout': 'Créateurs', 'authorsRead__film': 'Réalisateurs', 'authorsRead__serie': 'Créateurs', 'authorsRead__jeu': 'Studios',
    'byYear__tout': 'Terminés par année', 'byYear__film': 'Films vus par année', 'byYear__serie': 'Séries vues par année', 'byYear__jeu': 'Jeux terminés par année',
    'topAuthors__tout': 'Créateurs favoris', 'topAuthors__film': 'Réalisateurs les plus vus', 'topAuthors__serie': 'Créateurs les plus vus', 'topAuthors__jeu': 'Studios les plus joués',
    'noneRead__tout': 'Rien de terminé pour l\'instant dans ce profil.', 'noneRead__film': 'Pas encore de film vu dans ce profil.', 'noneRead__serie': 'Pas encore de série vue dans ce profil.', 'noneRead__jeu': 'Pas encore de jeu terminé dans ce profil.',
    'undated_one__tout': '{n} élément terminé sans date de fin : ajoute-la via « Modifier » pour le compter par année.',
    'undated_other__tout': '{n} éléments terminés sans date de fin : ajoute-la via « Modifier » pour les compter par année.',
    'emptyHint__tout': 'Clique sur « Ajouter » pour commencer ta collection.',
    'lookupPh__film': 'Titre du film…', 'lookupPh__serie': 'Titre de la série…', 'lookupPh__jeu': 'Nom du jeu…',
    'lookupHint__film': "Choisis un résultat pour remplir le titre, la réalisation, l'année et l'affiche",
    'lookupHint__serie': "Choisis un résultat pour remplir le titre, la création, l'année et l'affiche",
    'lookupHint__jeu': "Choisis un résultat pour remplir le nom, le studio, l'année et la jaquette",
    credits: "Fiches : Open Library, Google Books, TMDB et RAWG. Cette appli utilise l'API TMDB sans être approuvée ni certifiée par TMDB.",
  },
  en: {
    locale: 'en-GB', docTitle: 'My Books', langSwitch: 'Français',
    appTitle: 'Library', authSubtitle: 'Sign in to find your books',
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
    sortLabel: 'Sort', sort_recent: 'Recently added', sort_title: 'Title A → Z',
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
    // --- Types ---
    type_tout: 'All', type_livre: 'Books', type_film: 'Films', type_serie: 'Shows', type_jeu: 'Games',
    typeOne_livre: 'Book', typeOne_film: 'Film', typeOne_serie: 'Show', typeOne_jeu: 'Game', typeLabel: 'Type',
    tagline: 'Books, films, shows and games',
    'cat_lu__tout': 'Finished', 'cat_en-cours__tout': 'In progress', 'cat_a-lire__tout': 'To discover', 'cat_abandonne__tout': 'Abandoned',
    'sub_lu__tout': 'read, watched, played', 'sub_en-cours__tout': 'right now', 'sub_a-lire__tout': 'to read, watch, play', 'sub_abandonne__tout': 'started, not finished', 'sub_wishlist__tout': 'wishes and recs',
    'cat_lu__film': 'Watched', 'cat_a-lire__film': 'To watch',
    'sub_lu__film': 'films watched', 'sub_a-lire__film': 'to watch', 'sub_wishlist__film': 'films to discover',
    'cat_lu__serie': 'Watched', 'cat_en-cours__serie': 'Watching', 'cat_a-lire__serie': 'To watch', 'cat_abandonne__serie': 'Dropped',
    'sub_lu__serie': 'finished shows', 'sub_en-cours__serie': 'episodes in progress', 'sub_a-lire__serie': 'to start', 'sub_abandonne__serie': 'set aside', 'sub_wishlist__serie': 'shows to discover',
    'cat_lu__jeu': 'Finished', 'cat_en-cours__jeu': 'Playing', 'cat_a-lire__jeu': 'To play',
    'sub_lu__jeu': 'games finished', 'sub_en-cours__jeu': 'games in progress', 'sub_a-lire__jeu': 'in the backlog', 'sub_abandonne__jeu': 'set aside', 'sub_wishlist__jeu': 'games to discover',
    'catOne_lu__livre': 'Read', 'catOne_lu__film': 'Watched', 'catOne_lu__serie': 'Watched', 'catOne_lu__jeu': 'Finished',
    'items_one__tout': '{n} item', 'items_other__tout': '{n} items',
    'items_one__livre': '{n} book', 'items_other__livre': '{n} books',
    'items_one__film': '{n} film', 'items_other__film': '{n} films',
    'items_one__serie': '{n} show', 'items_other__serie': '{n} shows',
    'items_one__jeu': '{n} game', 'items_other__jeu': '{n} games',
    'addBook__film': 'Add a film', 'addBook__serie': 'Add a show', 'addBook__jeu': 'Add a game',
    'editBook__film': 'Edit film', 'editBook__serie': 'Edit show', 'editBook__jeu': 'Edit game',
    'titlePh__film': "The film's title", 'titlePh__serie': "The show's title", 'titlePh__jeu': "The game's name",
    'author__film': 'Director', 'author__serie': 'Created by', 'author__jeu': 'Studio',
    'authorPh__film': 'Who directed it?', 'authorPh__serie': 'Who created it?', 'authorPh__jeu': 'Which studio?',
    'cover__film': 'Poster', 'cover__serie': 'Poster', 'cover__jeu': 'Box art',
    'finishedOn__livre': 'Read on', 'finishedOn__film': 'Watched on', 'finishedOn__serie': 'Finished on', 'finishedOn__jeu': 'Finished on',
    'readIn__film': 'Watched in {date}', 'readIn__serie': 'Watched in {date}', 'readIn__jeu': 'Finished in {date}',
    year: 'Year', yearPh: 'e.g. 2024', platform: 'Platform', platformPh: 'Switch, PS5, PC…',
    progress: 'Where I am', progressPh: 'e.g. season 4 next', progressHint: 'Free text, shown on the card',
    sort_finished: 'Date finished', 'sort_author__tout': 'Creator A → Z', 'sort_author__film': 'Director A → Z', 'sort_author__serie': 'Creator A → Z', 'sort_author__jeu': 'Studio A → Z',
    confirmDeleteItem: 'Delete “{title}”?',
    'readYear_one__tout': 'finished in {year}', 'readYear_other__tout': 'finished in {year}',
    'readYear_one__film': 'film watched in {year}', 'readYear_other__film': 'films watched in {year}',
    'readYear_one__serie': 'show watched in {year}', 'readYear_other__serie': 'shows watched in {year}',
    'readYear_one__jeu': 'game finished in {year}', 'readYear_other__jeu': 'games finished in {year}',
    'goalOf__tout': '/ {goal} in {year}', 'goalOf__film': '/ {goal} films in {year}', 'goalOf__serie': '/ {goal} shows in {year}', 'goalOf__jeu': '/ {goal} games in {year}',
    'totalRead__tout': 'Finished in total', 'totalRead__film': 'Watched in total', 'totalRead__serie': 'Watched in total', 'totalRead__jeu': 'Finished in total',
    'authorsRead__tout': 'Creators', 'authorsRead__film': 'Directors', 'authorsRead__serie': 'Creators', 'authorsRead__jeu': 'Studios',
    'byYear__tout': 'Finished per year', 'byYear__film': 'Films watched per year', 'byYear__serie': 'Shows watched per year', 'byYear__jeu': 'Games finished per year',
    'topAuthors__tout': 'Favourite creators', 'topAuthors__film': 'Most-watched directors', 'topAuthors__serie': 'Most-watched creators', 'topAuthors__jeu': 'Most-played studios',
    'noneRead__tout': 'Nothing finished in this profile yet.', 'noneRead__film': 'No films watched in this profile yet.', 'noneRead__serie': 'No shows watched in this profile yet.', 'noneRead__jeu': 'No games finished in this profile yet.',
    'undated_one__tout': '{n} finished item has no finish date: add it via “Edit” to count it by year.',
    'undated_other__tout': '{n} finished items have no finish date: add it via “Edit” to count them by year.',
    'emptyHint__tout': 'Click “Add” to start your collection.',
    'lookupPh__film': 'Film title…', 'lookupPh__serie': 'Show title…', 'lookupPh__jeu': 'Game name…',
    'lookupHint__film': 'Pick a result to fill in the title, director, year and poster',
    'lookupHint__serie': 'Pick a result to fill in the title, creator, year and poster',
    'lookupHint__jeu': 'Pick a result to fill in the name, studio, year and box art',
    credits: 'Data: Open Library, Google Books, TMDB and RAWG. This product uses the TMDB API but is not endorsed or certified by TMDB.',
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
  renderTypePicker();
  fillCategorySelect(document.getElementById('f-categorie').value);
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

