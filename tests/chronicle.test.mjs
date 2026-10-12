// V2.0: Kronika bitwy (game/Chronicle.js) - próbki, ważne chwile, ekran wyników
import assert from 'node:assert/strict';
import { openGame, closeGame, startMatch, sim, diploOptions, classicOptions, assertNoErrors } from './harness.mjs';

export default [
    {
        name: 'Kronika: próbki co 10 s, ważne chwile (ery, wojny, wydarzenia), przerzedzanie',
        async run() {
            const page = await openGame();
            await startMatch(page, diploOptions(4, { truce: 0 }));
            await sim(page, 120);
            const r = await page.evaluate(() => {
                const g = window.game, c = g.chron, D = g.diplo, [a, b] = g.nations;
                D.declareWar(a, b);
                g.worldEvents.fire('harvest', a);
                a.completeResearch('age2');
                const kinds = c.ev.map(e => e[1]);
                // przerzedzanie: sztucznie dużo próbek
                const n0 = c.s.length;
                for (let i = 0; i < 400; i++) Chronicle.sample(g, c);
                return { n0, dt: c.dt, len: c.s.length, row: c.s[0][1].length, kinds, cols: c.s[0][1][0].length };
            });
            assert.ok(r.n0 >= 12 && r.n0 <= 14, 'próbek po 2 min: ' + r.n0);
            assert.equal(r.row, 4); assert.equal(r.cols, 6);
            for (const k of ['war', 'event', 'age']) assert.ok(r.kinds.includes(k), 'brak wpisu: ' + k + ' w ' + r.kinds);
            assert.ok(r.len <= 361 && r.dt === 20, `po przerzedzeniu: ${r.len} próbek, odstęp ${r.dt}`);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Ekran wyników: wyróżnienia, zakładki Przebieg i Kronika, wykres SVG',
        async run() {
            const page = await openGame();
            await startMatch(page, classicOptions({ autoplay: 'medium' }));
            await sim(page, 240);
            await page.evaluate(() => window.game.endGame(1, false));
            await page.waitForSelector('#end-screen .chr-tabs');
            const aw = await page.$$eval('.chr-award', els => els.length);
            assert.ok(aw >= 2, 'wyróżnień: ' + aw);
            assert.ok(await page.$('#end-stats table'), 'brak tabeli wyników');
            await page.click('[data-chrt="chart"]');
            const paths = await page.$$eval('.chr-svg path.chr-line', els => els.map(e => e.getAttribute('d').length));
            assert.equal(paths.length, 2);
            assert.ok(paths.every(l => l > 40), 'puste linie wykresu');
            await page.click('[data-chrm="army"]');
            assert.ok(await page.$('[data-chrm="army"].on'));
            await page.click('[data-chrt="log"]');
            const log = await page.$$eval('.chr-log li', els => els.length);
            assert.ok(log >= 1, 'pusta oś zdarzeń');
            await page.click('[data-chrmine="1"]');
            assert.ok(await page.$('[data-chrmine="1"].on'));
            assertNoErrors(page);
            await closeGame(page);
        }
    }
];
