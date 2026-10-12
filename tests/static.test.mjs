// Plik gry: spójne numery wydania, README, menu bez błędów
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { ROOT, gameFile, versionOf, openGame, closeGame, assertNoErrors } from './harness.mjs';

export default [
    {
        name: 'Numer wydania zgodny w nazwie pliku, tytule, konfiguracji, menu i „Co nowego”; README wskazuje plik',
        async run() {
            const file = gameFile(), name = basename(file), v = versionOf(name).join('.');
            const html = readFileSync(file, 'utf8');
            assert.ok(html.includes(`<title>Artificial Battles: Reloaded V${v}</title>`), 'tytuł strony');
            assert.ok(html.includes(`version: 'Reloaded V${v}'`), 'GameConfig.version');
            assert.ok(html.includes(`<b>V${v}</b></div>`), 'znaczek wersji w menu');
            assert.ok(html.includes(`Reloaded V${v} by Conrad3k`), 'stopka menu');
            assert.ok(html.includes(`<div class="eyebrow">Wydanie · Reloaded V${v}</div>`), '„Co nowego”: bieżące wydanie');
            const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
            assert.ok(readme.includes(`Najnowsze wydanie: **${name.replace('.html', '')}.html**`) || readme.includes(name), 'README: najnowsze wydanie');
        }
    },
    {
        name: 'Menu: wszystkie zakładki, encyklopedia i podgląd mapy bez błędów',
        async run() {
            const page = await openGame();
            const tabs = await page.$$eval('.menu-nav > span[data-pane]', els => els.map(e => e.dataset.pane));
            assert.ok(tabs.length >= 5, 'zakładek: ' + tabs.length);
            for (const t of tabs) {
                await page.click(`.menu-nav > span[data-pane="${t}"]`);
                await page.waitForTimeout(120);
            }
            const codex = await page.evaluate(() => ({ u: document.querySelectorAll('#pane-units .codex-card').length, b: document.querySelectorAll('#pane-buildings .codex-card').length,
                units: Object.keys(GameConfig.units).length, buildings: Object.keys(GameConfig.buildings).length }));
            assert.equal(codex.u, codex.units); assert.equal(codex.b, codex.buildings);
            // przełącznik trybu i opcja Wydarzeń
            await page.click('.menu-nav > span[data-pane="play"]');
            for (const m of ['classic', 'diplomacy']) { await page.click(`#mode-switch button[data-mode="${m}"]`); await page.waitForTimeout(150); }
            assert.ok(await page.$('#opt-events'), 'brak opcji Wydarzeń świata');
            assertNoErrors(page);
            await closeGame(page);
        }
    }
];
