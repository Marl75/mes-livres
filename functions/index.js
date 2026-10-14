// ===== FONCTIONS SERVEUR DE COLLECTION =====
// La clé Anthropic ne peut pas figurer dans l'appli (tout son code est public) : elle est
// gardée dans Secret Manager et seule cette fonction l'utilise.
// Mise en place de la clé : firebase functions:secrets:set ANTHROPIC_API_KEY
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { cleanInput, recommend } from './recommend.js';

initializeApp();
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// Demandes de recommandations autorisées par compte et par jour (chaque appel est payant)
const DAILY_LIMIT = 5;

// Réserve une demande pour aujourd'hui ; refuse au-delà de la limite.
// Le compteur est dans recoUsage/{uid}, inaccessible depuis l'appli (cf. firestore.rules).
async function takeQuota(uid) {
  const db = getFirestore();
  const ref = db.collection('recoUsage').doc(uid);
  const day = new Date().toISOString().slice(0, 10);
  return db.runTransaction(async tx => {
    const snap = await tx.get(ref);
    const prev = snap.exists ? snap.data() : {};
    const count = prev.day === day ? prev.count || 0 : 0;
    if (count >= DAILY_LIMIT) return -1;
    tx.set(ref, { day, count: count + 1, total: (prev.total || 0) + 1, lastAt: Date.now() });
    return DAILY_LIMIT - count - 1;
  });
}

// Suivi pour la page admin.html : ajouté au document usage/{uid} déjà utilisé par l'appli,
// dans le mois en cours. Statuts : « reco » (réussie), « recoFailed », « recoBlocked » (limite).
async function trackReco(uid, status, usage) {
  const d = new Date();
  const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const inc = { [status]: FieldValue.increment(1), recoLastAt: Date.now() };
  if (usage) {
    inc.recoTokensIn = FieldValue.increment(usage.input);
    inc.recoTokensOut = FieldValue.increment(usage.output);
    inc.recoCost = FieldValue.increment(usage.cost);
  }
  try {
    await getFirestore().collection('usage').doc(uid).set({ months: { [month]: inc } }, { merge: true });
  } catch (e) {
    logger.warn('suivi des recommandations non enregistré', e);
  }
}

export const recommendations = onCall({ secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, memory: '512MiB' }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const input = cleanInput(request.data);
  const remaining = await takeQuota(request.auth.uid);
  if (remaining < 0) {
    await trackReco(request.auth.uid, 'recoBlocked');
    throw new HttpsError('resource-exhausted', 'Limite quotidienne atteinte.');
  }
  let result;
  try {
    result = await recommend(input, ANTHROPIC_API_KEY.value());
  } catch (e) {
    logger.error('recommandations : échec', e);
    await trackReco(request.auth.uid, 'recoFailed');
    throw new HttpsError('internal', 'Recommandations indisponibles pour le moment.');
  }
  logger.info('recommandations', { uid: request.auth.uid, items: input.items.length, ...result.usage });
  await trackReco(request.auth.uid, 'reco', result.usage);
  return { profil: result.profil, recommandations: result.recommandations, remaining };
});
