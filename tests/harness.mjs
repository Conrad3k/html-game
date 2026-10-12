// Wspólne narzędzia testów: przeglądarka (Playwright + Chromium), wybór pliku gry, ziarno losowania,
// uruchamianie meczu i symulacja bez rysowania obrazu.
import { createRequire } from 'node:module';
import { readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Playwright: z node_modules projektu albo z instalacji globalnej
function loadPlaywright() {
    const req = createRequire(import.meta.url);
    const tries = ['playwright', 'playwright-core'];
    const globals = [process.env.NODE_PATH, '/opt/node22/lib/node_modules', '/usr/local/lib/node_modules', '/usr/lib/node_modules'].filter(Boolean);
    for (const name of tries) {
        try { return req(name); } catch (e) { /* dalej */ }
        for (const g of globals) { try { return req(join(g, name)); } catch (e) { /* dalej */ } }
    }
    throw new Error('Brak Playwright - zainstaluj: npm install (albo npm i -g playwright)');
}
export const { chromium } = loadPlaywright();

// Numer wydania z nazwy pliku: "Artificial Battles - Reloaded V1.5.2.html" -> [1, 5, 2]
export function versionOf(name) {
    const m = /Reloaded V(\d+(?:\.\d+)*)\.html$/.exec(name);
    return m ? m[1].split('.').map(Number) : null;
}
function cmp(a, b) { for (let i = 0; i < Math.max(a.length, b.length); i++) { const d = (a[i] || 0) - (b[i] || 0); if (d) return d; } return 0; }

// Wszystkie wydania w katalogu repozytorium, od najstarszego
export function releases() {
    return readdirSync(ROOT).filter(f => versionOf(f)).sort((a, b) => cmp(versionOf(a), versionOf(b)));
}
// Plik do testów: AB_FILE albo najnowsze wydanie
export function gameFile() {
    if (process.env.AB_FILE) return resolve(process.env.AB_FILE);
    const all = releases();
    if (!all.length) throw new Error('Nie znaleziono pliku gry');
    return join(ROOT, all[all.length - 1]);
}
// Poprzednie wydanie (do testu zgodności zapisów)
export function previousFile() {
    const cur = gameFile(), all = releases().map(f => join(ROOT, f));
    const i = all.indexOf(cur);
    return i > 0 ? all[i - 1] : null;
}

let browser = null;
export async function getBrowser() {
    if (browser) return browser;
    const opts = { args: ['--autoplay-policy=no-user-gesture-required'] };
    const exe = process.env.AB_CHROMIUM || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => existsSync(p));
    try { browser = await chromium.launch(opts); }
    catch (e) { if (!exe) throw e; browser = await chromium.launch({ ...opts, executablePath: exe }); }
    return browser;
}
export async function closeBrowser() { if (browser) { await browser.close(); browser = null; } }

// Ziarno Math.random (mulberry32) wstrzykiwane przed skryptami gry; window.__abReseed(n) zaczyna ciąg od nowa
const SEED_SCRIPT = `(() => {
    let s = 12345 >>> 0;
    const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    Math.random = rnd;
    window.__abReseed = (n) => { s = (n >>> 0) || 1; };
})();`;

// Nowa strona z grą. Zbiera błędy strony i konsoli (page.errors).
export async function openGame(file = gameFile(), { context, seed = true, viewport = { width: 1440, height: 900 } } = {}) {
    const ctx = context || await (await getBrowser()).newContext({ viewport });
    const page = await ctx.newPage();
    page.errors = [];
    page.on('pageerror', e => page.errors.push('pageerror: ' + (e.stack || e.message)));
    page.on('console', m => { if (m.type() === 'error') page.errors.push('console: ' + m.text()); });
    if (seed) await page.addInitScript(SEED_SCRIPT);
    await page.goto(pathToFileURL(file).href);
    await page.waitForFunction(() => !!window.ArtificialBattles, null, { timeout: 60000 });
    page.ownContext = context ? null : ctx;
    return page;
}
export async function closeGame(page) { const c = page.ownContext; await page.close(); if (c) await c.close(); }

// Opcje meczu
export function diploOptions(n = 4, extra = {}) {
    const colors = ['blue', 'red', 'green', 'yellow', 'purple', 'orange', 'teal', 'pink'];
    const diffs = ['medium', 'hard', 'easy', 'brutal', 'medium', 'hard', 'easy'];
    const nations = [{ isPlayer: true, color: colors[0], team: 1, nationName: '' }];
    for (let i = 1; i < n; i++) nations.push({ isPlayer: false, color: colors[i], team: i + 1, diff: diffs[(i - 1) % diffs.length] });
    return { mode: 'diplomacy', nations, seed: 4242, rivers: 'normal', truce: 300, limit: 3600, biome: 'meadow', rich: false,
        reveal: false, kings: false, wonders: true, atmosphere: false, ...extra };
}
export function classicOptions(extra = {}) {
    return { mode: 'classic', nations: [{ isPlayer: true, color: 'blue', team: 1 }, { isPlayer: false, color: 'red', team: 2, diff: 'hard' }],
        playerCorner: 'bl', mapSize: 3000, mapType: 'plains', biome: 'meadow', rich: false, reveal: false, kings: false, wonders: true, atmosphere: false, fixedLayout: true, ...extra };
}

// Start meczu. Pętla obrazu (requestAnimationFrame) zostaje wyłączona, żeby symulację prowadził test (sim) - wtedy
// przebieg zależy tylko od ziarna. watch: true zostawia normalną pętlę (gra "na żywo").
export async function startMatch(page, options, { seed = 777, watch = false } = {}) {
    await page.evaluate(({ options, seed, watch }) => {
        if (!watch && !Game.prototype.__abPatched) {
            const orig = Game.prototype.start;
            Game.prototype.start = function () { this.loop = () => {}; return orig.call(this); };
            Game.prototype.__abPatched = true;
        }
        if (window.__abReseed) window.__abReseed(seed);
        window.ArtificialBattles.start(options);
    }, { options, seed, watch });
    await page.waitForFunction(() => window.game && window.game.started && window.uiManager, null, { timeout: 180000 });
}

// Symulacja: seconds sekund gry w krokach Game.STEP, w porcjach (żeby nie blokować przeglądarki na długo)
export async function sim(page, seconds, { chunk = 30 } = {}) {
    let left = seconds;
    while (left > 1e-9) {
        const s = Math.min(chunk, left);
        await page.evaluate((s) => {
            // budżet czasu na ścieżki bez limitu: w grze zależy od szybkości komputera (ms na klatkę), w teście
            // każda trasa liczy się od razu - wtedy przebieg zależy tylko od ziarna
            const g = window.game, n = Math.round(s / Game.STEP);
            g._budgetExternal = true; g.pathBudget = 1e9; g.orderBudget = 1e9;
            for (let i = 0; i < n && !g.gameOver; i++) g.simStep(Game.STEP);
            g._budgetExternal = false;
        }, s);
        left -= s;
    }
}

// Odcisk stanu gry (do porównań "bit w bit" i po wczytaniu zapisu)
export async function digest(page) {
    return page.evaluate(() => {
        const g = window.game;
        let h = 2166136261;
        const mix = (v) => { const s = String(v); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } };
        mix(g.time.toFixed(3));
        for (const n of g.nations) {
            mix(n.name); mix(n.age); mix(n.defeated ? 1 : 0);
            for (const k of ['food', 'wood', 'gold', 'stone']) mix(n.resources.get(k).toFixed(2));
            mix(n.units.length); mix(n.buildings.length);
            for (const u of n.units) { mix(u.unitType); mix(u.x.toFixed(2)); mix(u.y.toFixed(2)); mix(u.hp.toFixed(2)); }
            for (const b of n.buildings) { mix(b.type); mix(b.hp.toFixed(2)); }
        }
        if (g.diplo) mix(Array.from(g.diplo.state).join(''));
        return (h >>> 0).toString(16);
    });
}

export function assertNoErrors(page, what = '') {
    const errs = page.errors.filter(e => !/favicon|ERR_FILE_NOT_FOUND/.test(e));
    if (errs.length) throw new Error(`Błędy strony${what ? ' (' + what + ')' : ''}:\n` + errs.slice(0, 8).join('\n'));
}
