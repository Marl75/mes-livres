// ===== STATISTIQUES D'UTILISATION (pour la page de suivi admin.html) =====
// Un document usage/{uid} par compte : e-mail, première et dernière visite, et par mois
// le nombre d'ouvertures de l'appli, d'éléments modifiés et supprimés. Les éléments créés
// sont recalculés à partir des dates d'ajout (historique complet). Aucun contenu
// (titres, avis…) n'est enregistré ici. Lisible seulement par le compte lui-même et
// par l'administratrice (voir firestore.rules).
let usageRecorded = false;

function monthKey(date) {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function usageDoc() {
  return db.collection('usage').doc(currentUser.uid);
}

// Éléments encore présents, comptés par mois d'ajout, tous profils confondus
function createdByMonth() {
  const counts = {};
  state.profiles.forEach(p => (p.books || []).forEach(b => {
    if (!b.dateAdded) return;
    const m = monthKey(b.dateAdded);
    counts[m] = (counts[m] || 0) + 1;
  }));
  return counts;
}

// Une fois par ouverture de l'appli, après le chargement de la collection
async function recordVisit() {
  if (!currentUser || usageRecorded) return;
  usageRecorded = true;
  try {
    const ref = usageDoc();
    const snap = await ref.get();
    const now = Date.now();
    const data = {
      email: currentUser.email || '',
      lastSeen: now,
      createdByMonth: createdByMonth(),
      itemCount: state.profiles.reduce((n, p) => n + (p.books || []).length, 0),
      profileCount: state.profiles.length,
    };
    if (!snap.exists || !snap.data().firstSeen) data.firstSeen = now;
    await ref.set(data, { mergeFields: Object.keys(data) });
    await ref.set({ months: { [monthKey()]: { sessions: firebase.firestore.FieldValue.increment(1), lastSeen: now } } }, { merge: true });
  } catch (e) {
    usageRecorded = false;   // réessaiera au prochain chargement réussi
    console.warn('Statistiques non enregistrées :', e);
  }
}

// Compte une action du mois en cours : 'modified' ou 'deleted'
function trackUsage(field) {
  if (!currentUser) return;
  usageDoc().set({ months: { [monthKey()]: { [field]: firebase.firestore.FieldValue.increment(1) } } }, { merge: true })
    .catch(e => console.warn('Statistiques non enregistrées :', e));
}
