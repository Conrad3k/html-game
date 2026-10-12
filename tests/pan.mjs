// Pomiar: szybkie przesuwanie kamery klawiaturą na żywej pętli gry - czasy klatek i ich składniki, praca terenu
// na klatkę, opóźnienie od wciśnięcia klawisza do ruchu kamery.
// node tests/pan.mjs [plik] [poziom efektów, domyślnie 7 = Jakość] [--zoom=1.6]
import { resolve } from 'node:path';
import { openGame, closeGame, startMatch, diploOptions, closeBrowser } from './harness.mjs';

const args = process.argv.slice(2);
const file = args[0] && !/^\d+$/.test(args[0]) && !args[0].startsWith('--') ? resolve(args[0]) : undefined;
const fx = Number(args.find(a => /^\d+$/.test(a)) || 7);
const zoom = Number((args.find(a => a.startsWith('--zoom=')) || '--zoom=1').slice(7));

const page = await openGame(file, { seed: false, viewport: { width: 1600, height: 900 } });
await startMatch(page, diploOptions(6, { truce: 600, autoplay: 'medium', reveal: true }), { watch: true });
await page.evaluate(({ fx, zoom }) => { const g = window.game; g.gfxMode = 'quality'; g.setFx(fx); g.speed = 1; g.zoomTarget = g.zoom = g.clampZoom(zoom); }, { fx, zoom });
await page.waitForTimeout(3000);
await page.evaluate(() => {
    const g = window.game, T = g.terrain, st = window.__pan = { frames: [], parts: {}, lat: [], cur: {} };
    const wrap = (obj, name, key) => {
        const o = obj[name];
        if (!o) return;
        obj[name] = function (...a) { const t = performance.now(); const r = o.apply(this, a); const d = performance.now() - t; st.parts[key] = (st.parts[key] || 0) + d; st.cur[key] = (st.cur[key] || 0) + d; return r; };
    };
    for (const [n, k] of [['_hdTick', 'teren: HD'], ['_streamTick', 'teren: doczytywanie'], ['draw', 'teren: rysowanie'], ['_finishStage', 'etap'], ['_post', 'zlecenie'], ['_window', 'wycinek'], ['finishChunk', 'obraz kafelka'], ['_mask', 'maska'], ['buildWaveLayer', 'fale'], ['decorate', 'detale'], ['_motion', 'ruch']]) wrap(T, n, k);
    for (const [n, k] of [['updateFogCanvas', 'mgła'], ['pump', 'symulacja'], ['draw', 'klatka']]) wrap(g, n, k);
    const loop = g.loop;
    g.loop = function (ts) {
        const t0 = performance.now(); st.cur = {};
        const cx = this.camera.x, cy = this.camera.y;
        loop.call(this, ts);
        const t1 = performance.now();
        st.frames.push({ ms: t1 - t0, parts: st.cur, moving: Object.values(this.keys).some(Boolean) });
        if (st.keyAt && !st.seen && (this.camera.x !== cx || this.camera.y !== cy)) { st.seen = true; st.lat.push(t1 - st.keyAt); }
    };
    window.addEventListener('keydown', (e) => { if (!e.repeat) { st.keyAt = e.timeStamp; st.seen = false; } }, true);
});
for (const key of ['ArrowRight', 'ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
    await page.keyboard.down(key); await page.waitForTimeout(2500); await page.keyboard.up(key); await page.waitForTimeout(300);
}
const r = await page.evaluate(() => {
    const st = window.__pan, f = st.frames.slice(5), ms = f.map(x => x.ms).sort((a, b) => a - b);
    const q = (p) => ms[Math.min(ms.length - 1, Math.floor(p * ms.length))];
    const terr = (x) => (x.parts['teren: doczytywanie'] || 0) + (x.parts['teren: HD'] || 0);
    return {
        klatek: f.length, mediana: +q(0.5).toFixed(1), p99: +q(0.99).toFixed(1), max: +ms[ms.length - 1].toFixed(1),
        terenMaxNaKlatke: +Math.max(...f.map(terr)).toFixed(1),
        wRuchu: (() => { const m = f.filter(x => x.moving).map(terr).sort((a, b) => a - b); return { klatek: m.length, max: +m[m.length - 1].toFixed(1), p95: +m[Math.floor(m.length * 0.95)].toFixed(1), powyzej3ms: m.filter(x => x > 3).length, srednio: +(m.reduce((a, b) => a + b, 0) / m.length).toFixed(2) }; })(),
        terenKlatkiPowyzej3ms: f.filter(x => terr(x) > 3).length,
        terenSrednio: +(f.reduce((s, x) => s + terr(x), 0) / f.length).toFixed(2),
        opoznienieKlawisza: st.lat.map(x => Math.round(x)),
        skladnikiMax: Object.fromEntries(['etap', 'obraz kafelka', 'zlecenie', 'wycinek', 'teren: HD'].map(k => [k, +Math.max(...f.map(x => x.parts[k] || 0)).toFixed(1)])),
        najgorsze: f.slice().sort((a, b) => terr(b) - terr(a)).slice(0, 5).map(x => Object.fromEntries(Object.entries(x.parts).filter(([k]) => !['klatka', 'teren: rysowanie', 'symulacja', 'mgła'].includes(k)).map(([k, v]) => [k, +v.toFixed(1)]))),
        skladnikiSuma: Object.fromEntries(['etap', 'obraz kafelka', 'zlecenie', 'wycinek', 'teren: HD', 'teren: doczytywanie'].map(k => [k, +(st.parts[k] || 0).toFixed(0)]))
    };
});
console.log(JSON.stringify(r));
await closeGame(page); await closeBrowser();
