# Tryb Dyplomacja — prompty etapów

Prompty do wklejania w **nowe sesje Claude Code**, po jednym na etap (etapy 4a i 4b osobno).

**Jak z nich korzystać**
1. Każdy etap zaczynaj w nowej sesji, na świeżym `main`, po scaleniu PR-a z poprzedniego etapu.
2. Wklej cały blok promptu. Każdy prompt jest samowystarczalny: zawiera wspólny kontekst i zasady.
3. Etap 0 tworzy `docs/DYPLOMACJA.md` (architektura i stan prac) oraz testy w `tests/`.
   Każdy kolejny etap czyta ten plik na początku i aktualizuje go na końcu, więc następna sesja wie, co już jest.
4. Jeśli sesja uzna etap za zbyt duży na jeden raz, może go podzielić na dwa PR-y. Wtedy w drugiej sesji wklej ten sam
   prompt z dopiskiem „kontynuuj — część pierwsza jest już w main, zobacz `docs/DYPLOMACJA.md`”.

---

## Etap 0 — Fundament (gracz nic nie zauważa)

```
KONTEKST
Pracujesz nad grą RTS „Artificial Battles: Reloaded” — jeden plik `Artificial Battles - Reloaded V1.0.html` (ok. 25,6 tys. linii, silnik Raptor). Kod jest podzielony na moduły oznaczone komentarzami `/* --- core/Game.js --- */`, `/* --- entities/Unit.js --- */` itd. Dodajemy nowy tryb gry **Dyplomacja** jako osobny klaster w tym samym pliku. Korzysta on ze wspólnego silnika (teren, grafika, Unit, Building, Pathfinder, dźwięk, Commands). Tryb **Klasyczny** (rozgrywka V3.5: stałe drużyny, `NationAI`, gra sieciowa) ma działać dokładnie tak jak dotąd.

ZASADY (obowiązują w każdym etapie)
1. Wspólny silnik zmieniasz tylko addytywnie albo bez zmiany zachowania. Inne zachowanie Dyplomacji robisz w klasach pochodnych (`DiploGame extends Game` itd.) lub przez metody, które `DiploGame` nadpisuje. Nie rozsiewaj `if (diplomacy)` po Unit/Building/UI.
2. Kod Dyplomacji trafia do nowych modułów `/* --- diplo/Nazwa.js --- */`, wstawionych przed `/* --- main.js --- */`.
3. Nie ruszasz `ai/NationAI.js` ani `net/*` (to wyłącznie tryb Klasyczny).
4. Styl kodu, nazewnictwo i polskie komentarze jak w otaczającym kodzie. Teksty w grze po polsku.
5. Gra ma dalej działać offline z jednego pliku HTML. Testy i dokumentacja leżą obok, nie w pliku gry.

CEL ETAPU 0
Przygotować silnik pod Dyplomację tak, żeby w trybie Klasycznym nic się nie zmieniło.

ZAKRES
1. Relacje między nacjami przez metody Game.
   - W kodzie jest ok. 47 bezpośrednich porównań drużyn (`a.team === b.team`, `!==` itd.). Te w `NationAI` i `net/*` zostaw.
   - Pozostałe (ok. 34: Game, Commands, Unit, Building, UIManager, Minimap, Atmosphere, main.js) przepnij na metody `Game` według znaczenia:
     `isEnemy(a, b)` (wolno atakować), `isAlly(a, b)`, `sharesVision(nationA, nationB)` (wspólne pole widzenia, mgła, `_visTeams`), `canPassGate(nation, gate)`.
     Dodaj inne metody, jeśli jakieś porównanie znaczy coś jeszcze (np. wspólne zwycięstwo).
   - Uwaga: w Game jest `playerTeam`, a widoczność liczona jest per drużyna. Zrób to tak, żeby klasa pochodna mogła liczyć widzenie per „blok widzenia” (np. gracz + sojusznicy), a nie per stały numer drużyny.
   - W `Game` metody zachowują dotychczasową logikę drużyn, więc Klasyczny działa identycznie.
2. Siatka wody.
   - `Game.isWater(x, y)` dziś przy każdym wywołaniu przechodzi po wszystkich jeziorach i ich kołach (blobs). Po wygenerowaniu mapy zbuduj siatkę wody (`Uint8Array`, komórka ok. 10 px; 0 = ląd, 2 = głęboka woda; wartość 1 zarezerwuj na brody/płycizny na później).
   - `isWater` czyta z siatki. Wynik ma być zgodny z dotychczasowym. Napisz test porównujący starą i nową funkcję na kilku tysiącach losowych punktów dla każdego typu mapy; dopuszczalne różnice tylko na samej krawędzi kół.
3. Szkielet klastra (moduły `diplo/`):
   - `class Relations`: macierz stanów między nacjami ('war' | 'neutral' | 'alliance'); metody get/set; zdarzenia zmiany.
   - `class DiploGame extends Game`: nadpisuje `isEnemy` / `isAlly` / `sharesVision` / `canPassGate` na podstawie `Relations`.
     Na razie wystarczy, że da się go utworzyć i uruchomić z jednym graczem na mapie.
4. Menu „Nowa bitwa”: na górze przełącznik trybu **Klasyczny / Dyplomacja**. Dyplomacja na razie nieaktywna, z etykietą „wkrótce”.
   Wygląd zgodny z nowym menu Reloaded (te same klasy kart i przełączników).
5. Testy w `tests/` (Playwright, Chromium jest zainstalowany: `executablePath: '/opt/pw-browsers/chromium'`, nie uruchamiaj `playwright install`):
   - test dymny Klasycznego: otwiera plik, startuje mecz gracz + 3 SI na mapie średniej, przewija symulację kilka minut gry (znajdź pętlę/krok symulacji i wywołuj go bezpośrednio, żeby było szybko), sprawdza brak błędów w konsoli, że SI się rozbudowują i walczą (np. przez `opLog`);
   - test zgodności `isWater`.
   Opisz w `tests/README.md`, jak je uruchomić.
6. Utwórz `docs/DYPLOMACJA.md`: cel trybu, plan etapów (0, 1, 2, 3, 4a, 4b, 5, 6 — patrz `docs/Dyplomacja - prompty.md`), architektura (które moduły są wspólne, co jest w `diplo/`, jakie metody Game nadpisuje DiploGame), zasady powyżej, stan prac.

POZA ZAKRESEM
Jakakolwiek rozgrywka Dyplomacji, nowa SI, zmiany balansu, zmiana wersji gry.

KRYTERIA UKOŃCZENIA
- Test dymny Klasycznego przechodzi; ręcznie rozegrany mecz Klasyczny wygląda jak przed zmianami (sojusznicy, mgła, bramy, zwycięstwo drużyny).
- Test `isWater` przechodzi; brak błędów w konsoli.
- `DiploGame` da się utworzyć z konsoli przeglądarki.

NA KONIEC
Zaktualizuj `docs/DYPLOMACJA.md`, commit z jasnym opisem, push na swoją gałąź, utwórz PR z listą zmian i wynikami testów. Wersji gry (`GameConfig.version`) nie zmieniaj w tym etapie.
```

---

## Etap 1 — Preview 1: „Piaskownica”

```
KONTEKST
Pracujesz nad grą RTS „Artificial Battles: Reloaded” — jeden plik `Artificial Battles - Reloaded V1.0.html` (silnik Raptor, moduły oznaczone komentarzami `/* --- core/Game.js --- */` itd.). Budujemy nowy tryb **Dyplomacja** jako klaster `diplo/` w tym samym pliku, na wspólnym silniku. Tryb **Klasyczny** (V3.5: drużyny, `NationAI`, sieć) ma działać bez zmian. Etap 0 jest już w main: relacje idą przez metody Game (`isEnemy`, `isAlly`, `sharesVision`, `canPassGate`), jest siatka wody, `Relations`, szkielet `DiploGame`, przełącznik trybu w menu, testy w `tests/`. Najpierw przeczytaj `docs/DYPLOMACJA.md`.

ZASADY
1. Wspólny silnik zmieniasz tylko addytywnie albo bez zmiany zachowania; różnice Dyplomacji w klasach pochodnych / nadpisanych metodach, bez `if (diplomacy)` po Unit/Building/UI.
2. Nowy kod w modułach `/* --- diplo/Nazwa.js --- */` przed `/* --- main.js --- */`.
3. Nie ruszasz `ai/NationAI.js` ani `net/*`.
4. Styl i polskie komentarze jak w otoczeniu; teksty w grze po polsku. Gra działa offline z jednego pliku.

CEL ETAPU 1
Pierwsza grywalna wersja Dyplomacji (tylko gra jednoosobowa): wszyscy zaczynają neutralni, relacje się zmieniają, nowa SI od zera gra cały mecz.

ZAKRES
1. Ustawienia meczu dla Dyplomacji (w menu „Nowa bitwa”, tryb Dyplomacja aktywny):
   2–4 nacje, każda z własnym kolorem, bez wyboru drużyn; poziom trudności każdej SI; obecne rozmiary i typy map; warunek zwycięstwa (patrz pkt 5).
2. Relacje ('war' | 'neutral' | 'alliance'):
   - neutralni: jednostki i wieże się nie atakują, nie ma automatycznego celowania; rozkaz ataku na neutralnego otwiera okno „Wypowiedzieć wojnę <nacja>?”;
   - wojna: jak wróg w Klasycznym;
   - sojusz: wspólne pole widzenia, przechodzenie przez bramy, brak ataków;
   - każda zmiana relacji: komunikat na ekranie i w dzienniku zdarzeń.
3. Panel dyplomacji (klawisz i przycisk w HUD — sprawdź wolne skróty): lista nacji z relacją, siłą (orientacyjnie: armia, ekonomia — tylko to, co gracz widział) i przyciskami: wypowiedz wojnę, zaproponuj pokój, zaproponuj sojusz, zerwij sojusz. Propozycje SI do gracza pojawiają się jako powiadomienie z przyciskami Przyjmij / Odrzuć i limitem czasu.
4. Nowa SI od zera: `class DiploAI` w `diplo/`, w trzech warstwach:
   - **Gospodarz**: zbieranie, budowa osady, szkolenie robotników i wojska, ulepszenia;
   - **Dowódca**: obrona osady, ataki wyłącznie na nacje, z którymi trwa wojna, wycofanie przy przewadze wroga;
   - **Dyplomata (na razie reguły)**: np. przyjmuje pokój, gdy przegrywa wojnę; wypowiada wojnę słabszemu sąsiadowi, gdy jest silny i nie ma innej wojny; proponuje sojusz przeciw najsilniejszemu; nie zdradza sojusznika bez powodu.
   Do wydawania rozkazów używaj wspólnego API (Commands, metody Nation/Building). `NationAI` możesz czytać, żeby zobaczyć, jak to robi, ale nie kopiuj jej hurtem.
   SI nie widzi przez mgłę wojny. Poziomy trudności wpływają na szybkość reakcji i jakość decyzji, a nie na oszukiwanie.
   Każda SI prowadzi dziennik decyzji (jak `opLog`) do testów.
5. Zwycięstwo i porażka: porażka jak w Klasycznym (sprawdź, co Game uznaje za pokonaną nację). Zwycięstwo: ostatnia nacja albo ostatni sojusz (wszyscy pozostali w sojuszu ze sobą); opcja w ustawieniach.
6. Ustaw `GameConfig.version` i `<title>` na „Reloaded V1.0 Dyplomacja Preview 1”. Dodaj kartę w zakładce „Co nowego” (`#pane-news`) i akapit w `README.md`.

POZA ZAKRESEM
Zapis gry, terytoria, handel, pakty czasowe, opinie SI, większe mapy, więcej niż 4 nacje, gra sieciowa w Dyplomacji (w lobby sieciowym tryb Dyplomacja ma być niedostępny).

TESTY I KRYTERIA UKOŃCZENIA
- Nowy test w `tests/`: mecz Dyplomacji 4 SI (bez gracza lub z biernym graczem), przewinięty kilkadziesiąt minut gry: relacje zmieniają się co najmniej kilka razy, dochodzi do wojen i pokojów, mecz kończy się zwycięzcą lub trwa bez błędów.
- Test dymny Klasycznego dalej przechodzi.
- Ręcznie: da się rozegrać mecz od startu do zwycięstwa, panel dyplomacji działa, propozycje SI przychodzą i można je przyjąć.

NA KONIEC
Zaktualizuj `docs/DYPLOMACJA.md` (architektura DiploAI, stan prac, znane problemy), commit, push na swoją gałąź, PR z opisem i wynikami testów.
```

---

## Etap 2 — Preview 2: „Zapis gry”

```
KONTEKST
Pracujesz nad grą RTS „Artificial Battles: Reloaded” — jeden plik `Artificial Battles - Reloaded V1.0.html` (silnik Raptor, moduły `/* --- core/Game.js --- */` itd.). Tryb **Dyplomacja** (klaster `diplo/`: `DiploGame`, `Relations`, `DiploAI`, panel dyplomacji) jest grywalny od Preview 1. Tryb **Klasyczny** ma działać bez zmian. Najpierw przeczytaj `docs/DYPLOMACJA.md`.

ZASADY
1. Wspólny silnik zmieniasz tylko addytywnie albo bez zmiany zachowania; różnice Dyplomacji w klasach pochodnych / nadpisanych metodach.
2. Nowy kod w modułach `/* --- diplo/Nazwa.js --- */` przed `/* --- main.js --- */`.
3. Nie ruszasz `ai/NationAI.js` ani `net/*`.
4. Styl i polskie komentarze jak w otoczeniu; teksty po polsku. Gra działa offline z jednego pliku.

CEL ETAPU 2
Zapis i wczytywanie meczu Dyplomacji, tak żeby gra po wczytaniu toczyła się dalej, jakby nie była przerwana.

ZAKRES
1. `class SaveSystem` w `diplo/`. Serializację trzymaj w nim (funkcje czytające pola obiektów), żeby nie dokładać kodu do klas Klasycznego, chyba że metoda `serialize()` w klasie jest wyraźnie czystsza — wtedy tylko addytywnie. Zaprojektuj format tak, żeby kiedyś dało się dodać zapis Klasycznego.
2. Co zapisać:
   - ustawienia meczu, ziarno mapy, czas gry, kamera, zaznaczenie, grupy kontrolne;
   - teren: NIE zapisuj pikseli — odtwórz z ziarna (generator używa `mulberry32` z `seed`) i nałóż listę zmian: ślady (stamps), wycięte drzewa, stan złóż (`ResourceNode`);
   - mgła: odkryte pola (`exploredGrid`, skompresowane);
   - nacje: surowce, ulepszenia, statystyki, stan pokonania;
   - jednostki i budynki: każdy obiekt dostaje stałe ID; referencje (cel, właściciel, budowany obiekt, garnizon itd.) zapisywane jako ID i odtwarzane w drugim przebiegu; kolejki szkolenia, postęp budowy, HP, rozkazy, szyki;
   - relacje (`Relations`), oczekujące propozycje, stan i pamięć każdej `DiploAI`;
   - pocisków, cząsteczek i efektów nie zapisuj.
   Przejrzyj klasy Unit, Building, Nation, Game i wypisz w `docs/DYPLOMACJA.md`, które pola są zapisywane, a które celowo pomijane.
3. Format: obiekt z polem `saveVersion` (od 1) i nagłówkiem (nazwa, data, nacje, czas gry, wersja gry); dane w JSON skompresowane `CompressionStream('gzip')`. Przy wczytaniu niezgodnej wersji: czytelny komunikat, bez wysypania gry.
4. Przechowywanie: IndexedDB (lista zapisów); eksport do pliku `.absave` i import z pliku.
5. Interfejs:
   - w menu w trakcie gry: „Zapisz grę” (z nazwą) i „Wczytaj grę”;
   - w menu głównym zakładka/karta „Wczytaj grę” z listą zapisów (nazwa, data, nacje, czas gry), usuwanie zapisów;
   - autozapis co kilka minut (rotacja 3 slotów, opcja w ustawieniach);
   - szybki zapis / szybkie wczytanie pod wolnymi klawiszami (sprawdź istniejące skróty).
   Zapis tylko w grze jednoosobowej w trybie Dyplomacja.
6. Wersja: `GameConfig.version` i `<title>` na „Reloaded V1.0 Dyplomacja Preview 2”, karta w „Co nowego”, akapit w README.

TESTY I KRYTERIA UKOŃCZENIA
- Test „w obie strony” w `tests/`: mecz 4 SI przewinięty ~15 min → zapis → wczytanie w świeżej stronie → ponowny zapis; oba zapisy (bez znaczników czasu) mają być identyczne.
- Test ciągłości: po wczytaniu mecz toczy się dalej kolejne ~15 min bez błędów; SI kontynuuje plany, relacje są te same.
- Wczytanie w środku bitwy, w trakcie budowy i z pełnymi kolejkami szkolenia działa.
- Test dymny Klasycznego i test Dyplomacji z Etapu 1 dalej przechodzą.

NA KONIEC
Zaktualizuj `docs/DYPLOMACJA.md` (format zapisu, lista pól, zasada podbijania `saveVersion`: każdy kolejny etap, który dodaje stan, podbija wersję i dopisuje migrację albo komunikat), commit, push, PR.
```

---

## Etap 3 — Preview 3: „Granice i handel”

```
KONTEKST
Pracujesz nad grą RTS „Artificial Battles: Reloaded” — jeden plik `Artificial Battles - Reloaded V1.0.html` (silnik Raptor, moduły `/* --- core/Game.js --- */` itd.). Tryb **Dyplomacja** (klaster `diplo/`: `DiploGame`, `Relations`, `DiploAI` z warstwami Gospodarz/Dowódca/Dyplomata, `SaveSystem`, panel dyplomacji) jest w main. Tryb **Klasyczny** ma działać bez zmian. Najpierw przeczytaj `docs/DYPLOMACJA.md`.

ZASADY
1. Wspólny silnik zmieniasz tylko addytywnie albo bez zmiany zachowania; różnice Dyplomacji w klasach pochodnych / nadpisanych metodach.
2. Nowy kod w modułach `/* --- diplo/Nazwa.js --- */` przed `/* --- main.js --- */`.
3. Nie ruszasz `ai/NationAI.js` ani `net/*`.
4. Styl i polskie komentarze jak w otoczeniu; teksty po polsku. Gra działa offline z jednego pliku.
5. Każdy nowy stan gry trafia do zapisu; podbij `saveVersion` i obsłuż starsze zapisy (migracja lub komunikat).

CEL ETAPU 3
Dać powody do negocjacji: terytoria, traktaty, handel i reputację.

ZAKRES
1. Terytoria (`diplo/Territory.js`):
   - siatka wpływów (komórka ok. 100–150 px) liczona od ratuszy, wież i innych budynków z promieniem zależnym od typu; przeliczana tylko przy budowie/zniszczeniu budynku;
   - granice rysowane na mapie (subtelna linia w kolorze nacji) i na minimapie (warstwa polityczna z przełącznikiem);
   - nie można stawiać budynków na cudzym terytorium (poza sojusznikami przy otwartych granicach — ustal i opisz regułę);
   - wejście wojska na cudze terytorium bez otwartych granic podnosi napięcie (zdarzenie dla SI, ostrzeżenie dla gracza, gdy dotyczy jego ziem).
2. Traktaty (rozszerz `Relations`):
   - pakt o nieagresji na czas (np. 10/20 minut gry), po wygaśnięciu powrót do neutralności;
   - otwarte granice (osobna umowa, może być jednostronna);
   - sojusz (jak dotąd: wspólne widzenie, bramy);
   - zerwanie traktatu przed czasem i atak bez wypowiedzenia wojny są możliwe, ale kosztują reputację.
3. Handel:
   - wymiana surowców (oferta: daję X, chcę Y), jednorazowy prezent, trybut cykliczny (np. co minutę przez N minut);
   - szlaki handlowe: wóz kupiecki między własnym rynkiem a rynkiem innej nacji (sprawdź budynek `market` i zachowanie wozu kupieckiego w Klasycznym; rozszerz addytywnie lub w podklasie); dochód zależy od odległości, obie strony zyskują; wymaga braku wojny (i ewentualnie otwartych granic);
   - zabicie cudzego wozu kupieckiego w czasie pokoju to incydent dyplomatyczny.
4. Reputacja: jedna wartość na nację widoczna dla wszystkich (zdrady, zerwane traktaty, ataki bez wypowiedzenia ją obniżają; dotrzymane traktaty powoli podnoszą). Na razie Dyplomata SI uwzględnia ją w prostych regułach.
5. Panel dyplomacji: zakładki/sekcje Relacje, Traktaty (aktywne, z czasem do końca), Handel (tworzenie oferty z suwakami surowców), Reputacja. Propozycje SI do gracza obejmują teraz handel i traktaty.
6. Dyplomata SI (wciąż reguły): ocena ofert handlowych (czy się opłaca, czy partner godny zaufania), propozycje paktów sąsiadom, pilnowanie granic, reakcja na wkroczenie wojska.
7. Wersja: „Reloaded V1.0 Dyplomacja Preview 3”, karta w „Co nowego”, README.

TESTY I KRYTERIA UKOŃCZENIA
- Test meczu 4 SI: pojawiają się pakty, handel, szlaki handlowe; dochodzi do co najmniej jednego wygaśnięcia paktu; brak błędów.
- Test zapisu „w obie strony” obejmuje terytoria, traktaty z czasem, oferty i reputację.
- Ręcznie: handel z SI ma sens (SI odrzuca rażąco złe oferty, przyjmuje uczciwe), granice są czytelne.
- Testy z poprzednich etapów i test dymny Klasycznego przechodzą.

NA KONIEC
Zaktualizuj `docs/DYPLOMACJA.md`, commit, push, PR.
```

---

## Etap 4a — Preview 4: „Wielki świat — skala”

```
KONTEKST
Pracujesz nad grą RTS „Artificial Battles: Reloaded” — jeden plik `Artificial Battles - Reloaded V1.0.html` (silnik Raptor, moduły `/* --- core/Game.js --- */`, `/* --- graphics/Terrain.js --- */`, `/* --- core/Pathfinder.js --- */` itd.). Tryb **Dyplomacja** (klaster `diplo/`: `DiploGame`, `Relations` z traktatami, `Territory`, handel, `DiploAI`, `SaveSystem`) jest w main. Tryb **Klasyczny** ma działać bez zmian. Najpierw przeczytaj `docs/DYPLOMACJA.md`.

ZASADY
1. Wspólny silnik zmieniasz tylko addytywnie albo bez zmiany zachowania; różnice Dyplomacji w klasach pochodnych / nadpisanych metodach. Ulepszenia wydajności wspólnego silnika są mile widziane, jeśli nie zmieniają rozgrywki Klasycznego.
2. Nowy kod w modułach `/* --- diplo/Nazwa.js --- */` przed `/* --- main.js --- */`.
3. Nie ruszasz `ai/NationAI.js` ani `net/*`.
4. Styl i polskie komentarze jak w otoczeniu; teksty po polsku. Gra działa offline z jednego pliku.
5. Nowy stan gry → zapis; podbij `saveVersion`.

CEL ETAPU 4a
Duże mapy i do 8 nacji w Dyplomacji, płynnie.

ZAKRES
1. Rozmiary map w Dyplomacji: dotychczasowe + ok. 7200 („Ogromna”) i 10200 („Kontynent”). W Klasycznym bez zmian.
2. Najpierw zmierz (profiler, czas klatki, czas generowania, pamięć) mecz 8 nacji na 10200 i zapisz wyniki w `docs/DYPLOMACJA.md`. Dopiero potem optymalizuj to, co faktycznie boli. Spodziewane miejsca:
   - kafelki terenu (`Terrain`, `this.CS = 512`, `this.chunks`): sprawdź, czy wyrenderowane kafelki są kiedykolwiek zwalniane. Przy 10200 to ok. 400 kafelków po ~1 MB — dodaj pamięć podręczną LRU z limitem (kafelek odtwarzany z danych + listy stamps);
   - tablice terenu na piksel/komórkę (np. `gh`, `ggx`, `ggy`) — sprawdź ich rozdzielczość i pamięć;
   - czas generowania świata — pasek postępu, ewentualnie praca w kawałkach, żeby strona nie zamarzała;
   - Pathfinder (siatka 30 px → ok. 115 tys. węzłów na 10200): wprowadź szukanie hierarchiczne (regiony/sektory + łączność; najpierw trasa po regionach, potem szczegółowa), z szybkim „brak drogi”, bez przeszukiwania całej mapy. Może to być podklasa używana przez DiploGame;
   - SpatialGrid, mgła, minimapa, aktualizacje SI rozłożone w czasie.
3. Do 8 nacji w Dyplomacji (kolory są w `ColorOrder`, jest ich 8): ustawienia meczu, rozmieszczenie startów sprawiedliwe na całej mapie, HUD/panel dyplomacji i minimapa czytelne przy 8 nacjach.
4. Kamera i nawigacja na dużej mapie: szybkie skoki (minimapa, klawisze do osady/alarmu), ewentualnie większe oddalenie.
5. Wersja: „Reloaded V1.0 Dyplomacja Preview 4”, karta w „Co nowego”, README.

POZA ZAKRESEM
Rzeki, brody, nowe typy map, rozkład surowców (to Etap 4b).

TESTY I KRYTERIA UKOŃCZENIA
- Wydajność: mecz 8 SI na „Kontynencie” po ~30 min gry utrzymuje płynność (zapisz cel i wynik w liczbach, np. średni i 95. percentyl czasu klatki, przed i po); pamięć stabilna (bez stałego wzrostu).
- Generowanie „Kontynentu” w akceptowalnym czasie z widocznym postępem.
- Test zapisu „w obie strony” na dużej mapie.
- Testy z poprzednich etapów i test dymny Klasycznego przechodzą; Klasyczny nie jest wolniejszy.

NA KONIEC
Zaktualizuj `docs/DYPLOMACJA.md` (pomiary, opis optymalizacji), commit, push, PR.
```

---

## Etap 4b — Preview 5: „Wielki świat — rzeki i krainy”

```
KONTEKST
Pracujesz nad grą RTS „Artificial Battles: Reloaded” — jeden plik `Artificial Battles - Reloaded V1.0.html` (silnik Raptor, moduły `/* --- graphics/Terrain.js --- */`, `/* --- core/Pathfinder.js --- */` itd.). Tryb **Dyplomacja** jest w main z dużymi mapami (do 10200, „Kontynent”), do 8 nacji, hierarchicznym szukaniem ścieżki i siatką wody (0 ląd, 1 zarezerwowane na bród/płyciznę, 2 głęboka woda). Tryb **Klasyczny** ma działać bez zmian. Najpierw przeczytaj `docs/DYPLOMACJA.md`.

ZASADY
1. Wspólny silnik zmieniasz tylko addytywnie albo bez zmiany zachowania. Nowe elementy generatora (rzeki itd.) włączane opcją — w Klasycznym domyślnie wyłączone, mapy Klasycznego bez zmian.
2. Nowy kod w modułach `/* --- diplo/Nazwa.js --- */` przed `/* --- main.js --- */` (generator rzek może być w Terrain, jeśli tam jest naturalniej — wtedy addytywnie).
3. Nie ruszasz `ai/NationAI.js` ani `net/*`.
4. Styl i polskie komentarze jak w otoczeniu; teksty po polsku. Gra działa offline z jednego pliku.
5. Wszystko z ziarna (`mulberry32`), żeby zapis gry odtwarzał mapę. Nowy stan → podbij `saveVersion`.

CEL ETAPU 4b
Urozmaicone mapy, które dają powody do dyplomacji: rzeki jako granice, brody jako punkty strategiczne, nierówne surowce.

ZAKRES
1. Rzeki:
   - źródła na wyżynach/w górach, bieg w dół wysokości terenu do jeziora lub krawędzi mapy; meandry; szerokość rośnie z biegiem;
   - w siatce wody: głęboki nurt (2) i brody (1) — brody przejezdne, ale z wolniejszym ruchem; co najmniej 2–4 brody na rzekę;
   - grafika spójna z obecnymi jeziorami (brzeg, połysk, animacja wody), brody wyraźnie widoczne (płycizna, kamienie);
   - Pathfinder i hierarchia regionów uwzględniają brody (regiony łączą się przez brody).
2. Poprawność mapy po generowaniu: wypełnianie od każdego startu — każda nacja może dojść do każdej innej (jeśli nie, dodaj bród); starty sprawiedliwe (porównywalna liczba przepraw, surowców i miejsca wokół osady).
3. Nierówne rozłożenie surowców (opcja meczu, domyślnie włączona w Dyplomacji): np. złoto głównie w górach, kamień na wyżynach, najwięcej drewna w puszczach, żywność na równinach i przy rzekach. Każda nacja ma minimum na start, ale nie wszystkiego w obfitości.
4. Nowe ukształtowania dla Dyplomacji: „Dorzecze” (sieć rzek), „Dwa brzegi” (wielka rzeka przez środek, kilka brodów), „Kontynent” (mieszany teren: góry, puszcze, rzeki, jeziora). Opisy w menu i encyklopedii.
5. Terytoria: rzeka może ograniczać rozlewanie się wpływów (wpływ słabnie za rzeką) — rzeki stają się naturalnymi granicami.
6. SI (wciąż obecna DiploAI): Dowódca wie o brodach — nie wysyła wojska w głęboką wodę, broni brodów na swoim terytorium, używa ich do ataku.
7. Wersja: „Reloaded V1.0 Dyplomacja Preview 5”, karta w „Co nowego”, README.

TESTY I KRYTERIA UKOŃCZENIA
- Test generatora: dla wielu ziaren i każdego nowego typu mapy łączność między wszystkimi startami jest zachowana, brody istnieją, generowanie mieści się w czasie z Etapu 4a.
- Test: mapy Klasycznego (te same ziarna i ustawienia) są identyczne jak przed zmianami.
- Mecz 8 SI na „Dorzeczu”: armie przechodzą przez brody, brak jednostek utkniętych przy rzece.
- Testy z poprzednich etapów i test dymny Klasycznego przechodzą.

NA KONIEC
Zaktualizuj `docs/DYPLOMACJA.md`, commit, push, PR.
```

---

## Etap 5 — Preview 6: „Dyplomata”

```
KONTEKST
Pracujesz nad grą RTS „Artificial Battles: Reloaded” — jeden plik `Artificial Battles - Reloaded V1.0.html` (silnik Raptor). Tryb **Dyplomacja** (klaster `diplo/`) jest w main: relacje i traktaty, terytoria, handel i szlaki, reputacja, zapis gry, duże mapy do 8 nacji, rzeki z brodami, nierówne surowce. `DiploAI` ma warstwy Gospodarz / Dowódca / Dyplomata, ale Dyplomata działa na prostych regułach. Tryb **Klasyczny** ma działać bez zmian. Najpierw przeczytaj `docs/DYPLOMACJA.md`.

ZASADY
1. Wspólny silnik zmieniasz tylko addytywnie albo bez zmiany zachowania.
2. Nowy kod w modułach `/* --- diplo/Nazwa.js --- */` przed `/* --- main.js --- */`.
3. Nie ruszasz `ai/NationAI.js` ani `net/*`.
4. Styl i polskie komentarze jak w otoczeniu; teksty po polsku. Gra działa offline z jednego pliku.
5. Nowy stan (opinie, pamięć, charaktery) → zapis; podbij `saveVersion`.

CEL ETAPU 5
Zastąpić reguły Dyplomaty systemem opinii, charakterów i pamięci, tak żeby decyzje SI były zrozumiałe, a partie różne.

ZAKRES
1. Opinia każdej nacji SI o każdej innej (-100..+100) jako suma **nazwanych modyfikatorów**, z których część z czasem słabnie, np.:
   wspólny wróg, wspólna granica/napięcie na granicy, handel i szlaki, prezenty, dotrzymane traktaty, zerwany traktat (długo pamiętany), atak bez wypowiedzenia, zabite wozy kupieckie, wojsko na naszym terytorium, reputacja ogólna, różnica sił (strach to nie sympatia — osobna oś „zagrożenie”), rywalizacja o ten sam surowiec/bród.
2. Charaktery władców (losowane, widoczne dla gracza po pewnym czasie kontaktu), np. Honorowy, Kupiec, Zdobywca, Ostrożny, Oportunista, Mściwy — wpływają na wagi modyfikatorów i progi decyzji. Imiona władców i nazwy nacji.
3. Decyzje Dyplomaty oparte na ocenie użyteczności: wypowiedzenie wojny (cel, okazja, sojusznicy), pokój (koszt wojny vs. zysk), sojusze (wspólny wróg, zaufanie), traktaty i handel (wartość oferty × zaufanie), zdrada (tylko gdy charakter i sytuacja na to pozwalają). Plany wieloetapowe: np. „zbuduję sojusz przeciw X, potem wypowiem mu wojnę”.
4. Kontrpropozycje: SI nie tylko przyjmuje/odrzuca, ale odpowiada „przyjmę, jeśli…” (dopłata, dłuższy pakt, otwarte granice).
5. Dyplomacja między samymi SI: sojusze, wojny, handel bez udziału gracza; gracz dowiaduje się o tym z wiadomości (o ile ma kontakt z daną nacją).
6. Wiadomości od władców: krótkie teksty zależne od charakteru i sytuacji (powitanie, groźba, prośba o pomoc, gratulacje, wypowiedzenie wojny z powodem).
7. Panel dyplomacji: opinia o graczu z rozpisaniem modyfikatorów, np. „+35 — wspólny wróg +20, handel +15, wojsko na granicy −10”; charakter (jeśli poznany); historia relacji.
8. Dowódca: współpraca z sojusznikami (wspólne cele, pomoc zaatakowanemu sojusznikowi), obsadzanie brodów i granic.
9. SI nadal nie widzi przez mgłę i nie zna ukrytych planów innych.
10. Wersja: „Reloaded V1.0 Dyplomacja Preview 6”, karta w „Co nowego”, README.

TESTY I KRYTERIA UKOŃCZENIA
- Test wielu meczów 8 SI (różne ziarna): przebiegi się różnią (różni zwycięzcy, różne sojusze), nie ma meczów, w których nic się nie dzieje, ani takich, gdzie wszyscy od razu walczą ze wszystkimi.
- Każda decyzja dyplomatyczna SI w dzienniku ma uzasadnienie (główne modyfikatory), czytelne dla człowieka.
- Ręcznie: zachowanie władców jest spójne z ich charakterem; zdrada boli reputację; pomoc sojusznikowi działa.
- Test zapisu „w obie strony” obejmuje opinie, pamięć i plany.
- Testy z poprzednich etapów i test dymny Klasycznego przechodzą.

NA KONIEC
Zaktualizuj `docs/DYPLOMACJA.md` (model opinii, lista modyfikatorów i wag, charaktery), commit, push, PR.
```

---

## Etap 6 — Wydanie: „Reloaded V1.0 — Dyplomacja”

```
KONTEKST
Pracujesz nad grą RTS „Artificial Battles: Reloaded” — jeden plik `Artificial Battles - Reloaded V1.0.html` (silnik Raptor). Tryb **Dyplomacja** (klaster `diplo/`) jest w main w wersji Preview 6: relacje, traktaty, terytoria, handel, reputacja, zapis gry, duże mapy do 8 nacji, rzeki i brody, Dyplomata z opiniami i charakterami. Tryb **Klasyczny** ma działać bez zmian. Najpierw przeczytaj `docs/DYPLOMACJA.md`.

ZASADY
1. Wspólny silnik zmieniasz tylko addytywnie albo bez zmiany zachowania.
2. Nie ruszasz `ai/NationAI.js` ani `net/*`.
3. Styl i polskie komentarze jak w otoczeniu; teksty po polsku. Gra działa offline z jednego pliku.

CEL ETAPU 6
Domknąć tryb i wydać go jako pełną wersję.

ZAKRES
1. Warunki zwycięstwa w Dyplomacji (wybór w ustawieniach meczu): ostatnia nacja / ostatni sojusz, dominacja terytorialna (np. X% mapy przez Y minut), Cud Świata (jak w Klasycznym, z uwzględnieniem sojuszy), ewentualnie limit czasu z wynikiem punktowym. Ekran końcowy z podsumowaniem: wykres terytoriów w czasie, historia wojen i sojuszy.
2. Balans: rozegraj (testami automatycznymi) serię meczów na różnych mapach i poziomach trudności; popraw rażące problemy (np. jedna strategia wygrywa zawsze, SI zbyt pasywna/agresywna, handel zbyt opłacalny). Zapisz wnioski w `docs/DYPLOMACJA.md`.
3. Czytelność dla nowego gracza: krótkie wprowadzenie przy pierwszym meczu Dyplomacji (wskazówki w grze, bez długiego samouczka), opisy w encyklopedii (traktaty, terytoria, reputacja, brody, charaktery).
4. Zgodność zapisów: zapisy z Preview 2–6 wczytują się (migracja) albo dają czytelny komunikat.
5. Przegląd całego klastra `diplo/`: martwy kod, zduplikowana logika, spójność nazw, komentarze; przegląd wydajności na „Kontynencie” z 8 nacjami.
6. Wydanie:
   - `GameConfig.version` i `<title>`: „Reloaded V1.0 — Dyplomacja” (sprawdź, czy myślnik nie psuje porównania wersji w grze sieciowej);
   - duża karta „Co nowego” podsumowująca cały tryb (zastępuje karty Preview, które przenieś do historii);
   - `README.md`: opis wydania jak przy poprzednich wersjach;
   - w lobby sieciowym tryb Dyplomacja nadal niedostępny (zaplanowany na później) — informacja zamiast przycisku.

TESTY I KRYTERIA UKOŃCZENIA
- Wszystkie testy z `tests/` przechodzą, w tym test dymny Klasycznego.
- Ręcznie: pełny mecz Dyplomacji na każdej nowej mapie od startu do ekranu końcowego; zapis i wczytanie w trakcie.
- Brak błędów w konsoli; płynność na „Kontynencie” jak w Etapie 4a lub lepsza.

NA KONIEC
Zaktualizuj `docs/DYPLOMACJA.md` (stan: wydane; pomysły na V1.x: Dyplomacja w grze sieciowej, mosty jako budynki, wasale), commit, push, PR.
```
