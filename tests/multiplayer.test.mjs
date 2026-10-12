// Gra wieloosobowa przez loopback (BroadcastChannel między kartami): host + gość w jednej przeglądarce.
// Sprawdza połączenie, start Dyplomacji, Wydarzenia świata u gościa (karta, decyzja wraca do hosta) i Kronikę po meczu.
import assert from 'node:assert/strict';
import { getBrowser, openGame, assertNoErrors } from './harness.mjs';

export default [
    {
        name: 'Gra wieloosobowa (loopback): start, decyzja gościa w Wydarzeniu, Kronika po meczu',
        async run() {
            const ctx = await (await getBrowser()).newContext({ viewport: { width: 1280, height: 800 } });
            const host = await openGame(undefined, { context: ctx, seed: false });
            const guest = await openGame(undefined, { context: ctx, seed: false });
            await host.evaluate(async () => {
                const mp = window.ArtificialBattles.mp;
                await mp.action('host', {});
                const s = mp.session;
                s.openLoopback(window.MpUI.loopRoom);
                s.setSettings({ mode: 'diplomacy', truce: 600, events: true, limit: 0 });
                s.setSlotKind(1, 'human');
                for (let i = 2; i < s.slots.length; i++) if (s.slots[i].kind !== 'closed') s.setSlotKind(i, i < 3 ? 'ai' : 'closed');
            });
            await guest.evaluate(async () => { await window.ArtificialBattles.mp.action('loopjoin', {}); });
            await host.waitForFunction(() => { const s = window.ArtificialBattles.mp.session; return s.slots[1].peer && !s.startBlocker(); }, null, { timeout: 30000 });
            await host.evaluate(async () => { await window.ArtificialBattles.mp.action('start', {}); });
            await host.waitForFunction(() => window.game && window.game.started, null, { timeout: 180000 });
            await guest.waitForFunction(() => window.game && window.game.started && window.game.isClient, null, { timeout: 180000 });
            const info = await guest.evaluate(() => ({ ev: !!window.game.worldEvents, diplo: !!window.game.diplo, me: window.game.nations.indexOf(window.game.playerNation) }));
            assert.ok(info.ev && info.diplo, 'u gościa brak Wydarzeń albo Dyplomacji');
            // susza dla gościa (nacja 1) - karta u gościa, decyzja wraca do hosta
            await host.evaluate((i) => {
                const g = window.game, W = g.worldEvents, n = g.nations[i];
                W.nextAt.fill(1e9); W.worldAt = 1e9;
                n.resources.add('food', 1000);
                W.fire('drought', n);
            }, info.me);
            await guest.waitForSelector('#ev-inbox .ev-card', { timeout: 20000 });
            await guest.click('#ev-inbox [data-evc="0"]');
            await host.waitForFunction(() => window.game.worldEvents.pending.length === 0, null, { timeout: 20000 });
            const res = await host.evaluate((i) => window.game.worldEvents.log.slice(-1)[0], info.me);
            assert.equal(res.k, 'drought'); assert.equal(res.c, 0, 'decyzja gościa nie dotarła');
            // Urodzaj u gościa widać w pasku
            await host.evaluate((i) => window.game.worldEvents.fire('harvest', window.game.nations[i]), info.me);
            await guest.waitForFunction(() => /Urodzaj/.test(document.getElementById('ev-strip') ? document.getElementById('ev-strip').innerText : ''), null, { timeout: 20000 });
            // koniec meczu: gość dostaje Kronikę
            await host.waitForTimeout(2500);
            await host.evaluate(() => window.game.endGame(1, false));
            await guest.waitForSelector('#end-screen .chr-tabs', { timeout: 20000 });
            const chron = await guest.evaluate(() => ({ s: window.game.chron ? window.game.chron.s.length : 0, ev: window.game.chron ? window.game.chron.ev.length : 0 }));
            assert.ok(chron.s >= 1 && chron.ev >= 2, 'Kronika u gościa: ' + JSON.stringify(chron));
            assertNoErrors(host, 'host'); assertNoErrors(guest, 'gość');
            await ctx.close();
        }
    }
];
