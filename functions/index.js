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
import { decideQuota } from './quota.js';

initializeApp();
const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

// Jour au format AAAA-MM-JJ, heure de Paris (le compteur repart à minuit à Paris)
const parisDay = () => new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date());

// Réserve une demande pour aujourd'hui, ou indique quelle limite la bloque.
// - recoUsage/{uid} : compteur du compte (inaccessible depuis l'appli, cf. firestore.rules)
// - recoDaily/{jour} : compteur global du jour et détail par compte (lisible par l'administratrice)
async function takeQuota(uid) {
  const db = getFirestore();
  const day = parisDay();
  const userRef = db.collection('recoUsage').doc(uid);
  const dayRef = db.collection('recoDaily').doc(day);
  return db.runTransaction(async tx => {
    const [userSnap, daySnap] = await Promise.all([tx.get(userRef), tx.get(dayRef)]);
    const decision = decideQuota(userSnap.exists ? userSnap.data() : {}, daySnap.exists ? daySnap.data() : {}, uid, day);
    if (decision.blocked) {
      tx.set(dayRef, decision.dayUpdate, { merge: true });
    } else {
      tx.set(userRef, decision.userUpdate);
      tx.set(dayRef, decision.dayUpdate, { merge: true });
    }
    return { ...decision, day };
  });
}

// Résultat d'une demande dans le détail du jour : réussite (tokens, coût) ou échec
async function trackDaily(day, uid, usage) {
  const stats = usage
    ? { ok: FieldValue.increment(1), cost: FieldValue.increment(usage.cost),
        tokensIn: FieldValue.increment(usage.input), tokensOut: FieldValue.increment(usage.output) }
    : { failed: FieldValue.increment(1) };
  try {
    await getFirestore().collection('recoDaily').doc(day).set({ ...stats, users: { [uid]: stats } }, { merge: true });
  } catch (e) {
    logger.warn('suivi quotidien non enregistré', e);
  }
}

// Suivi pour la page admin.html : ajouté au document usage/{uid} déjà utilisé par l'appli,
// dans le mois en cours. Statuts : « reco » (réussie), « recoFailed », « recoBlocked » (limite du compte),
// « recoBlockedGlobal » (plafond de tous les comptes).
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
  const uid = request.auth.uid;
  const quota = await takeQuota(uid);
  if (quota.blocked) {
    // « recoBlocked » : limite du compte ; « recoBlockedGlobal » : plafond de tous les comptes
    await trackReco(uid, quota.blocked === 'user' ? 'recoBlocked' : 'recoBlockedGlobal');
    logger.info('recommandations bloquées', { uid, reason: quota.blocked });
    throw new HttpsError('resource-exhausted', 'Limite quotidienne atteinte.', { reason: quota.blocked });
  }
  let result;
  try {
    result = await recommend(input, ANTHROPIC_API_KEY.value());
  } catch (e) {
    logger.error('recommandations : échec', e);
    await Promise.all([trackReco(uid, 'recoFailed'), trackDaily(quota.day, uid, null)]);
    throw new HttpsError('internal', 'Recommandations indisponibles pour le moment.');
  }
  logger.info('recommandations', { uid, items: input.items.length, ...result.usage });
  await Promise.all([trackReco(uid, 'reco', result.usage), trackDaily(quota.day, uid, result.usage)]);
  return { profil: result.profil, recommandations: result.recommandations, remaining: quota.remaining };
});
