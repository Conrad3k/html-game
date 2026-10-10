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
5-minutowy Triumf) i limit czasu (domyślnie 45 min, wygrywa najwyższy Wynik). Partia trwa zwykle 25–45 minut.

**Dyplomacja z głębią** — stosunek każdej nacji do innej to suma konkretnych powodów: pamięci (napaść, zdrada, dary,
pokój, odmowy, pomoc w wojnie albo jej brak, zerwane umowy — każda sprawa blednie we własnym tempie) i sytuacji
(wspólny wróg, handel, pakt, spór o granice, sympatia władców, strach przed hegemonem i przed Chwałą rywala). Nowe
dźwignie: **umowa handlowa** (złoto co minutę dla obu stron), **pakt o nieagresji** (6 minut bez wojny), **dar** surowców
i **wezwanie do wspólnej wojny**; dalej pokój za okup, trybut i sojusze. SI ocenia wszystkich według tych samych reguł
(bez nagonki na gracza), handluje, zawiera pakty i sojusze także między sobą, a na Cuda rywala reaguje dopiero przy
realnym zagrożeniu — w Dyplomacji Chwała rośnie wolniej (60%).

**Ekran Dyplomacji (Tab)** — mapa relacji: kontynent z herbami nacji w stolicach i liniami wojen, sojuszy, handlu
i paktów; pod nią „Kto z kim trzyma” (bloki sojusznicze i wojny) i kronika. Karta każdej nacji: stosunek do ciebie
z rozpisanymi powodami, jej sojusze, wojny i umowy, siła, propozycje z paskiem **gotowości** (czy SI je przyjmie,
a jeśli nie — czego brakuje), dar, zerwanie umów i wojna. Przegląd: jak widzą cię wszystkie nacje i twoje umowy.
Propozycje SI pojawiają się w rogu ekranu jako karty z przyciskami.

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
pewniej łączy graczy w jednej sieci (więcej adresów lokalnych w kodzie, wskazówki przy niepowodzeniu; protokół 13)
oraz przez internet: obie strony ponawiają próby połączenia, aż wstanie, więc kod można przesyłać nawet kilka minut.
Powrót gracza po rozłączeniu działa pewnie: host może zaprosić go ponownie już po kilku sekundach, łącze hosta ponawia
próby przez pełne 2 minuty, a wracający gracz nie uznaje połączenia za zerwane, gdy świat przesyła się wolniej.

**Nowy wygląd i silnik Raptor** — menu z paskiem zakładek, podglądem mapy i encyklopedią, spokojniejszy interfejs w grze
(pismo Inter i Cinzel osadzone w pliku), generator kontynentów Raptor Atlas, strumieniowanie terenu i ok. 2–3× szybsza
symulacja.
Szczegóły: menu gry → „Co nowego”.
