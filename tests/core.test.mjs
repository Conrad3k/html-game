// Silnik: start obu trybów, symulacja SI kontra SI, determinizm z ziarnem
import assert from 'node:assert/strict';
import { openGame, closeGame, startMatch, sim, digest, diploOptions, classicOptions, assertNoErrors } from './harness.mjs';

// Nikt nie powinien mieć NaN w pozycji ani w zapasach
async function sane(page) {
    const bad = await page.evaluate(() => {
        const g = window.game, out = [];
        for (const n of g.nations) {
            for (const k of ['food', 'wood', 'gold', 'stone']) { const v = n.resources.get(k); if (!Number.isFinite(v) || v < -1e-6) out.push(n.name + ' ' + k + '=' + v); }
            for (const u of n.units) if (!Number.isFinite(u.x) || !Number.isFinite(u.y) || !Number.isFinite(u.hp)) out.push(n.name + ' ' + u.unitType + ' NaN');
        }
        return out.slice(0, 5);
    });
    assert.deepEqual(bad, [], 'stan gry: ' + bad.join(', '));
}

export default [
    {
        name: 'Klasyczny mecz: 6 minut SI kontra SI bez błędów',
        async run({ quick }) {
            const page = await openGame();
            // autoplay: nacją gracza też steruje SI (mecz pokazowy)
            await startMatch(page, classicOptions({ autoplay: 'medium', nations: [{ isPlayer: true, color: 'blue', team: 1 }, { isPlayer: false, color: 'red', team: 2, diff: 'hard' }, { isPlayer: false, color: 'green', team: 3, diff: 'medium' }] }));
            await sim(page, quick ? 120 : 360);
            await sane(page);
            const s = await page.evaluate(() => window.game.nations.map(n => ({ u: n.units.length, b: n.buildings.length, age: n.age })));
            for (const n of s.slice(1)) assert.ok(n.u > 5 && n.b > 2, 'SI się nie rozwija: ' + JSON.stringify(s));
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Dyplomacja: kampania 6 nacji, 12 minut',
        slow: true,
        async run() {
            const page = await openGame();
            await startMatch(page, diploOptions(6, { truce: 120 }));
            await sim(page, 720);
            await sane(page);
            const d = await page.evaluate(() => {
                const D = window.game.diplo, N = D.N; let sym = true;
                for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (D.state[i * N + j] !== D.state[j * N + i]) sym = false;
                return { sym, hist: D.history.length, ages: window.game.nations.map(n => n.age) };
            });
            assert.ok(d.sym, 'relacje nie są symetryczne');
            assert.ok(d.hist > 0, 'kronika Dyplomacji jest pusta po 12 minutach');
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Determinizm: ten sam mecz z tym samym ziarnem daje ten sam stan',
        async run({ quick }) {
            const run = async () => {
                const page = await openGame();
                await startMatch(page, diploOptions(quick ? 3 : 6, { truce: 60, autoplay: 'medium' }), { seed: 99 });
                await sim(page, quick ? 90 : 300);
                const d = await digest(page);
                assertNoErrors(page);
                await closeGame(page);
                return d;
            };
            const a = await run(), b = await run();
            assert.equal(a, b, 'różne stany gry przy tym samym ziarnie');
        }
    }
];
