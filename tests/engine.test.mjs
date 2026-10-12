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
    }
];
