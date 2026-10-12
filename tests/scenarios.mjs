// Scenariusze do testów mechanik: osada w murach z bramą, targi i wozy kupieckie.
// Wszystko liczone w przeglądarce (page.evaluate) - funkcje poniżej zwracają kod jako tekst do wstrzyknięcia.

// Wstrzykuje do strony pomocnicze funkcje window.__ab (raz na stronę)
export async function installHelpers(page) {
    await page.evaluate(() => {
        if (window.__ab) return;
        const g = () => window.game;
        const H = window.__ab = {
            tc(n) { return n.buildings.find(b => b.type === 'town_center' && !b.isDestroyed); },
            // budynek postawiony od razu (bez budowy); usuwa drzewa i złoża, które by przeszkadzały
            put(n, type, x, y) {
                const G = g(), cfg = GameConfig.buildings[type], r = (cfg.size || 40) / 2 + 14;
                for (const nd of G.resourceNodes) if (!nd.isDestroyed && Math.abs(nd.x - x) < r + nd.radius && Math.abs(nd.y - y) < r + nd.radius) { nd.amount = 0; G.killEntity(nd, null); }
                const b = new Building(x, y, n.color, n, type, { instant: true });
                n.buildings.push(b); G.addEntity(b);
                if (cfg.pop) n.recomputePopulation();
                G.obstacleVersion = (G.obstacleVersion || 0) + 1;
                return b;
            },
            // kwadrat muru wokół (cx, cy) o połowie boku R, brama pośrodku boku zwróconego ku (gx, gy)
            wallRing(n, cx, cy, R, gx, gy) {
                const G = g(), step = 20, posts = [];
                const ang = Math.atan2(gy - cy, gx - cx);
                const side = Math.abs(Math.cos(ang)) > Math.abs(Math.sin(ang)) ? (Math.cos(ang) > 0 ? 'E' : 'W') : (Math.sin(ang) > 0 ? 'S' : 'N');
                const gate = { E: [cx + R, cy], W: [cx - R, cy], S: [cx, cy + R], N: [cx, cy - R] }[side];
                for (let t = -R; t <= R; t += step) {
                    posts.push([cx + t, cy - R], [cx + t, cy + R]);
                    if (t > -R && t < R) posts.push([cx - R, cy + t], [cx + R, cy + t]);
                }
                for (const [x, y] of posts) {
                    if (Math.hypot(x - gate[0], y - gate[1]) < 25) continue;   // tu stanie brama (zajmuje miejsce słupków)
                    H.put(n, 'wooden_wall', x, y);
                }
                return H.put(n, 'gate', gate[0], gate[1]);
            },
            // najbliższe wolne miejsce pod budynek (spirala wokół x, y)
            freeSpot(n, type, x, y) {
                const G = g();
                for (let r = 0; r < 600; r += 20) for (let a = 0; a < Math.PI * 2; a += r ? 20 / r : 7) {
                    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
                    if (G.canPlaceBuilding(type, px, py, 5, null, n)) return { x: px, y: py };
                }
                return null;
            },
            carts(n, k, near) {
                const out = [];
                for (let i = 0; i < k; i++) { const before = n.units.length; near.spawnTrainedUnit({ type: 'trade_cart' }); if (n.units.length > before) out.push(n.units[n.units.length - 1]); }
                return out;
            },
            // stan wozów: ile jedzie, ile stoi bez szlaku, ile czeka
            cartState(n) {
                const c = { trading: 0, idleLost: 0, waiting: 0, other: 0, total: 0 };
                for (const u of n.units) {
                    if (u.isDestroyed || !u.cfg.trader) continue;
                    c.total++;
                    if (u.state === 'trading') c.trading++;
                    else if (u.state === 'idle' && u.tradeWait) c.waiting++;
                    else if (u.state === 'idle') c.idleLost++;
                    else c.other++;
                }
                return c;
            },
            noAI() { for (const n of g().nations) { n.ai = null; n.diplomat = null; } }
        };
    });
}
