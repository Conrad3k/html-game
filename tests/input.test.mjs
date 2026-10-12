// Sterowanie jak człowiek: mysz i klawiatura na prawdziwej pętli gry (requestAnimationFrame), bez skrótów przez kod.
// Te testy złapałyby błąd z pierwszej wersji V2.0, w której nadpisana metoda interfejsu odcięła obsługę myszy.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { openGame, closeGame, startMatch, classicOptions, diploOptions, gameFile, assertNoErrors } from './harness.mjs';

// Punkt świata -> punkt ekranu (kamera = lewy górny róg widoku w świecie)
const screenOf = (page, x, y) => page.evaluate(({ x, y }) => { const g = window.game, z = g.zoom || 1; return { x: (x - g.camera.x) * z, y: (y - g.camera.y) * z }; }, { x, y });
async function live(opts) {
    const page = await openGame(undefined, { seed: false, viewport: { width: 1440, height: 900 } });
    await startMatch(page, opts, { watch: true });
    await page.waitForTimeout(1200);
    return page;
}
const clickCmd = (page, title) => page.evaluate((title) => {
    const ui = window.uiManager, i = ui.cmds.findIndex(c => c && c.title && c.title.startsWith(title));
    if (i < 0) return false;
    ui.cmds[i].el.click();
    return true;
}, title);

export default [
    {
        name: 'Mysz: klik zaznacza robotnika, ramka zaznacza kilku, PPM na drzewo wysyła do pracy',
        async run() {
            const page = await live(classicOptions({ events: false }));
            const w = await page.evaluate(() => { const ws = window.game.playerNation.units.filter(u => u.unitType === 'worker'); return ws.map(u => ({ x: u.x, y: u.y, id: u.id })); });
            const p0 = await screenOf(page, w[0].x, w[0].y);
            await page.mouse.click(p0.x, p0.y);
            await page.waitForTimeout(150);
            const one = await page.evaluate(() => window.game.playerNation.units.filter(u => u.isSelected).map(u => u.id));
            assert.deepEqual(one, [w[0].id], 'klik nie zaznaczył robotnika');
            // ramka wokół wszystkich robotników
            const xs = w.map(u => u.x), ys = w.map(u => u.y);
            const a = await screenOf(page, Math.min(...xs) - 30, Math.min(...ys) - 30), b = await screenOf(page, Math.max(...xs) + 30, Math.max(...ys) + 30);
            await page.mouse.move(a.x, a.y); await page.mouse.down();
            await page.mouse.move((a.x + b.x) / 2, (a.y + b.y) / 2, { steps: 4 }); await page.mouse.move(b.x, b.y, { steps: 4 });
            await page.mouse.up();
            await page.waitForTimeout(150);
            const many = await page.evaluate(() => window.game.playerNation.units.filter(u => u.isSelected).length);
            assert.equal(many, w.length, 'ramka zaznaczyła ' + many + ' z ' + w.length);
            // PPM na najbliższe drzewo
            const tree = await page.evaluate(() => { const g = window.game, t = g.playerNation.units[0]; const n = g.resourceNodes.filter(n => n.type === 'wood' && !n.isDestroyed).sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y))[0]; return { x: n.x, y: n.y }; });
            const tp = await screenOf(page, tree.x, tree.y);
            await page.mouse.click(tp.x, tp.y, { button: 'right' });
            await page.waitForTimeout(300);
            const st = await page.evaluate(() => window.game.playerNation.units.filter(u => u.isSelected).map(u => u.state));
            assert.ok(st.every(s => s === 'moving_to_resource' || s === 'gathering'), 'rozkaz PPM: ' + st);
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Przyciski i klawiatura: budowa domu z menu, szkolenie w Ratuszu, kropka, Esc i Tab',
        async run() {
            const page = await live(diploOptions(3, { events: false }));
            // robotnik -> Budynki gospodarcze -> Dom -> klik na mapie
            const w = await page.evaluate(() => { const u = window.game.playerNation.units.find(u => u.unitType === 'worker'); return { x: u.x, y: u.y, id: u.id }; });
            const p0 = await screenOf(page, w.x, w.y);
            await page.mouse.click(p0.x, p0.y);
            await page.waitForTimeout(150);
            assert.ok(await clickCmd(page, 'Budynki gospodarcze'), 'brak menu budowy');
            await page.waitForTimeout(100);
            assert.ok(await clickCmd(page, 'Dom'), 'brak przycisku Dom');
            const spot = await page.evaluate(() => { const g = window.game, n = g.playerNation, tc = n.buildings[0];
                for (let r = 160; r < 500; r += 20) for (let a = 0; a < 6.28; a += 0.3) { const x = tc.x + Math.cos(a) * r, y = tc.y + Math.sin(a) * r; if (g.canPlaceBuilding('house', x, y, 5, null, n) && g.isExplored(x, y)) return { x, y }; } return null; });
            const sp = await screenOf(page, spot.x, spot.y);
            const b0 = await page.evaluate(() => window.game.playerNation.buildings.length);
            await page.mouse.move(sp.x, sp.y); await page.mouse.click(sp.x, sp.y);
            await page.waitForTimeout(300);
            const b1 = await page.evaluate(() => window.game.playerNation.buildings.filter(b => b.type === 'house').length);
            assert.ok(b1 >= 1, 'dom nie został postawiony (budynków przed: ' + b0 + ')');
            // Ratusz -> szkolenie robotnika
            const tc = await page.evaluate(() => { const b = window.game.playerNation.buildings.find(b => b.type === 'town_center'); return { x: b.x, y: b.y }; });
            await page.keyboard.press('Escape'); await page.waitForTimeout(100);
            if (await page.evaluate(() => document.getElementById('pause-menu').style.display === 'flex')) { await page.keyboard.press('Escape'); await page.waitForTimeout(100); }
            const tp = await screenOf(page, tc.x, tc.y);
            await page.mouse.click(tp.x, tp.y);
            await page.waitForTimeout(150);
            const q0 = await page.evaluate(() => window.game.playerNation.buildings.find(b => b.type === 'town_center').trainingQueue.length);
            assert.ok(await clickCmd(page, 'Robotnik'), 'brak przycisku Robotnik');
            await page.waitForTimeout(150);
            const q1 = await page.evaluate(() => window.game.playerNation.buildings.find(b => b.type === 'town_center').trainingQueue.length);
            assert.equal(q1, q0 + 1, 'kolejka Ratusza');
            // kropka: wolny robotnik; Esc: pauza; Tab: Dyplomacja
            await page.mouse.click(5, 300);
            await page.keyboard.press('Period'); await page.waitForTimeout(150);
            const idleSel = await page.evaluate(() => window.game.playerNation.units.filter(u => u.isSelected && u.unitType === 'worker').length);
            assert.equal(idleSel, 1, 'kropka nie zaznaczyła wolnego robotnika');
            await page.keyboard.press('Escape'); await page.waitForTimeout(150);
            assert.ok(await page.evaluate(() => document.getElementById('pause-menu').style.display === 'flex'), 'Esc nie otworzył pauzy');
            await page.keyboard.press('Escape'); await page.waitForTimeout(150);
            await page.keyboard.press('Tab'); await page.waitForTimeout(250);
            assert.ok(await page.evaluate(() => window.uiManager.nationsOpen), 'Tab nie otworzył Dyplomacji');
            assertNoErrors(page);
            await closeGame(page);
        }
    },
    {
        name: 'Kod: żadna funkcja ani metoda nie nadpisuje po cichu innej o tej samej nazwie',
        async run() {
            const s = readFileSync(gameFile(), 'utf8');
            const added = [...s.matchAll(/^(\w+)\.prototype\.(\w+) = function/gm)].map(m => [m[1], m[2]]);
            const bad = [];
            for (const m of s.matchAll(/^class (\w+)/gm)) {
                const body = s.slice(m.index, s.indexOf('\n}\n', m.index));
                const methods = new Set([...body.matchAll(/^    (?:static |async |get |set )?(\w+)\s*\([^)]*\)\s*\{/gm)].map(x => x[1]));
                for (const [cls, name] of added) if (cls === m[1] && methods.has(name)) bad.push(cls + '.' + name);
            }
            const seen = new Set();
            for (const [cls, name] of added) { const k = cls + '.' + name; if (seen.has(k)) bad.push(k + ' (dwa razy)'); seen.add(k); }
            // ta sama nazwa dwa razy: funkcja globalna, metoda klasy albo metoda obiektu (druga po cichu zastępuje pierwszą)
            const dup = (list, what) => { const c = new Map(); for (const n of list) c.set(n, (c.get(n) || 0) + 1); for (const [n, k] of c) if (k > 1) bad.push(what + ' ' + n + ' (' + k + ' razy)'); };
            dup([...s.matchAll(/^(?:async )?function (\w+)\s*\(/gm)].map(m => m[1]), 'funkcja');
            for (const m of s.matchAll(/^class (\w+)/gm)) {
                const body = s.slice(m.index, s.indexOf('\n}\n', m.index));
                dup([...body.matchAll(/^    (?:static |async )?(\w+)\s*\([^)]*\)\s*\{/gm)].map(x => x[1]).filter(n => !['if', 'for', 'while', 'switch'].includes(n)), m[1] + '.');
            }
            for (const m of s.matchAll(/^const (\w+) = \{\n/gm)) {
                const body = s.slice(m.index, s.indexOf('\n};', m.index));
                dup([...body.matchAll(/^    (?:async )?(\w+)\s*\([^)]*\)\s*\{/gm)].map(x => x[1]), m[1] + '.');
            }
            assert.deepEqual(bad, []);
        }
    }
];
