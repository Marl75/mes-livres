// Tests des limites de recommandations : npm test (dans functions/)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decideQuota, LIMITS } from './quota.js';

const DAY = '2026-10-20';

test('première demande du jour : acceptée', () => {
  const d = decideQuota({}, {}, 'u1', DAY);
  assert.equal(d.blocked, null);
  assert.equal(d.userUpdate.count, 1);
  assert.equal(d.remaining, LIMITS.user - 1);
});

test('compteur du compte remis à zéro un autre jour', () => {
  const d = decideQuota({ day: '2026-10-19', count: LIMITS.user, total: 12 }, {}, 'u1', DAY);
  assert.equal(d.blocked, null);
  assert.equal(d.userUpdate.count, 1);
  assert.equal(d.userUpdate.total, 13);
});

test('limite du compte atteinte : bloquée (user)', () => {
  const d = decideQuota({ day: DAY, count: LIMITS.user }, { count: 3 }, 'u1', DAY);
  assert.equal(d.blocked, 'user');
  assert.ok('blockedUser' in d.dayUpdate);
  assert.equal(d.userUpdate, undefined);
});

test('plafond global atteint : bloquée (global), même pour un nouveau compte', () => {
  const d = decideQuota({}, { count: LIMITS.global }, 'u2', DAY);
  assert.equal(d.blocked, 'global');
  assert.ok('blockedGlobal' in d.dayUpdate);
});

test('restant = le plus petit des deux plafonds', () => {
  const d = decideQuota({ day: DAY, count: 1 }, { count: LIMITS.global - 2 }, 'u1', DAY);
  assert.equal(d.blocked, null);
  assert.equal(d.remaining, 1);
});

test('dernière demande globale acceptée, la suivante bloquée', () => {
  assert.equal(decideQuota({}, { count: LIMITS.global - 1 }, 'u3', DAY).blocked, null);
  assert.equal(decideQuota({}, { count: LIMITS.global }, 'u3', DAY).blocked, 'global');
});

test('limites attendues : 5 par compte, 30 au total', () => {
  assert.deepEqual(LIMITS, { user: 5, global: 30 });
});
