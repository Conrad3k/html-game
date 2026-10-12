// Testy Artificial Battles: node tests/run.mjs [filtr nazwy] [--quick]
// Plik gry: najnowsze wydanie w katalogu repozytorium albo AB_FILE=ścieżka.
import { readdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, gameFile, closeBrowser } from './harness.mjs';

const args = process.argv.slice(2);
const quick = args.includes('--quick') || process.env.AB_QUICK === '1';
const filter = args.filter(a => !a.startsWith('--'));
const dir = join(ROOT, 'tests');
const files = readdirSync(dir).filter(f => f.endsWith('.test.mjs')).sort();

const all = [];
for (const f of files) {
    const mod = await import(pathToFileURL(join(dir, f)).href);
    for (const t of mod.default || []) all.push({ file: f, ...t });
}
const chosen = all.filter(t => (!filter.length || filter.some(s => (t.file + ' ' + t.name).toLowerCase().includes(s.toLowerCase()))) && !(quick && t.slow));

console.log(`Artificial Battles — testy: ${basename(gameFile())}`);
console.log(`${chosen.length} z ${all.length} testów${quick ? ' (szybkie)' : ''}\n`);
let ok = 0, bad = 0;
const t0 = Date.now();
for (const t of chosen) {
    const s = Date.now();
    try {
        await t.run({ quick });
        ok++;
        console.log(`  ✓ ${t.name} (${((Date.now() - s) / 1000).toFixed(1)} s)`);
    } catch (e) {
        bad++;
        console.log(`  ✗ ${t.name} (${((Date.now() - s) / 1000).toFixed(1)} s)\n      ${String(e && e.stack || e).split('\n').slice(0, 12).join('\n      ')}`);
    }
}
await closeBrowser();
console.log(`\n${ok} zaliczonych, ${bad} niezaliczonych — ${((Date.now() - t0) / 1000).toFixed(0)} s`);
process.exit(bad ? 1 : 0);
