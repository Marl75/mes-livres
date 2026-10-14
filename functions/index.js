// ===== FONCTIONS SERVEUR DE COLLECTION =====
// La clé Anthropic ne peut pas figurer dans l'appli (tout son code est public) : elle est
// gardée dans Secret Manager et seule cette fonction l'utilise.
// Mise en place de la clé : firebase functions:secrets:set ANTHROPIC_API_KEY
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
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

export const recommendations = onCall({ secrets: [ANTHROPIC_API_KEY], timeoutSeconds: 120, memory: '512MiB' }, async request => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Connexion requise.');
  const input = cleanInput(request.data);
  const remaining = await takeQuota(request.auth.uid);
  if (remaining < 0) throw new HttpsError('resource-exhausted', 'Limite quotidienne atteinte.');
  try {
    const result = await recommend(input, ANTHROPIC_API_KEY.value());
    logger.info('recommandations', { uid: request.auth.uid, items: input.items.length, ...result.usage });
    return { profil: result.profil, recommandations: result.recommandations, remaining };
  } catch (e) {
    logger.error('recommandations : échec', e);
    throw new HttpsError('internal', 'Recommandations indisponibles pour le moment.');
  }
});
