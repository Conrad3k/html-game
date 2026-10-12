// Mechaniki gry: handel (umowy, wozy kupieckie, bramy), surowce, farmy, szkolenie, budowa, ery, ulepszenia, walka,
// Cuda Świata, marsze przez kontynent i generowanie map. Każdy test buduje własny, kontrolowany scenariusz
// (SI wyłączona - H.noAI), żeby sprawdzać samą mechanikę, a nie decyzje SI.
import assert from 'node:assert/strict';
import { openGame, closeGame, startMatch, sim, diploOptions, classicOptions, assertNoErrors } from './harness.mjs';
import { installHelpers } from './scenarios.mjs';

async function scene(opts, seed = 31) {
    const page = await openGame();
    await startMatch(page, opts, { seed });
    await installHelpers(page);
    return page;
}
const carts = (page) => page.evaluate(() => { const H = window.__ab, [A, B] = window.game.nations; return { a: H.cartState(A), b: H.cartState(B), ga: Math.round(A.stats.traded || 0), gb: Math.round(B.stats.traded || 0) }; });

export default [
    // ---------------- Handel ----------------
    {
        name: 'Handel: umowa handlowa daje złoto co sekundę obu stronom (z dochodem w górnym pasku)',
        async run() {
            const page = await scene(diploOptions(3, { truce: 3000, events: false }));
            const r = await page.evaluate(() => {
                const G = window.game, H = window.__ab, D = G.diplo, [A, B] = G.nations;
                H.noAI();
                D.makeTrade(A, B);
                window.__g0 = [A.resources.get('gold'), B.resources.get('gold')];
                return { rate: D.tradeRate(A, B) * 60, inc: D.tradeIncome(A) * 60 };
            });
            await sim(page, 60);
            const g = await page.evaluate(() => { const [A, B] = window.game.nations; window.uiManager.refresh(); return [A.resources.get('gold') - window.__g0[0], B.resources.get('gold') - window.__g0[1], document.getElementById('res-trade').textContent]; });
            assert.ok(r.rate >= 5 && r.rate <= 17, 'stawka umowy: ' + r.rate);
            assert.ok(Math.abs(g[0] - r.rate) < 1.5 && Math.abs(g[1] - r.rate) < 1.5, `złoto po minucie: ${g.map(Math.round)} (stawka ${r.rate.toFixed(1)})`);
            assert.match(g[2], /^\+\d+\/min$/);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Wozy kupieckie partnera handlowego przejeżdżają przez bramę osady w murach (w obie strony, 6 minut)',
        async run() {
            const page = await scene(diploOptions(3, { truce: 3000, events: false }));
            await page.evaluate(() => {
                const G = window.game, H = window.__ab, D = G.diplo, [A, B] = G.nations;
                H.noAI(); A.age = B.age = 2;
                const ta = H.tc(A), tb = H.tc(B);
                const mA = H.put(A, 'market', ta.x + 160, ta.y), mB = H.put(B, 'market', tb.x + 150, tb.y + 60);
                H.wallRing(B, tb.x, tb.y, 380, ta.x, ta.y);
                D.makeTrade(A, B);
                for (const u of H.carts(A, 4, mA)) G.setTradeRoute(u, mB);
                H.carts(B, 4, mB);
            });
            await sim(page, 360);
            const c = await carts(page);
            assert.equal(c.a.idleLost + c.b.idleLost, 0, 'wozy straciły szlak: ' + JSON.stringify(c));
            assert.equal(c.a.trading, 4); assert.equal(c.b.trading, 4);
            assert.ok(c.ga > 500 && c.gb > 500, 'za mało kursów: ' + JSON.stringify(c));
            assert.ok(Math.abs(c.ga - c.gb) < c.ga * 0.35, 'kursy w jedną stronę idą gorzej: ' + JSON.stringify(c));
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Wozy: zerwana umowa - czekają; odnowiona - same wracają na szlak',
        async run() {
            const page = await scene(diploOptions(3, { truce: 3000, events: false }));
            await page.evaluate(() => {
                const G = window.game, H = window.__ab, D = G.diplo, [A, B] = G.nations;
                H.noAI(); A.age = B.age = 2;
                const ta = H.tc(A), tb = H.tc(B);
                const mA = H.put(A, 'market', ta.x + 160, ta.y), mB = H.put(B, 'market', tb.x + 150, tb.y + 60);
                D.makeTrade(A, B);
                for (const u of H.carts(A, 3, mA)) G.setTradeRoute(u, mB);
            });
            await sim(page, 150);
            await page.evaluate(() => { const [A, B] = window.game.nations; window.game.diplo.endTrade(A, B); });
            await sim(page, 40);
            const mid = await carts(page);
            assert.equal(mid.a.trading, 0, 'wozy jeżdżą mimo zerwanej umowy');
            await page.evaluate(() => { const [A, B] = window.game.nations; window.game.diplo.makeTrade(A, B); });
            await sim(page, 5);
            const after = await carts(page);
            assert.equal(after.a.trading, 3, 'wozy nie wróciły na szlak: ' + JSON.stringify(after));
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Wozy: tłok 24 wozów sojuszników w jednej bramie bez utraty szlaku',
        slow: true,
        async run() {
            const page = await scene(diploOptions(3, { truce: 3000, events: false }), 32);
            await page.evaluate(() => {
                const G = window.game, H = window.__ab, D = G.diplo, [A, B] = G.nations;
                H.noAI(); A.age = B.age = 2; A.popCap = B.popCap = 200;
                const ta = H.tc(A), tb = H.tc(B);
                const mA = H.put(A, 'market', ta.x + 160, ta.y), mB = H.put(B, 'market', tb.x + 150, tb.y + 60);
                H.wallRing(B, tb.x, tb.y, 380, ta.x, ta.y);
                D.makeAlliance(A, B);
                for (const u of H.carts(A, 12, mA)) G.setTradeRoute(u, mB);
                H.carts(B, 12, mB);
            });
            await sim(page, 300);
            const c = await carts(page);
            assert.equal(c.a.idleLost + c.b.idleLost, 0, JSON.stringify(c));
            assert.ok(c.ga > 1500 && c.gb > 1500, JSON.stringify(c));
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Wozy: Klasyczny mecz, targ za własnym murem z bramą',
        async run() {
            const page = await scene(classicOptions({ events: false }), 34);
            await page.evaluate(() => {
                const G = window.game, H = window.__ab, [A] = G.nations;
                H.noAI(); A.age = 2; A.popCap = 200;
                const ta = H.tc(A);
                const m1 = H.put(A, 'market', ta.x + 150, ta.y + 60);
                H.wallRing(A, ta.x, ta.y, 330, G.mapWidth / 2, G.mapHeight / 2);
                const m2 = H.put(A, 'market', G.mapWidth / 2, G.mapHeight / 2);
                for (const u of H.carts(A, 8, m1)) G.setTradeRoute(u, m2);
            });
            await sim(page, 180);
            const c = await carts(page);
            assert.equal(c.a.trading, 8, JSON.stringify(c));
            assert.ok(c.ga > 1500, JSON.stringify(c));
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Wozy: wóz uwięziony w cudzej osadzie po zerwaniu umowy przepada po 20 s',
        async run() {
            const page = await scene(diploOptions(3, { truce: 3000, events: false }), 33);
            await page.evaluate(() => {
                const G = window.game, H = window.__ab, D = G.diplo, [A, B] = G.nations;
                H.noAI(); A.age = B.age = 2;
                const ta = H.tc(A), tb = H.tc(B);
                H.put(A, 'market', ta.x + 160, ta.y); H.put(B, 'market', tb.x + 150, tb.y + 60);
                H.wallRing(B, tb.x, tb.y, 380, ta.x, ta.y);
                D.makeTrade(A, B);
                const u = new Unit(tb.x + 100, tb.y - 100, A.color, A, 'trade_cart'); A.units.push(u); G.addEntity(u);
                window.__inside = u;
            });
            await sim(page, 5);
            assert.equal(await page.evaluate(() => window.__inside.isDestroyed), false);
            await page.evaluate(() => { const [A, B] = window.game.nations; window.game.diplo.endTrade(A, B); });
            await sim(page, 25);
            assert.equal(await page.evaluate(() => window.__inside.isDestroyed), true, 'uwięziony wóz nie przepadł');
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    // ---------------- Surowce i gospodarka ----------------
    {
        name: 'Surowce: robotnicy zbierają drewno, złoto i kamień i oddają je w Ratuszu',
        async run() {
            const page = await scene(classicOptions({ events: false }));
            await page.evaluate(() => {
                const G = window.game, H = window.__ab, [A] = G.nations;
                H.noAI(); A.popCap = 50;
                const tc = H.tc(A);
                for (let i = 0; i < 6; i++) tc.spawnTrainedUnit({ type: 'worker' });
                const ws = A.units.filter(u => u.unitType === 'worker');
                const near = (t) => G.resourceNodes.filter(n => n.type === t && !n.isDestroyed).sort((a, b) => Math.hypot(a.x - tc.x, a.y - tc.y) - Math.hypot(b.x - tc.x, b.y - tc.y))[0];
                ws.forEach((w, i) => w.gather(near(['wood', 'wood', 'wood', 'gold', 'gold', 'stone', 'stone', 'wood', 'gold'][i])));
                window.__r0 = ['wood', 'gold', 'stone'].map(k => A.resources.get(k));
            });
            await sim(page, 120);
            const d = await page.evaluate(() => { const A = window.game.nations[0]; return { d: ['wood', 'gold', 'stone'].map((k, i) => Math.round(A.resources.get(k) - window.__r0[i])), g: A.stats.gathered, wc: A.workerCounts }; });
            assert.ok(d.d[0] > 100 && d.d[1] > 40 && d.d[2] > 40, 'przyrost (drewno, złoto, kamień): ' + d.d);
            assert.ok(d.g.wood >= d.d[0], 'statystyka zebranych surowców');
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Farma: robotnik zbiera żywność z farmy, wyczerpana farma jest obsiewana za drewno',
        async run() {
            const page = await scene(classicOptions({ events: false }));
            await page.evaluate(() => {
                const G = window.game, H = window.__ab, [A] = G.nations;
                H.noAI();
                const tc = H.tc(A);
                const f = H.put(A, 'farm', tc.x + 240, tc.y - 40);
                f.amount = 30;   // prawie wyczerpana
                const w = A.units.find(u => u.unitType === 'worker');
                w.gather(f);
                A.resources.add('wood', 500);
                window.__f = f; window.__food0 = A.resources.get('food'); window.__wood0 = A.resources.get('wood');
            });
            await sim(page, 90);
            const r = await page.evaluate(() => { const A = window.game.nations[0], f = window.__f; return { food: Math.round(A.resources.get('food') - window.__food0), wood: Math.round(window.__wood0 - A.resources.get('wood')), alive: !f.isDestroyed, amount: Math.round(f.amount) }; });
            assert.ok(r.food >= 30, 'żywność z farmy: ' + r.food);
            assert.ok(r.alive && r.wood >= 50, 'obsiew farmy: ' + JSON.stringify(r));
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Szkolenie, budowa, era i ulepszenie: koszty, czas, populacja i efekty',
        async run() {
            const page = await scene(classicOptions({ events: false }));
            const r0 = await page.evaluate(() => {
                const G = window.game, H = window.__ab, [A] = G.nations;
                H.noAI();
                A.resources.add('food', 3000); A.resources.add('wood', 3000); A.resources.add('gold', 3000); A.resources.add('stone', 1000);
                const tc = H.tc(A);
                const bar = H.put(A, 'barracks', tc.x - 260, tc.y + 60);
                const food0 = A.resources.get('food');
                const okU = bar.queueUnit(G, 'spearman');
                const paid = food0 - A.resources.get('food');
                // dom budowany przez robotnika
                const spot = H.freeSpot(A, 'house', tc.x + 130, tc.y + 170);
                const house = spot && A.spawnBuilding(G, spot.x, spot.y, 'house', GameConfig.buildings.house.cost);
                for (const w of A.units.filter(u => u.unitType === 'worker')) w.build(house);
                const okA = tc.queueResearch(G, 'age2');
                window.__house = house; window.__cap0 = A.popCap;
                return { okU, paid, okA, house: !!house, cap0: A.popCap, cc0: A.units.find(u => u.unitType === 'worker').carryCapacity };
            });
            assert.ok(r0.okU && r0.paid === 50, 'szkolenie włócznika: ' + JSON.stringify(r0));
            assert.ok(r0.okA && r0.house);
            await sim(page, 40);
            const r1 = await page.evaluate(() => {
                const G = window.game, A = G.nations[0];
                const tc = window.__ab.tc(A);
                const okW = tc.queueResearch(G, 'wheelbarrow');
                return { spear: A.units.filter(u => u.unitType === 'spearman').length, built: window.__house.isConstructed, cap: A.popCap, age: A.age, okW };
            });
            assert.equal(r1.spear, 1, 'włócznik nie powstał');
            assert.ok(r1.built && r1.cap > r0.cap0, 'dom: ' + JSON.stringify(r1));
            assert.equal(r1.age, 2, 'brak II ery');
            assert.ok(r1.okW);
            await sim(page, 15);
            const cc = await page.evaluate(() => window.game.nations[0].units.find(u => u.unitType === 'worker').carryCapacity);
            assert.equal(cc, r0.cc0 + 5, 'Taczki: udźwig');
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    // ---------------- Walka i Cuda ----------------
    {
        name: 'Walka: oddziały w stanie wojny walczą same, zabici liczą się w statystykach, weterani dostają gwiazdki',
        async run() {
            const page = await scene(diploOptions(3, { truce: 0, events: false }));
            const r0 = await page.evaluate(() => {
                const G = window.game, H = window.__ab, D = G.diplo, [A, B] = G.nations;
                H.noAI(); A.age = B.age = 2; A.popCap = B.popCap = 200;
                D.declareWar(A, B);
                const tc = H.tc(A), x = tc.x + 400, y = tc.y;
                const mk = (n, type, k, dx) => { for (let i = 0; i < k; i++) { const u = new Unit(x + dx, y - 60 + i * 24, n.color, n, type); n.units.push(u); G.addEntity(u); } };
                mk(A, 'swordsman', 8, -40); mk(B, 'spearman', 8, 40);
                return D.atWar(A, B);
            });
            assert.ok(r0);
            await sim(page, 45);
            const r = await page.evaluate(() => { const [A, B] = window.game.nations; return { a: A.units.filter(u => u.unitType === 'swordsman').length, b: B.units.filter(u => u.unitType === 'spearman').length, ka: A.stats.kills, lb: B.stats.unitsLost, ranks: A.units.filter(u => u.rank > 0).length }; });
            assert.equal(r.b, 0, 'włócznicy powinni przegrać z miecznikami: ' + JSON.stringify(r));
            assert.ok(r.a >= 4, 'miecznicy: ' + r.a);
            assert.equal(r.ka, 8); assert.equal(r.lb, 8);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Cud Świata: ukończony daje Chwałę i premię, zburzony zabiera część Chwały',
        async run() {
            const page = await scene(classicOptions({ events: false }));
            await page.evaluate(() => {
                const G = window.game, H = window.__ab, [A] = G.nations;
                H.noAI(); A.age = 3;
                const tc = H.tc(A);
                const w = H.put(A, 'hanging_gardens', tc.x + 330, tc.y - 260);
                G.wonderStarted(w); w.onConstructed();
                window.__w = w;
            });
            await sim(page, 60);
            const r = await page.evaluate(() => { const G = window.game, A = G.nations[0]; return { glory: G.gloryOf(A.team), food: A.gatherMult.food }; });
            assert.ok(r.glory > 10, 'Chwała po minucie: ' + r.glory);
            assert.ok(r.food > 1.2, 'premia Wiszących Ogrodów do żywności: ' + r.food);
            const after = await page.evaluate(() => { const G = window.game, w = window.__w, g0 = G.gloryOf(w.owner.team); w.hp = 0; G.killEntity(w, null); return [g0, G.gloryOf(w.owner.team)]; });
            assert.ok(after[1] < after[0], 'utrata Cudu nie zabrała Chwały: ' + after);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Długi marsz: urwana (częściowa) trasa nie zatrzymuje jednostek w pół drogi',
        async run() {
            const page = await scene(diploOptions(4, { truce: 3000, events: false }));
            const r = await page.evaluate(() => {
                const G = window.game, H = window.__ab, pf = G.pathfinder, [A, B] = G.nations;
                H.noAI();
                // sztucznie mały limit wyszukiwania: każda trasa dłuższa niż kilkaset pól urywa się po drodze
                const orig = Pathfinder.prototype.findPath;
                pf.findPath = function (sx, sy, ex, ey, te, u) {
                    const p = orig.call(this, sx, sy, ex, ey, te, u, 900);
                    if (!p.length && p.isPartial) return orig.call(this, sx, sy, ex, ey, te, u);   // inny region: pełne wyszukiwanie
                    return p;
                };
                const ta = H.tc(A), tb = H.tc(B);
                const sol = [];
                for (let i = 0; i < 4; i++) { const n = A.units.length; ta.spawnTrainedUnit({ type: 'scout' }); if (A.units.length > n) sol.push(A.units[A.units.length - 1]); }
                for (const u of sol) u.moveTo(tb.x + 300, tb.y + 300);
                window.__sol = sol; window.__tgt = { x: tb.x + 300, y: tb.y + 300 };
                return Math.round(Math.hypot(tb.x - ta.x, tb.y - ta.y));
            });
            await sim(page, Math.ceil(r / 160 * 1.8) + 20);
            const d = await page.evaluate(() => window.__sol.map(u => Math.round(Math.hypot(u.x - window.__tgt.x, u.y - window.__tgt.y))));
            assert.ok(d.every(x => x < 300), `zwiadowcy utknęli po drodze (odległość ${r}): ` + d);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    // ---------------- Generowanie map ----------------
    {
        name: 'Mapy Klasyczne: każdy typ i rozmiar - bazy połączone, surowce przy każdej bazie, Ratusze na lądzie',
        slow: true,
        async run({ quick }) {
            const types = ['lake', 'lakes', 'plains', 'highlands'], sizes = quick ? [3000] : [2400, 3000, 3900, 5100];
            let k = 0;
            for (const mapType of types) for (const mapSize of sizes) {
                const page = await openGame();
                const nations = [{ isPlayer: true, color: 'blue', team: 1 }, { isPlayer: false, color: 'red', team: 2, diff: 'easy' }, { isPlayer: false, color: 'green', team: 3, diff: 'easy' }, { isPlayer: false, color: 'yellow', team: 4, diff: 'easy' }];
                await startMatch(page, classicOptions({ mapType, mapSize, nations, fixedLayout: false, events: false }), { seed: 100 + k++ });
                const r = await page.evaluate(() => {
                    const G = window.game, pf = G.pathfinder, out = { bad: [] };
                    const tcs = G.nations.map(n => n.buildings.find(b => b.type === 'town_center'));
                    const w = G.nations[0].units.find(u => u.unitType === 'worker');
                    for (let i = 0; i < tcs.length; i++) {
                        const t = tcs[i];
                        if (G.isWater(t.x, t.y) || G.isMountain(t.x, t.y)) out.bad.push('Ratusz ' + i + ' na wodzie/górach');
                        if (i > 0 && !pf.canReach(w, tcs[0].x + 60, tcs[0].y + 60, t, 3)) out.bad.push('brak drogi do bazy ' + i);
                        const cnt = { wood: 0, gold: 0, stone: 0 };
                        for (const n of G.resourceNodes) if (!n.isDestroyed && cnt[n.type] !== undefined && Math.hypot(n.x - t.x, n.y - t.y) < 450) cnt[n.type]++;
                        if (cnt.wood < 15 || cnt.gold < 4 || cnt.stone < 2) out.bad.push('mało surowców przy bazie ' + i + ': ' + JSON.stringify(cnt));
                    }
                    out.nodes = G.resourceNodes.length;
                    return out;
                });
                assert.deepEqual(r.bad, [], `${mapType} ${mapSize}: ` + r.bad.join('; '));
                assert.ok(r.nodes > 100, `${mapType} ${mapSize}: tylko ${r.nodes} złóż`);
                assertNoErrors(page, mapType + ' ' + mapSize);
                await closeGame(page);
            }
        }
    },
    {
        name: 'Kontynent Dyplomacji: 8 nacji, mało / średnio / dużo rzek - wszystkie stolice osiągalne lądem, brody i surowce',
        slow: true,
        async run({ quick }) {
            const variants = quick ? [['normal', 7]] : [['few', 7], ['normal', 8], ['many', 9], ['many', 10]];
            for (const [rivers, seed] of variants) {
                const page = await openGame();
                await startMatch(page, diploOptions(8, { rivers, seed: seed * 1000 + 17, events: false }), { seed });
                const r = await page.evaluate(() => {
                    const G = window.game, pf = G.pathfinder, out = { bad: [] };
                    const tcs = G.nations.map(n => n.buildings.find(b => b.type === 'town_center'));
                    const w = G.nations[0].units.find(u => u.unitType === 'worker');
                    for (let i = 0; i < tcs.length; i++) {
                        const t = tcs[i];
                        if (G.isWater(t.x, t.y) || G.isMountain(t.x, t.y)) out.bad.push('stolica ' + i + ' na wodzie/górach');
                        if (i > 0 && !pf.canReach(w, tcs[0].x + 60, tcs[0].y + 60, t, 3)) out.bad.push('brak drogi do stolicy ' + i);
                        let wood = 0, gold = 0;
                        for (const n of G.resourceNodes) if (!n.isDestroyed && Math.hypot(n.x - t.x, n.y - t.y) < 450) { if (n.type === 'wood') wood++; if (n.type === 'gold') gold++; }
                        if (wood < 15 || gold < 4) out.bad.push(`mało surowców przy stolicy ${i}: ${wood} drzew, ${gold} złóż złota`);
                        for (let j = 0; j < i; j++) if (Math.hypot(t.x - tcs[j].x, t.y - tcs[j].y) < 1500) out.bad.push(`stolice ${i} i ${j} za blisko`);
                    }
                    out.fords = (G.fords || []).length;
                    out.rivers = (G.rivers || []).length;
                    return out;
                });
                assert.deepEqual(r.bad, [], `rzeki ${rivers}: ` + r.bad.join('; '));
                if (rivers !== 'few') assert.ok(r.fords > 0, 'brak brodów');
                assertNoErrors(page, 'kontynent ' + rivers);
                await closeGame(page);
            }
        }
    }
];
