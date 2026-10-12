// Silnik Raptor: optymalizacje muszą dawać dokładnie ten sam wynik co pełne przeliczenie
import assert from 'node:assert/strict';
import { openGame, closeGame, startMatch, sim, diploOptions, assertNoErrors } from './harness.mjs';
import { installHelpers } from './scenarios.mjs';

// Po każdej przebudowie siatki ścieżek i zmianie uprawnień bram: podział na regiony = pełne przeliczenie
async function verifyAlways(page) {
    await page.evaluate(() => {
        const pf = window.game.pathfinder, st = window.__rv = { checks: 0, bad: [] };
        const oe = pf.ensureGrid.bind(pf);
        let busy = false;
        // po każdej przebudowie siatki albo zmianie uprawnień bram (koniec ensureGrid)
        pf.ensureGrid = function () {
            const v0 = this.lastObstacleVersion, g0 = this._gateV;
            oe();
            if (busy || (v0 === this.lastObstacleVersion && g0 === this._gateV)) return;
            busy = true;
            st.checks++;
            const b = pf.verifyRegions();
            if (b.length && st.bad.length < 10) st.bad.push('t=' + Math.round(window.game.time) + ' ' + b.join(','));
            busy = false;
        };
    });
}

export default [
    {
        name: 'Regiony: łatanie po zmianach przeszkód i sojuszy daje to samo co pełne przeliczenie (kampania 8 nacji)',
        slow: true,
        async run({ quick }) {
            const page = await openGame();
            await startMatch(page, diploOptions(8, { truce: 120, autoplay: 'medium' }), { seed: 4242 });
            await sim(page, 240);
            await verifyAlways(page);
            await sim(page, quick ? 120 : 420);
            const r = await page.evaluate(() => window.__rv);
            assert.ok(r.checks > 50, 'za mało sprawdzeń: ' + r.checks);
            assert.deepEqual(r.bad, []);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Regiony: mury, bramy, sojusze i umowy zmieniane w trakcie - dokładnie jak pełne przeliczenie',
        async run() {
            const page = await openGame();
            await startMatch(page, diploOptions(4, { truce: 3000, events: false }), { seed: 77 });
            await installHelpers(page);
            await verifyAlways(page);
            const r = await page.evaluate(() => {
                const G = window.game, H = window.__ab, D = G.diplo, [A, B, C] = G.nations, pf = G.pathfinder;
                H.noAI();
                const step = (k) => { for (let i = 0; i < k; i++) G.simStep(Game.STEP); };
                const tb = H.tc(B), tc = H.tc(C);
                // wszystkie drużyny mają już policzone regiony (także wiersze wozów)
                const warm = () => { for (const n of G.nations) { pf.getRegions(pf.landGrid, n.team); if (D) pf.getRegions(pf.landGrid, n.team + 16); } };
                warm();
                H.wallRing(B, tb.x, tb.y, 380, H.tc(A).x, H.tc(A).y); step(3); warm();
                H.wallRing(C, tc.x, tc.y, 300, tb.x, tb.y); step(3); warm();
                D.makeTrade(A, B); step(3); warm();
                D.makeAlliance(A, C); step(3); warm();
                D.endTrade(A, B); step(3); warm();
                // wyrwa w murze (łączy dwa regiony) i zamurowanie jej (rozpad)
                const w = B.buildings.filter(b => b.type === 'wooden_wall');
                const hole = w.slice(10, 13);
                for (const x of hole) { x.hp = 0; G.killEntity(x, null); }
                step(30); warm();
                for (const x of hole) H.put(B, 'wooden_wall', x.x, x.y);
                step(3); warm();
                // ścięte drzewa i nowe budynki
                let k = 0;
                for (const nd of G.resourceNodes) if (!nd.isDestroyed && nd.type === 'wood' && k++ < 40) { nd.amount = 0; G.killEntity(nd, null); if (k % 5 === 0) step(2); }
                step(3); warm();
                return { checks: window.__rv.checks, bad: window.__rv.bad, gates: pf._gateCells };
            });
            assert.ok(r.checks >= 15, 'sprawdzeń: ' + r.checks);
            assert.equal(r.gates, 1);
            assert.deepEqual(r.bad, []);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Teren: kafelek wykończony etapami i HD wgrywane pasami - piksel w piksel jak wykończone naraz',
        async run() {
            const page = await openGame();
            await startMatch(page, diploOptions(4, { truce: 3000, events: false }), { seed: 5 });
            const r = await page.evaluate(() => {
                const T = window.game.terrain, out = { n: 0, water: 0, diff: [] };
                const px = (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
                const same = (a, b) => { if (a.length !== b.length) return false; for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
                const fresh = (ch) => Object.assign(Object.create(Object.getPrototypeOf(ch)), ch, { ready: false, canvas: null, ctx: null, wave: null, glints: null, pending: ch.pending.slice(), stamps: [] });
                const list = T.all.filter(ch => !ch.ready && !ch.ring).slice(0, 8);
                for (const ch of list) {
                    const res = terrainPaint(T.T, ch.x, ch.y, ch.w, ch.h, 1);
                    const A = fresh(ch), B = fresh(ch);
                    T.finishChunk(A, new Uint32Array(res.buf), res.water);
                    const d = { ch: B, buf: new Uint32Array(res.buf), water: res.water };
                    let k = 0; while (!T._finishStage(d) && k < 10) k++;
                    out.n++; if (A.wave) out.water++;
                    if (!B.ready || !same(px(A.canvas), px(B.canvas))) out.diff.push('obraz ' + ch.x + ',' + ch.y);
                    if (!!A.wave !== !!B.wave || (A.wave && !same(px(A.wave), px(B.wave)))) out.diff.push('fale ' + ch.x + ',' + ch.y);
                    T.readyCount -= 2;
                }
                // HD: cztery pasy putImageData = całość naraz
                const ch = list[0], res2 = terrainPaint(T.T, ch.x, ch.y, ch.w * 2, ch.h * 2, 2), W2 = ch.w * 2, H2 = ch.h * 2;
                const whole = T._canvasFrom(new Uint32Array(res2.buf), W2, H2).canvas;
                const c = document.createElement('canvas'); c.width = W2; c.height = H2;
                const img = new ImageData(new Uint8ClampedArray(res2.buf.buffer, res2.buf.byteOffset, W2 * H2 * 4), W2, H2), sh = Math.ceil(H2 / 4);
                for (let i = 0; i < 4; i++) c.getContext('2d').putImageData(img, 0, 0, 0, i * sh, W2, Math.min(sh, H2 - i * sh));
                if (!same(px(whole), px(c))) out.diff.push('HD pasami');
                return out;
            });
            assert.ok(r.n >= 6 && r.water >= 1, JSON.stringify(r));
            assert.deepEqual(r.diff, []);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Teren: po szybkim przejeździe kamery (Jakość, przybliżenie) kadr dorysowuje się w pełni - kafelki i HD',
        async run() {
            const page = await openGame(undefined, { seed: false, viewport: { width: 1600, height: 900 } });
            await startMatch(page, diploOptions(4, { truce: 3000, events: false, reveal: true }), { watch: true });
            await page.evaluate(() => { const g = window.game; g.gfxMode = 'quality'; g.setFx(Game.FX_MAX); g.zoomTarget = g.zoom = g.clampZoom(1.6); });
            await page.waitForTimeout(1500);
            for (const k of ['ArrowRight', 'ArrowDown']) { await page.keyboard.down(k); await page.waitForTimeout(2500); await page.keyboard.up(k); }
            const state = () => page.evaluate(() => { const T = window.game.terrain, L = T._vis; return { n: L.length, base: L.filter(c => !c.ready).length, hd: T.hdOn ? L.filter(c => !(c.hd && c.hd.ready)).length : 0, hdOn: !!T.hdOn }; });
            let s = await state(), t = 0;
            while ((s.base || s.hd) && t < 40) { await page.waitForTimeout(250); s = await state(); t++; }
            assert.equal(s.base, 0, 'niegotowe kafelki w kadrze: ' + JSON.stringify(s));
            assert.equal(s.hd, 0, 'kafelki bez HD w kadrze: ' + JSON.stringify(s));
            assert.ok(t * 250 <= 6000, 'dorysowanie trwało ' + t * 250 + ' ms');
            assertNoErrors(page);
            await closeGame(page);
        }
    }
];
