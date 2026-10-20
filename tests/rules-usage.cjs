// Teste les règles des statistiques d'utilisation (usage/{uid}) de firestore.rules sur les
// serveurs de Firebase, sans rien publier : node tests/rules-usage.cjs firestore.rules
// Nécessite firebase-tools installé globalement et connecté (firebase login).
// Pas lancé par GitHub (il faut un compte connecté) : à faire avant de coller de nouvelles règles.
const FT = require('child_process').execSync('npm root -g').toString().trim() + '/firebase-tools/lib/';
const { requireAuth } = require(FT + 'requireAuth');
const { Client } = require(FT + 'apiv2');
const { rulesOrigin } = require(FT + 'api');
const fs = require('fs');
const src = fs.readFileSync(process.argv[2] || require('path').join(__dirname, '..', 'firestore.rules'), 'utf8');
const P = '/databases/(default)/documents/usage/u1';
const auth = { uid: 'u1', token: { email: 'a@b.fr' } };
const TIME = '2026-10-20T10:00:00Z', M = '2026-10';
const base = { email: 'a@b.fr', firstSeen: 1, lastSeen: 1, itemCount: 3, months: { [M]: { sessions: 2, modified: 1, recoRequests: 4, recoCost: 0.1 }, '2026-09': { sessions: 9 } } };
const merge = (a, b) => JSON.parse(JSON.stringify({ ...a, ...b }));
const withMonth = (m, v) => merge(base, { months: { ...base.months, [m]: v } });
const cases = [
  ['ALLOW', 'create: première visite', 'create', null, { email: 'a@b.fr', firstSeen: 5, lastSeen: 5, createdByMonth: { [M]: 2 }, itemCount: 2, profileCount: 1, docBytes: 900 }],
  ['ALLOW', 'create: premier compteur du mois', 'create', null, { months: { [M]: { sessions: 1, lastSeen: 5 } } }],
  ['ALLOW', 'update: visite (champs généraux)', 'update', base, merge(base, { lastSeen: 9, itemCount: 4, docBytes: 1000, createdByMonth: { [M]: 4 } })],
  ['ALLOW', 'update: sessions +1', 'update', base, withMonth(M, { ...base.months[M], sessions: 3, lastSeen: 9 })],
  ['ALLOW', 'update: deleted 0 -> 1', 'update', base, withMonth(M, { ...base.months[M], deleted: 1 })],
  ['DENY', 'update: mois suivant en milieu de mois', 'update', base, withMonth('2026-11', { sessions: 1 })],
  ['ALLOW', 'update: 31 oct. 23 h UTC, mois de novembre (heure de Paris)', 'update', base, withMonth('2026-11', { sessions: 1 }), '2026-10-31T23:00:00Z'],
  ['ALLOW', 'update: 1er nov. 2 h UTC, encore octobre (heure de New York)', 'update', base, withMonth(M, { ...base.months[M], sessions: 3 }), '2026-11-01T02:00:00Z'],
  ['DENY', 'update: sessions +5', 'update', base, withMonth(M, { ...base.months[M], sessions: 7 })],
  ['DENY', 'update: sessions en baisse', 'update', base, withMonth(M, { ...base.months[M], sessions: 1 })],
  ['DENY', 'update: coût des recommandations', 'update', base, withMonth(M, { ...base.months[M], recoCost: 0 })],
  ['DENY', 'update: mois passé', 'update', base, withMonth('2026-09', { sessions: 10 })],
  ['DENY', 'update: e-mail d\'un autre', 'update', base, merge(base, { email: 'x@y.fr' })],
  ['DENY', 'update: firstSeen réécrit', 'update', base, merge(base, { firstSeen: 0 })],
  ['DENY', 'update: champ inconnu', 'update', base, merge(base, { admin: true })],
  ['DENY', 'update: deux mois à la fois', 'update', base, merge(base, { months: { ...base.months, [M]: { ...base.months[M], sessions: 3 }, '2026-11': { sessions: 1 } } })],
  ['DENY', 'update: document d\'un autre compte', 'update-other', base, merge(base, { lastSeen: 9 })],
];
(async () => {
  const { configstore } = require(FT + 'configstore');
  await requireAuth({ user: configstore.get('user'), tokens: configstore.get('tokens') });
  const c = new Client({ urlPrefix: rulesOrigin(), apiVersion: 'v1' });
  const testCases = cases.map(([expectation, , method, before, after, time]) => ({
    expectation,
    request: { auth: method === 'update-other' ? { uid: 'u2', token: { email: 'a@b.fr' } } : auth, path: P, method: method === 'update-other' ? 'update' : method, time: time || TIME, resource: { data: after } },
    ...(before ? { resource: { data: before } } : {}),
  }));
  const res = await c.post('/projects/mes-livres-dafce:test', { source: { files: [{ name: 'firestore.rules', content: src }] }, testSuite: { testCases } });
  const body = res.body;
  if (body.issues) console.log('ISSUES', JSON.stringify(body.issues, null, 1));
  let fails = 0;
  (body.testResults || []).forEach((r, i) => {
    const ok = r.state === 'SUCCESS'; if (!ok) fails++;
    console.log(ok ? '✔' : '✖', cases[i][0], cases[i][1], ok ? '' : JSON.stringify(r.debugMessages || r.errorPosition || ''));
  });
  console.log(fails ? `${fails} échec(s)` : 'tout passe');
  if (fails) process.exit(1);
})().catch(e => { console.error('Erreur', e.message, JSON.stringify(e.context && e.context.body || '')); process.exit(1); });
