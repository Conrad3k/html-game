# Artificial-Battles
Gra w jednym pliku HTML

Najnowsze wydanie: **Artificial Battles - Reloaded V1.0.html** (otwórz w przeglądarce, działa offline).

**Artificial Battles: Reloaded V1.0 by Conrad3k** — pierwsze wydanie nowej odsłony gry, na silniku **Raptor**.
Na początek całkiem nowy wygląd. Menu główne zaprojektowane od zera: pasek zakładek u góry z płynnie przesuwanym
wskaźnikiem, ekran nowej bitwy z podglądem mapy (kraina, ukształtowanie i rozmiar zmieniają się na żywo, róg startowy
wybiera się klikiem), podsumowaniem meczu i przyciskiem startu zawsze na widoku, ustawienia w sekcjach Nacje i drużyny,
Świat i Zasady, encyklopedia jednostek i budynków z wyszukiwarką i filtrem er, zakładka „Jak grać” ze skrótami w tabelach
i zwinięta historia wydań. W tle świat gry z lotu ptaka — przygaszona mapa, która powoli dryfuje i zmienia się razem
z wybraną krainą. Odświeżony jest też interfejs w grze (te same miejsca, czystsza forma), a nowe pismo — Inter i Cinzel —
jest osadzone w pliku. Rozgrywka, jednostki, budynki i balans są takie same jak w V3.5.

Poprzednie wydanie, V3.5, przyniosło osiem nowych jednostek (m.in. Wielkie Działo, Koń Trojański, Król, Wóz kupiecki
i Lisowczyk), Cud Świata i Plantację Jabłek, warunki zwycięstwa do wyboru, obronę królestwa, AI z dowódcą, nowy dźwięk
i ok. 3× szybszą symulację silnika Raptor.

**Nowy tryb główny: Dyplomacja** (wczesna wersja) — osobny od Klasycznego meczu, który został w menu jako druga opcja.
Kontynent 11 400 × 11 400 kroków (ok. 5× powierzchni mapy Gigantycznej) z rzekami, brodami, pasmami gór i jeziorami,
do 8 nacji, relacje wojna / pokój / sojusz zmieniające się w trakcie gry (panel Dyplomacji pod klawiszem Tab), nowa SI
dyplomaty i gra wieloosobowa. Silnik Raptor dostał zestaw funkcji pod wielkie mapy: generator kontynentów Raptor Atlas,
strumieniowanie terenu, indeks wody i gór oraz pozycje sieciowe dla map powyżej 8191 kroków.

**Aktualizacja (testy trybów)**: oba tryby przeszły serię automatycznych meczów SI kontra SI. W Dyplomacji SI nie rzuca się już
całą gromadą na najsłabszą nację tuż po rozejmie, walczy głównie z sąsiadami, nie zamiera w sieci sojuszy, reaguje wojną na Cud Świata
nacji spoza sojuszu, a zwycięstwo sojuszu wymaga, by wielki sojusz przetrwał 2 minuty. Poprawione potwierdzenie wojny w panelu Dyplomacji.
Silnik Raptor: jednostki nie wpadają już w wolny tryb pól przeglądarki, a regiony osiągalności są łatane w miejscu zmiany — symulacja
ok. 2,9× szybsza w kampanii 6 nacji i 2× w klasycznym meczu.

**Aktualizacja V1.0 — Dyplomacja**: jasne warunki zwycięstwa na widoku (panel Tab: Podbój, Sojusz, Cud Świata,
Limit czasu — z bieżącym stanem i odliczaniem na ekranie), Sojusz zwycięzców najwyżej połowy nacji, który musi przetrwać
3 minuty jako jedyny, nowa opcja Limit czasu (domyślnie 30 min, do wyboru 45 / 60 / brak — potem wygrywa najwyższy Wynik), pokój za okup i żądania
trybutu, mądrzejsza SI dyplomaty (sąsiedztwo, księga strat i zmęczenie wojną, hegemon i koalicje, reakcja na Cud Świata,
zdrady w końcówce) i lepszy teren (morze o poszarpanym brzegu, Złote wzgórza ze spornymi złożami, zapas surowców przy
każdej stolicy). Partia trwa zwykle 20–30 minut.

**Aktualizacja V1.0 — Cuda Świata**: cztery unikatowe Cuda (każdy tylko raz na mapie) — Wiszące Ogrody, Kolos i Wielka
Biblioteka w III erze z własnymi premiami oraz Wielka Bazylika w IV erze. Ukończone Cuda co sekundę dają drużynie Chwałę;
1000 Chwały = zwycięstwo (od Poselstw: 2000). Zburzenie Cudu odbiera właścicielowi 25% Chwały, a burzącemu daje 100. Paski Chwały na ekranie,
nowa SI budująca i zwalczająca Cuda. Działa w obu trybach.

**Aktualizacja V1.0 — Poselstwa**: rozmowy z władcami w trybie Dyplomacja. Każdą nacją SI rządzi władca z imieniem
i charakterem (Ostrożny, Ambitny, Porywczy, Chciwy, Wyrachowany), który mówi po swojemu i pamięta, za co was lubi albo nie lubi.
W rozmowie (Tab → „Rozmowa”) dochodzą pakt o nieagresji, handel surowcami, dary, prośby o wspólną wojnę (władca może podać cenę),
wywiad i pomoc sojusznika. Zamiast suchej odmowy SI składa kontroferty, np. pokój za okup. Sama też przychodzi z ofertami handlu,
paktami, darami, ostrzeżeniami i wezwaniami do broni. Cuda Świata są trudniejsze: zwycięstwo wymaga 2000 Chwały, a oblężony Cud
(wrogie wojsko pod nim albo atak w ciągu ostatnich 20 s) nie daje Chwały. Kafelki warunków zwycięstwa w menu Dyplomacji opisują jej prawdziwe zasady
(nowy przełącznik Sojusz zwycięzców, Limit czasu wśród warunków).

Gra wieloosobowa (protokół 10): wszyscy gracze muszą mieć to samo (najnowsze) wydanie pliku Reloaded V1.0. Szczegóły: menu gry → „Co nowego”.
