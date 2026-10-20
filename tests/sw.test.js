// Vérifie que le service worker (sw.js) garde hors ligne tous les fichiers de l'appli : node --test tests/
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const sw = read('sw.js');
const core = [...sw.match(/const CORE = \[([\s\S]*?)\];/)[1].matchAll(/'\.\/([^']*)'/g)].map(m => m[1]);
const html = read('index.html');
const local = [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map(m => m[1]);

test('chaque script et feuille de style de index.html est dans CORE', () => {
  local.forEach(f => assert.ok(core.includes(f), `${f} manque dans CORE (sw.js)`));
});

test('chaque fichier de js/ est chargé par index.html', () => {
  fs.readdirSync(path.join(root, 'js')).filter(f => f.endsWith('.js'))
    .forEach(f => assert.ok(local.includes(`js/${f}`), `js/${f} n'est pas chargé par index.html`));
});

test('les fichiers de CORE existent', () => {
  core.filter(f => f).forEach(f => assert.ok(fs.existsSync(path.join(root, f)), `${f} introuvable`));
});

test('plus de numéro de version à changer à la main', () => {
  assert.ok(!/\b(?:js|css)\/[\w-]+\.(?:js|css)\?v=/.test(html), 'index.html contient encore des ?v=');
});

test('sync.js est chargé avant data.js, qui en a besoin', () => {
  assert.ok(local.indexOf('js/sync.js') < local.indexOf('js/data.js'));
});
