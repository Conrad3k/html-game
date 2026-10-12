// V2.0: Wydarzenia świata (game/WorldEvents.js) - każde wydarzenie, decyzje gracza, SI, rozkazy, interfejs
import assert from 'node:assert/strict';
import { openGame, closeGame, startMatch, sim, diploOptions, classicOptions, assertNoErrors } from './harness.mjs';

// Strona z Dyplomacją 3 nacji (gracz = nacja 0)
async function diploPage(extra) {
    const page = await openGame();
    await startMatch(page, diploOptions(3, { truce: 600, ...extra }));
    return page;
}

export default [
    {
        name: 'Wydarzenia: włączone domyślnie, wyłączane opcją, bez nich w samouczku',
        async run() {
            const page = await openGame();
            await startMatch(page, classicOptions());
            assert.ok(await page.evaluate(() => !!window.game.worldEvents), 'brak Wydarzeń w Klasycznym meczu');
            await closeGame(page);
            const p2 = await openGame();
            await startMatch(p2, classicOptions({ events: false }));
            assert.ok(await p2.evaluate(() => !window.game.worldEvents), 'Wydarzenia mimo wyłączonej opcji');
            // kafelek w menu
            assert.ok(await p2.evaluate(() => !!document.getElementById('opt-events')), 'brak przełącznika w menu');
            assertNoErrors(p2);
            await closeGame(p2);
        }
    },
    {
        name: 'Wydarzenia bez wyboru: premie, osadnicy, pożar i koniec działania',
        async run() {
            const page = await diploPage();
            const r = await page.evaluate(() => {
                const g = window.game, W = g.worldEvents, me = g.playerNation, out = {};
                W.fire('harvest', me);
                out.harvest = me.evGather && me.evGather.food;
                W.fire('vein', me);
                out.vein = me.evGather.gold;
                const w0 = me.units.filter(u => u.unitType === 'worker').length;
                W.fire('settlers', me);
                out.settlers = me.units.filter(u => u.unitType === 'worker').length - w0;
                me.resources.add('wood', 1000);
                const wood = me.resources.get('wood');
                W.fire('fire', me);
                out.fire = wood - me.resources.get('wood');
                out.log = W.log.length;
                return out;
            });
            assert.equal(r.harvest, 1.35);
            assert.equal(r.vein, 1.4);
            assert.equal(r.settlers, 3, 'osadnicy: ' + r.settlers);
            assert.ok(r.fire > 0 && r.fire <= 200, 'pożar zabrał ' + r.fire);
            assert.equal(r.log, 4);
            // premie mijają (Urodzaj 180 s)
            await sim(page, 185);
            const after = await page.evaluate(() => { const me = window.game.playerNation; return me.evGather ? me.evGather.food : 1; });
            assert.equal(after, 1, 'Urodzaj nie minął');
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Premia Urodzaju naprawdę przyspiesza zbieranie żywności',
        async run() {
            // dwa razy ten sam mecz z tym samym ziarnem: bez wydarzenia i z Urodzajem dla wszystkich nacji
            const gathered = async (boost) => {
                const page = await openGame();
                await startMatch(page, diploOptions(3, { truce: 600, autoplay: 'medium' }), { seed: 5 });
                await page.evaluate((boost) => {
                    const W = window.game.worldEvents;
                    W.nextAt.fill(1e9); W.worldAt = 1e9;   // tylko to, co wywoła test
                    if (boost) for (const n of window.game.nations) W.active.push({ k: 'harvest', n: W.idx(n), until: 1e9, g: { food: 0.35 } });
                    W.recompute();
                }, boost);
                await sim(page, 150);
                const f = await page.evaluate(() => window.game.nations.reduce((s, n) => s + n.stats.gathered.food, 0));
                await closeGame(page);
                return f;
            };
            const a = await gathered(false), b = await gathered(true);
            assert.ok(b > a * 1.15, `żywność bez premii ${Math.round(a)}, z Urodzajem ${Math.round(b)}`);
        }
    },
    {
        name: 'Decyzje gracza: susza, zaraza, najemnicy, uczony, turniej (przez rozkazy)',
        async run() {
            const page = await diploPage();
            const r = await page.evaluate(() => {
                const g = window.game, W = g.worldEvents, me = g.playerNation, out = {};
                W.nextAt.fill(1e9); W.worldAt = 1e9;
                const step = () => g.simStep(Game.STEP);
                const pend = (k) => W.pending.find(p => p.k === k);
                me.resources.add('food', 5000); me.resources.add('gold', 5000); me.resources.add('wood', 5000);
                // susza - otwarte spichlerze: płacisz, bez kary
                W.fire('drought', me);
                let p = pend('drought'); const food0 = me.resources.get('food');
                g.issue({ t: 'event', id: p.id, c: 0 }); step();
                out.droughtPaid = Math.round(food0 - me.resources.get('food'));
                out.droughtActive = W.active.some(a => a.k === 'drought');
                // susza - przeczekaj: kara
                W.fire('drought', me); p = pend('drought');
                g.issue({ t: 'event', id: p.id, c: 1 }); step();
                out.droughtMul = me.evGather && me.evGather.food;
                // najemnicy (II era)
                me.age = 2;
                W.fire('mercs', me); p = pend('mercs');
                const u0 = me.units.length, gold0 = me.resources.get('gold');
                g.issue({ t: 'event', id: p.id, c: 0 }); step();
                out.mercs = me.units.length - u0; out.mercCost = Math.round(gold0 - me.resources.get('gold'));
                out.mercTypes = me.units.slice(u0).map(u => u.unitType).sort().join(',');
                // uczony
                W.fire('scholar', me); p = pend('scholar');
                out.scholarUp = p.up;
                g.issue({ t: 'event', id: p.id, c: 0 }); step();
                out.scholarDone = me.researchedUpgrades.includes(out.scholarUp);
                // turniej: 6 żołnierzy
                const tc = me.buildings.find(b => b.type === 'town_center');
                for (let i = 0; i < 2; i++) tc.spawnTrainedUnit({ type: 'spearman' });
                W.fire('tournament', me); p = pend('tournament');
                out.tournamentOffered = !!p;
                if (p) { g.issue({ t: 'event', id: p.id, c: 0 }); step(); }
                out.ranks = me.units.filter(u => u.cfg.military).map(u => u.rank);
                // zaraza - brak decyzji: po 45 s kwarantanna
                W.fire('plague', me); p = pend('plague');
                out.plaguePending = !!p;
                return out;
            });
            assert.equal(r.droughtPaid, 180, 'koszt spichlerzy w I erze: 100 + 80 × 1');
            assert.equal(r.droughtActive, false);
            assert.equal(r.droughtMul, 0.7);
            assert.equal(r.mercs, 6, 'najemników: ' + r.mercs);
            assert.equal(r.mercCost, 400);
            assert.equal(r.mercTypes, 'lisowczyk,lisowczyk,lisowczyk,lisowczyk,swordsman,swordsman');
            assert.ok(r.scholarUp && r.scholarDone, 'uczony: ' + r.scholarUp);
            assert.ok(r.tournamentOffered, 'turniej nie zaproponowany');
            assert.ok(r.ranks.length >= 6 && r.ranks.every(x => x >= 1), 'gwiazdki: ' + r.ranks.join(','));
            assert.ok(r.plaguePending);
            await sim(page, 47);
            const pl = await page.evaluate(() => { const W = window.game.worldEvents; return { left: W.pending.length, act: W.active.some(a => a.k === 'plague') }; });
            assert.equal(pl.left, 0, 'decyzja nie wygasła');
            assert.ok(pl.act, 'po czasie powinna być kwarantanna');
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Rozkazy wydarzeń są sprawdzane (zły numer, cudza decyzja, brak środków)',
        async run() {
            const page = await diploPage();
            const r = await page.evaluate(() => {
                const g = window.game, W = g.worldEvents, me = g.playerNation, other = g.nations[1];
                W.nextAt.fill(1e9); W.worldAt = 1e9;
                const out = {};
                out.bad = W.command(me, { id: 'x', c: 0 });
                out.missing = W.command(me, { id: 999, c: 0 });
                // decyzja należąca do innej nacji (np. drugiego gracza)
                other.ai = null; other.human = true;
                W.fire('drought', other);
                const p = W.pending.find(q => q.n === 1);
                out.foreign = W.command(me, { id: p.id, c: 0 });
                // brak środków na pierwszy przycisk
                me.resources.resources.food = 0;
                W.fire('drought', me);
                const q = W.pending.find(x => x.n === 0);
                out.poor = W.command(me, { id: q.id, c: 0 });
                out.still = W.pending.includes(q);
                return out;
            });
            assert.equal(r.bad, null);
            assert.match(r.missing, /minęło/);
            assert.match(r.foreign, /minęło/);
            assert.match(r.poor, /Nie stać/);
            assert.equal(r.still, true);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Wydarzenia kontynentu: wędrowni kupcy (handel ×2) i zjazd władców',
        async run() {
            const page = await diploPage();
            const r = await page.evaluate(() => {
                const g = window.game, D = g.diplo, W = g.worldEvents, [a, b, c] = g.nations;
                W.nextAt.fill(1e9); W.worldAt = 1e9;
                D.makeTrade(a, b);
                const r0 = D.tradeRate(a, b);
                W.fire('traders', null);
                const r1 = D.tradeRate(a, b);
                D.refreshOpinion(); const o0 = D.op(b, a);
                W.fire('council', null);
                D.refreshOpinion(); const o1 = D.op(b, a);
                return { ratio: r1 / r0, dOp: o1 - o0 };
            });
            assert.equal(Math.round(r.ratio * 100) / 100, 2);
            assert.ok(r.dOp >= 7, 'zjazd władców: zmiana opinii ' + r.dOp);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Karta decyzji w interfejsie: widać ją, klik rozstrzyga, pasek pokazuje trwające wydarzenie',
        async run() {
            const page = await diploPage();
            await page.evaluate(() => {
                const g = window.game, W = g.worldEvents;
                W.nextAt.fill(1e9); W.worldAt = 1e9;
                g.playerNation.resources.add('food', 2000);
                W.fire('drought', g.playerNation);
                W.fire('harvest', g.nations[0]);
                window.uiManager.refresh();
            });
            const card = await page.$('#ev-inbox .ev-card');
            assert.ok(card, 'brak karty');
            assert.match(await card.innerText(), /Susza/);
            assert.match(await page.innerText('#ev-strip'), /Urodzaj/);
            await page.click('#ev-inbox [data-evc="0"]');
            await page.evaluate(() => { window.game.simStep(Game.STEP); window.uiManager.refresh(); });
            const left = await page.evaluate(() => ({ n: window.game.worldEvents.pending.length, vis: document.getElementById('ev-inbox').style.display }));
            assert.equal(left.n, 0);
            assert.equal(left.vis, 'none');
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Karty z odliczaniem (propozycja Dyplomacji, decyzja Wydarzenia) nie migają - sekundy zmieniają się na miejscu',
        async run() {
            const page = await diploPage();
            const r = await page.evaluate(() => {
                const g = window.game, W = g.worldEvents, D = g.diplo, me = g.playerNation, ui = window.uiManager;
                W.nextAt.fill(1e9); W.worldAt = 1e9;
                const step = (s) => { for (let i = 0; i < Math.round(s / Game.STEP); i++) g.simStep(Game.STEP); ui.refresh(); };
                D.proposals.push({ id: ++D._pid, from: g.nations[1], to: me, kind: 'trade', target: null, at: g.time, until: g.time + DIPLO.PROPOSAL_TTL, pay: null, def: 0 });
                W.fire('drought', me);
                ui.refresh();
                const q = (s) => document.querySelector(s);
                const card = q('#dp-inbox .dp-prop'), ev = q('#ev-inbox .ev-card');
                const t0 = [card && card.querySelector('.lv-left').textContent, ev && ev.querySelector('.lv-left').textContent];
                step(3.2);
                // V2.0: co sekundę nowy element karty (animacja wejścia od początku - miganie)
                const same = [q('#dp-inbox .dp-prop') === card, q('#ev-inbox .ev-card') === ev];
                const t1 = [card.querySelector('.lv-left').textContent, ev.querySelector('.lv-left').textContent];
                const bar = card.querySelector('.lv-bar').style.width;
                // druga propozycja dochodzi pod pierwszą - pierwsza karta zostaje tym samym elementem
                D.proposals.push({ id: ++D._pid, from: g.nations[2], to: me, kind: 'nap', target: null, at: g.time, until: g.time + DIPLO.PROPOSAL_TTL, pay: null, def: 0 });
                step(1.1);
                const two = [...document.querySelectorAll('#dp-inbox .dp-prop')];
                // panel Dyplomacji: te same karty, też bez podmieniania
                ui.showNations(true);
                ui.refresh();
                const pc = q('.dpx-props .dp-prop');
                step(1.1);
                return { t0, t1, same, bar, two: two.length, firstSame: two[0] === card, panel: !!pc, panelSame: !!pc && q('.dpx-props .dp-prop') === pc };
            });
            assert.ok(r.t0[0] && r.t0[1], 'brak kart: ' + JSON.stringify(r));
            assert.deepEqual(r.same, [true, true], 'karta powstała od nowa: ' + JSON.stringify(r));
            assert.ok(Number(r.t1[0]) <= Number(r.t0[0]) - 3 && Number(r.t1[1]) <= Number(r.t0[1]) - 3, 'odliczanie: ' + JSON.stringify(r));
            assert.ok(parseFloat(r.bar) < 100, 'pasek czasu: ' + r.bar);
            assert.equal(r.two, 2);
            assert.ok(r.firstSame, 'nowa propozycja podmieniła starą kartę');
            assert.ok(r.panelSame, 'karta w panelu Dyplomacji powstała od nowa');
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Kampania 15 minut: wydarzenia trafiają do wszystkich nacji, SI decyduje sama',
        slow: true,
        async run() {
            const page = await openGame();
            await startMatch(page, diploOptions(6, { truce: 300 }));
            await sim(page, 900);
            const r = await page.evaluate(() => {
                const W = window.game.worldEvents, per = window.game.nations.map(() => 0), kinds = {};
                for (const l of W.log) { if (l.n >= 0) per[l.n]++; kinds[l.k] = (kinds[l.k] || 0) + 1; }
                return { per, kinds, pend: W.pending.length, choices: W.log.filter(l => l.c >= 0 && l.n > 0).length };
            });
            assert.ok(r.per.slice(1).every(x => x >= 1), 'nacje SI bez wydarzeń: ' + r.per);
            assert.ok(Object.keys(r.kinds).length >= 5, 'mało rodzajów: ' + JSON.stringify(r.kinds));
            assert.ok(r.choices >= 1, 'SI nie podjęła żadnej decyzji');
            assertNoErrors(page);
            await closeGame(page);
        }
    }
];
