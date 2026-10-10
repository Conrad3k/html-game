# Artificial-Battles
Gra w jednym pliku HTML

Najnowsze wydanie: **Artificial Battles - Reloaded V1.0.html** (otwórz w przeglądarce, działa offline).

**Artificial Battles: Reloaded V1.0 by Conrad3k** — pierwsze wydanie nowej odsłony gry, na silniku **Raptor**.
Nowy tryb główny **Dyplomacja**, cztery **Cuda Świata** ze zwycięstwem Chwałą, **zapis i wczytywanie gry**, menu i interfejs
zaprojektowane od nowa oraz szybszy silnik. **Klasyczny mecz** został w menu jako druga opcja — jednostki i balans jak w V3.5,
nowością są w nim Cuda Świata, Chwała i Triumf.

**Zapis i wczytywanie gry** — w menu pauzy (Esc) „Zapisz grę” / „Wczytaj grę”, w menu głównym „Wczytaj grę”.
Zapis obejmuje cały stan bitwy: jednostki z rozkazami, budowy, badania, surowce, pociski w locie, plany SI, relacje
i opinie w Dyplomacji, odkrytą mapę, porę dnia i ślady bitew. Szybki zapis F5 / wczytanie F9, autozapis co 5 minut gry,
eksport zapisu do pliku `.absave` i wczytanie go z pliku. Zapisy są kompresowane i trzymane w pamięci przeglądarki
(IndexedDB). Działa w obu trybach gry solo (gry wieloosobowej i samouczka się nie zapisuje).

**Dyplomacja** — kontynent 11 400 × 11 400 kroków (ok. 5× powierzchni mapy Gigantycznej) z rzekami, brodami, morzem
o poszarpanym brzegu, pasmami gór i Złotymi wzgórzami, do 8 nacji i relacje wojna / pokój / sojusz zmieniające się w trakcie
gry. Cztery drogi do zwycięstwa: podbój, Sojusz zwycięzców (najwyżej połowa nacji, 3 minuty jako jedyni), Cuda Świata
(1000 Chwały i 5-minutowy Triumf) i limit czasu (domyślnie 45 min, wygrywa najwyższy Wynik). Pokój za okup, żądania trybutu z traktatem,
hegemon i koalicje, SI dyplomaty z cierpliwością, księgą strat i zmęczeniem wojną. Partia trwa zwykle 25–45 minut.
Panel Dyplomacji (Tab) to czytelna lista kart pogrupowanych według relacji z tobą — z warunkami zwycięstwa, opinią
o tobie, siłą, siecią wojen i sojuszy każdej nacji, propozycjami i trybutami oraz kroniką. Każda nacja ma **portret
władcy**: herb w swoim kolorze oraz imię z tytułem i przydomkiem (np. Książę Bolesław Śmiały).

**Cuda Świata** — Wiszące Ogrody, Kolos i Wielka Biblioteka (III era) oraz Wielka Bazylika (IV era), każdy tylko raz na mapie
i z własną premią. Ukończone Cuda dają drużynie Chwałę co sekundę (każdy kolejny Cud 70%) — ale nie, gdy są oblężone albo
właściciel nie ma Ratusza. 1000 Chwały otwiera 5-minutowy Triumf: oblężenie go wstrzymuje, a utrata Cudu przerywa i zabiera
40% Chwały; kto go przetrwa, wygrywa. SI broni własnych Cudów (wieże, odsiecz), oblega cudze i zawiera koalicje przeciw
liderowi Chwały, a w Dyplomacji Cuda budzą zazdrość innych nacji.

**Nowy wygląd** — menu z paskiem zakładek, ekran nowej bitwy z podglądem mapy, ustawienia w sekcjach Nacje / Świat / Zasady,
encyklopedia z wyszukiwarką, „Jak grać” ze skrótami, dryfujące tło z mapą świata i odświeżony interfejs w grze
(pismo Inter i Cinzel osadzone w pliku).

**Silnik Raptor** — generator kontynentów Raptor Atlas, strumieniowanie terenu, indeks wody i gór, ok. 2–3× szybsza
symulacja oraz zapis stanu gry sprawdzony testem „zapis → wczytanie → zapis daje identyczny stan”.

Gra wieloosobowa: wszyscy gracze muszą mieć to samo (najnowsze) wydanie pliku Reloaded V1.0 (protokół 9). Szczegóły: menu gry → „Co nowego”.
