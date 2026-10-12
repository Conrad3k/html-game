// Pomiar wydajności: node tests/bench.mjs [plik] [--profile]
// Symulacja (kampania Dyplomacji 8 nacji SI, Klasyczny 4 nacje na mapie Gigantycznej) i rysowanie klatki.
// Z --profile zapisuje profil CPU symulacji (tests/out/*.cpuprofile) i wypisuje najdroższe funkcje.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT, openGame, closeGame, startMatch, diploOptions, classicOptions, closeBrowser, digest } from './harness.mjs';

const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--')) ? resolve(args.find(a => !a.startsWith('--'))) : undefined;
const profile = args.includes('--profile');
const out = join(ROOT, 'tests', 'out');

async function timedSim(page, seconds) {
    return page.evaluate((s) => {
        const g = window.game, n = Math.round(s / Game.STEP);
        g._budgetExternal = true; g.pathBudget = 1e9; g.orderBudget = 1e9;
        const t0 = performance.now();
        for (let i = 0; i < n && !g.gameOver; i++) g.simStep(Game.STEP);
        g._budgetExternal = false;
        return performance.now() - t0;
    }, seconds);
}

async function scenario(name, opts, warm, measure) {
    const page = await openGame(file, { viewport: { width: 1600, height: 900 } });
    await startMatch(page, opts, { seed: 4242 });
    await timedSim(page, warm);
    let session = null;
    if (profile) { session = await page.context().newCDPSession(page); await session.send('Profiler.enable'); await session.send('Profiler.setSamplingInterval', { interval: 200 }); await session.send('Profiler.start'); }
    let ms = 0;
    for (let s = 0; s < measure; s += 60) ms += await timedSim(page, Math.min(60, measure - s));
    let top = null;
    if (session) {
        const { profile: prof } = await session.send('Profiler.stop');
        mkdirSync(out, { recursive: true });
        writeFileSync(join(out, name + '.cpuprofile'), JSON.stringify(prof));
        // czas własny funkcji (self time)
        const self = new Map(), byId = new Map(prof.nodes.map(n => [n.id, n]));
        const dt = prof.timeDeltas; let total = 0;
        prof.samples.forEach((id, i) => { const n = byId.get(id), k = n.callFrame.functionName + ':' + n.callFrame.lineNumber; self.set(k, (self.get(k) || 0) + (dt[i] || 0)); total += dt[i] || 0; });
        top = [...self].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([k, v]) => `${(v / total * 100).toFixed(1).padStart(5)}%  ${k}`);
    }
    // klatka obrazu w środku gry (kamera na stolicy gracza, poziom efektów 1 i najwyższy)
    const draw = await page.evaluate(() => {
        const g = window.game, res = {};
        for (const lvl of [1, Game.FX_MAX]) {
            g.setFx(lvl);
            for (let i = 0; i < 5; i++) g.draw(0.016);
            const t0 = performance.now();
            for (let i = 0; i < 30; i++) { g.renderTime += 0.016; g.draw(0.016); }
            res['fx' + lvl] = (performance.now() - t0) / 30;
        }
        return res;
    });
    const info = await page.evaluate(() => ({ t: Math.round(window.game.time), ents: window.game.entities.length, units: window.game.nations.reduce((s, n) => s + n.units.length, 0) }));
    const d = await digest(page);
    await closeGame(page);
    return { name, simMs: Math.round(ms), perGameMin: Math.round(ms / (measure / 60)), drawMs: { fx1: +draw.fx1.toFixed(2), fxMax: +draw['fx' + 7].toFixed(2) }, ...info, digest: d, top };
}

const res = [];
res.push(await scenario('dyplomacja-8', diploOptions(8, { truce: 180, autoplay: 'medium', events: true }), 300, 900));
res.push(await scenario('klasyczny-gigant', classicOptions({ autoplay: 'hard', mapSize: 5100, mapType: 'lakes', nations: [{ isPlayer: true, color: 'blue', team: 1 }, { isPlayer: false, color: 'red', team: 2, diff: 'hard' }, { isPlayer: false, color: 'green', team: 3, diff: 'hard' }, { isPlayer: false, color: 'yellow', team: 4, diff: 'brutal' }] }), 300, 600));
for (const r of res) {
    console.log(`\n== ${r.name}: symulacja ${r.simMs} ms (${r.perGameMin} ms na minutę gry), klatka ${r.drawMs.fx1} ms (efekty 1) / ${r.drawMs.fxMax} ms (efekty max), czas ${r.t} s, jednostek ${r.units}, encji ${r.ents}, odcisk ${r.digest}`);
    if (r.top) console.log(r.top.join('\n'));
}
await closeBrowser();
