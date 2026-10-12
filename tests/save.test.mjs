// Zapis i wczytanie gry: ten sam stan po wczytaniu, Wydarzenia i Kronika w zapisie, zapisy z poprzedniego wydania
import assert from 'node:assert/strict';
import { getBrowser, openGame, closeGame, startMatch, sim, digest, diploOptions, assertNoErrors, previousFile } from './harness.mjs';

// Wczytanie zapisu id na świeżej stronie (pętla obrazu wyłączona jak w startMatch)
async function loadOn(page, id) {
    await page.evaluate((id) => {
        const orig = Game.prototype.start;
        Game.prototype.start = function () { this.loop = () => {}; return orig.call(this); };
        SaveUI.load(id);
    }, id);
    await page.waitForFunction(() => window.abReady && window.game && window.game.started, null, { timeout: 180000 });
}

export default [
    {
        name: 'Zapis i wczytanie: ten sam stan, Wydarzenia i Kronika przetrwały',
        async run() {
            const ctx = await (await getBrowser()).newContext({ viewport: { width: 1280, height: 800 } });
            const a = await openGame(undefined, { context: ctx });
            await startMatch(a, diploOptions(4, { truce: 300 }));
            await sim(a, 200);
            const before = await a.evaluate(async () => {
                const g = window.game, W = g.worldEvents;
                W.fire('vein', g.playerNation);
                W.fire('drought', g.playerNation);
                const ok = await SaveUI.saveNow('Test', 'manual', 'test1');
                return { ok, act: W.active.length, pend: W.pending.length, chron: g.chron.s.length, ev: g.chron.ev.length, gold: g.playerNation.evGather.gold };
            });
            assert.ok(before.ok, 'zapis się nie udał');
            const d1 = await digest(a);
            await a.close();
            const b = await openGame(undefined, { context: ctx });
            await loadOn(b, 'test1');
            const d2 = await digest(b);
            assert.equal(d2, d1, 'stan po wczytaniu jest inny');
            const after = await b.evaluate(() => {
                const g = window.game, W = g.worldEvents;
                return { act: W.active.length, pend: W.pending.length, chron: g.chron.s.length, ev: g.chron.ev.length, gold: g.playerNation.evGather && g.playerNation.evGather.gold, cls: W instanceof WorldEvents };
            });
            const { ok, ...want } = before;
            assert.deepEqual(after, { ...want, cls: true });
            await sim(b, 60);   // gra toczy się dalej
            await b.evaluate(() => window.uiManager.refresh());
            assertNoErrors(b);
            await b.close(); await ctx.close();
        }
    },
    {
        name: 'Zapis z poprzedniego wydania wczytuje się w nowym',
        async run() {
            const prev = previousFile();
            if (!prev) return;   // nie ma poprzedniego wydania w repozytorium
            const ctx = await (await getBrowser()).newContext({ viewport: { width: 1280, height: 800 } });
            const a = await openGame(prev, { context: ctx });
            await startMatch(a, diploOptions(4, { truce: 120 }));
            await sim(a, 240);
            assert.ok(await a.evaluate(() => SaveUI.saveNow('Stary', 'manual', 'old1')), 'zapis w poprzednim wydaniu');
            const d1 = await digest(a);
            await a.close();
            const b = await openGame(undefined, { context: ctx });
            await loadOn(b, 'old1');
            assert.equal(await digest(b), d1, 'stan zapisu z poprzedniego wydania po wczytaniu jest inny');
            await sim(b, 120);
            const r = await b.evaluate(() => ({ chron: window.game.chron ? window.game.chron.s.length : 0, t: window.game.time }));
            assert.ok(r.chron >= 10, 'Kronika nie ruszyła po wczytaniu starego zapisu');
            await b.evaluate(() => { window.game.endGame(1, false); });
            await b.waitForSelector('#end-screen .chr-tabs');
            assertNoErrors(b);
            await b.close(); await ctx.close();
        }
    }
];
