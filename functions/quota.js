// ===== LIMITES DES RECOMMANDATIONS =====
// Logique sans accès à la base (testée par test-quota.js) : décide si une demande passe
// et prépare les écritures de la transaction faite dans index.js.
import { FieldValue } from 'firebase-admin/firestore';

// Demandes autorisées par jour (chaque appel est payant) : par compte, et pour
// l'ensemble des comptes (plafond de dépense global)
export const LIMITS = { user: 5, global: 30 };

export function decideQuota(prevUser, prevDay, uid, day, now = Date.now()) {
  const userCount = prevUser.day === day ? prevUser.count || 0 : 0;
  const globalCount = prevDay.count || 0;
  const base = { limits: LIMITS, updatedAt: now };
  if (userCount >= LIMITS.user || globalCount >= LIMITS.global) {
    const reason = userCount >= LIMITS.user ? 'user' : 'global';
    return {
      blocked: reason,
      dayUpdate: { ...base, [reason === 'user' ? 'blockedUser' : 'blockedGlobal']: FieldValue.increment(1),
        users: { [uid]: { blocked: FieldValue.increment(1), lastAt: now } } },
    };
  }
  return {
    blocked: null,
    remaining: Math.min(LIMITS.user - userCount - 1, LIMITS.global - globalCount - 1),
    userUpdate: { day, count: userCount + 1, total: (prevUser.total || 0) + 1, lastAt: now },
    dayUpdate: { ...base, count: FieldValue.increment(1), users: { [uid]: { count: FieldValue.increment(1), lastAt: now } } },
  };
}
