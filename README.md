# Artificial-Battles
Gra w jednym pliku HTML

Najnowsze wydanie: **Artificial Battles - Reloaded V1.0.html** (otwórz w przeglądarce, działa offline).

**Artificial Battles: Reloaded V1.0 by Conrad3k** — pierwsze wydanie nowej odsłony gry, na silniku **Raptor**.
Nowy tryb główny **Dyplomacja**, cztery **Cuda Świata** ze zwycięstwem Chwałą, **zapis i wczytywanie gry**, gra
wieloosobowa bez bety oraz menu i interfejs zaprojektowane od nowa. **Klasyczny mecz** został w menu jako druga opcja —
jednostki i balans jak w V3.5, nowością są w nim Cuda Świata, Chwała i Triumf.

**Dyplomacja** — kontynent 11 400 × 11 400 kroków (ok. 5× powierzchni mapy Gigantycznej) z rzekami, brodami, morzem,
górami i Złotymi wzgórzami, do 8 nacji i relacje wojna / pokój / sojusz zmieniające się w trakcie gry. Cztery drogi do
zwycięstwa: podbój, Sojusz zwycięzców (najwyżej połowa nacji, 3 minuty jako jedyni), Cuda Świata (1000 Chwały i
5-minutowy Triumf) i limit czasu (domyślnie 45 min, wygrywa najwyższy Wynik). Pokój za okup, trybut z traktatem,
hegemon i koalicje, SI dyplomaty z cierpliwością, księgą strat i zmęczeniem wojną. Partia trwa zwykle 25–45 minut.

**Panel Dyplomacji (Tab)** — warunki zwycięstwa jako krótkie pastylki ze stanem, nacje jako zwijane wiersze
pogrupowane według relacji z tobą (herb władcy, opinia o tobie, siła i jedna główna akcja; klik rozwija szczegóły i
pozostałe akcje), liczniki wojen, sojuszy i pokojów z ikonami na przycisku w górnym pasku, propozycje z przyciskami
Przyjmij / Odrzuć w rogu ekranu bez otwierania panelu i kronika zdarzeń. Komunikaty tylko o tym, co cię dotyczy —
wojny i traktaty innych nacji trafiają do kroniki. Pod nagłówkiem panelu twoja sytuacja w jednym zdaniu, przy nacjach
znacznik „może napaść”, a propozycje, sojusze i pokój mają własne łagodne dźwięki. Po rozejmie SI nie rusza wszystkimi
naraz: wojny wybuchają jedna po drugiej, a do gracza trafia najwyżej jedna propozycja naraz.

**Cuda Świata** — Wiszące Ogrody, Kolos i Wielka Biblioteka (III era) oraz Wielka Bazylika (IV era), każdy tylko raz na
mapie i z własną premią. Ukończone Cuda dają Chwałę (każdy kolejny 70%), ale nie gdy są oblężone albo właściciel nie ma
Ratusza. 1000 Chwały otwiera 5-minutowy Triumf: oblężenie go wstrzymuje, utrata Cudu przerywa i zabiera 40% Chwały.

**Zapis i wczytywanie gry** — w menu pauzy (Esc) i w menu głównym; cały stan bitwy, szybki zapis F5 / wczytanie F9,
autozapis co 5 minut gry, eksport do pliku `.absave` i wczytanie z pliku. Zapisy są kompresowane i trzymane w pamięci
przeglądarki (IndexedDB). Działa w obu trybach gry solo.

**Gra wieloosobowa (2–4 graczy)** — bez serwera: przeglądarki łączą się bezpośrednio (WebRTC) po wymianie dwóch
krótkich kodów. Działa między Windows, macOS i Linuksem oraz w Chrome, Edge, Firefoksie i Safari; na stronie Gra
wieloosobowa jest test sieci i opcjonalny własny serwer TURN. Wszyscy gracze muszą mieć to samo wydanie pliku.

**Testy przed premierą** — balans jednostek sprawdzony pojedynkami za równe koszty (słabszy Husarz, mocniejsi Muszkieter,
Grenadier i Arkebuzer), pokonana nacja nie zostawia już na mapie walczących dalej resztek wojska, a gra wieloosobowa
pewniej łączy graczy w jednej sieci (więcej adresów lokalnych w kodzie, wskazówki przy niepowodzeniu; protokół 12)
oraz przez internet: obie strony ponawiają próby połączenia, aż wstanie, więc kod można przesyłać nawet kilka minut.

**Nowy wygląd i silnik Raptor** — menu z paskiem zakładek, podglądem mapy i encyklopedią, spokojniejszy interfejs w grze
(pismo Inter i Cinzel osadzone w pliku), generator kontynentów Raptor Atlas, strumieniowanie terenu i ok. 2–3× szybsza
symulacja.
Szczegóły: menu gry → „Co nowego”.
