const assert = require('node:assert');
const test = require('node:test');
const path = require('node:path');

const modules = [
  '../assets/card-main-ticker.js',
  '../assets/card-ledger-lore.js',
  '../assets/card-artifact-appraisal.js',
  '../assets/card-gravity-well.js',
];

modules.forEach((modPath) => {
  test(`module ${modPath} exports render function`, (t) => {
    const mod = require(path.resolve(__dirname, modPath));
    assert.strictEqual(typeof mod.render, 'function');
  });
});
