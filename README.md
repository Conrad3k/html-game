# Artificial-Battles
Gra w jednym pliku HTML

Najnowsze wydanie: **Artificial Battles - Reloaded V2.0.html** (otwórz w przeglądarce, działa offline).
Poprzednie wydanie, **Artificial Battles - Reloaded V1.5.2.html**, zostaje w repozytorium.

**Reloaded V2.0** — Wydarzenia świata, Kronika bitwy i wozy kupieckie, które nie gubią drogi:
- **Wydarzenia świata** — co 4–6 minut każdą nację spotyka coś nieplanowanego: urodzaj, złota żyła, wiatrołom, nowe
  wyrobisko, osadnicy albo pożar w składzie. Część wymaga decyzji (karta z dwoma przyciskami, 45 s): susza, zaraza,
  najemnicy, wędrowny uczony z gotowym badaniem, turniej (gwiazdka weterana dla żołnierzy). W Dyplomacji także
  wydarzenia kontynentu: wędrowni kupcy (handel ×2) i zjazd władców. Słabszym częściej trafia się coś dobrego,
  liderowi — coś złego; SI decyduje według tych samych kosztów. Opcja „Wydarzenia świata” w Zasadach, domyślnie włączona.
- **Kronika bitwy** — ekran wyników z zakładkami Wyniki / Przebieg (wykres Wyniku, wojska, robotników i zapasów każdej
  nacji) / Kronika (ery, wojny, pokoje, sojusze, Cuda, utracone Ratusze, porażki, wydarzenia) oraz wyróżnienia
  (Pogromca, Gospodarz, Burzyciel, Budowniczy, Największa armia, Pierwsi w najwyższej erze).
- **Wozy kupieckie nie utykają w bramach** — trasa prowadziła wóz partnera handlowego przez bramę osady w murach, ale sam
  ruch traktował ją jak mur: wóz krążył w bramie, aż tracił szlak. Teraz trasa i ruch mają te same uprawnienia bram,
  wóz w zatorze nie porzuca szlaku, a urwana w pół drogi długa trasa jest liczona dalej.
- **Silnik i porządki** — szybsze przeliczanie dostępności terenu po zmianach przeszkód i sojuszy (ten sam przebieg gry,
  sprawdzony bit w bit), usunięty nieużywany kod i zdublowane funkcje, zdjęte nieaktualne znaczki „Nowość”.
- **Co nowego** w menu: seria Reloaded V1.x zebrana w jedną zwięzłą listę.
- Gra wieloosobowa wymaga V2.0 (protokół 16); zapisy z Reloaded V1.0–V1.5.2 wczytują się.

### Reloaded V1.0–V1.5.2 w skrócie

- **Dyplomacja — nowy tryb główny**: kontynent 5× większy niż mapa Gigantyczna (rzeki, brody, morze, góry), do 8 nacji,
  wojna / pokój / sojusz zmieniające się w trakcie gry; zwycięstwo przez podbój, Sojusz zwycięzców, Cuda Świata albo
  Wynik po limicie czasu. Stosunki z konkretnymi powodami i reputacja; umowa handlowa, pakty o nieagresji i obronne,
  dary, poselstwa, zadośćuczynienie, wezwania do wojny, prośby o wsparcie, trybut, okup i kapitulacja. SI ocenia
  wszystkich według tych samych reguł, widzi mapę i tworzy koalicje. Ekran Dyplomacji (Tab) z mapą i macierzą
  relacji, Widokiem Prostym i Zaawansowanym; nazwy ludów dla nacji SI i własna nazwa nacji.
- **Cuda Świata** (cztery, z premiami), Chwała i Triumf; **zapis i wczytywanie gry** (F5 / F9, autozapis, plik);
  **gra wieloosobowa** bez serwera (do 8 nacji w Dyplomacji, 4 w Klasycznym meczu).
- **Handel**: wozy kupieckie do targów sojuszników i partnerów handlowych, bramy otwarte dla sojuszników i wozów
  partnerów, jednostki uwięzione za zamkniętą bramą przepadają po 20 s.
- **Wygląd i silnik Raptor**: nowe menu z encyklopedią i podglądem mapy, spokojniejszy interfejs, ładniejsze rzeki,
  symulacja 2–3× szybsza niż w V3.5 (od V1.3 o kolejną ćwierć); balans jednostek, wolniejsze surowce w Dyplomacji,
  rozwijający się poziom Łatwy. **Klasyczny mecz** został w menu jako druga opcja.

## Testy

Stały zestaw testów automatycznych (Playwright + Chromium) w katalogu `tests/`:

```
npm install        # Playwright (jednorazowo; przeglądarka: npx playwright install chromium)
npm test           # wszystkie testy (ok. 4 minuty)
npm run test:quick # bez najdłuższych scenariuszy
node tests/run.mjs wozy          # tylko testy, których nazwa zawiera „wozy”
AB_FILE="Artificial Battles - Reloaded V1.5.2.html" npm test   # inne wydanie
node tests/bench.mjs [--profile] # pomiar wydajności symulacji i rysowania (profil CPU w tests/out/)
```

Testy uruchamiają grę w przeglądarce bez okna i prowadzą symulację krok po kroku z ustalonym ziarnem losowania:
oba tryby SI kontra SI, powtarzalność przebiegu, Wydarzenia świata i Kronika, zapis i wczytanie (także zapisów
z poprzedniego wydania), gra wieloosobowa w dwóch kartach, handel i wozy kupieckie przy murach i bramach, surowce,
farmy, szkolenie, budowa, ery, ulepszenia, walka, Cuda Świata, długie marsze, poprawność łatania regionów
(porównanie z pełnym przeliczeniem) i generowanie wszystkich typów oraz rozmiarów map i kontynentu z rzekami.
