# Artificial-Battles
Gra w jednym pliku HTML

Najnowsze wydanie: **Artificial Battles - Reloaded V1.0.html** (otwórz w przeglądarce, działa offline).

**Artificial Battles: Reloaded V1.0 by Conrad3k** — pierwsze wydanie nowej odsłony gry, na silniku **Raptor**.
Nowy tryb główny **Dyplomacja**, **zapis i wczytywanie gry**, menu i interfejs zaprojektowane od nowa oraz szybszy silnik.
**Klasyczny mecz** został w menu jako druga opcja — jednostki, budynki i balans są takie same jak w V3.5.

**Zapis i wczytywanie gry** — w menu pauzy (Esc) „Zapisz grę” / „Wczytaj grę”, w menu głównym „Wczytaj grę”.
Zapis obejmuje cały stan bitwy: jednostki z rozkazami, budowy, badania, surowce, pociski w locie, plany SI, relacje
i opinie w Dyplomacji, odkrytą mapę, porę dnia i ślady bitew. Szybki zapis F5 / wczytanie F9, autozapis co 5 minut gry,
eksport zapisu do pliku `.absave` i wczytanie go z pliku. Zapisy są kompresowane i trzymane w pamięci przeglądarki
(IndexedDB). Działa w obu trybach gry solo (gry wieloosobowej i samouczka się nie zapisuje).

**Dyplomacja** — kontynent 11 400 × 11 400 kroków (ok. 5× powierzchni mapy Gigantycznej) z rzekami, brodami, pasmami gór
i jeziorami, do 8 nacji, relacje wojna / pokój / sojusz zmieniające się w trakcie gry, SI dyplomaty, która walczy głównie
z sąsiadami i szuka sojuszników, oraz zwycięstwo podbojem albo wielkim sojuszem (musi przetrwać 2 minuty).
Panel Dyplomacji (Tab) to czytelna lista kart pogrupowanych według relacji z tobą — z opinią o tobie, siłą, siecią
wojen i sojuszy każdej nacji, propozycjami i kroniką. Każda nacja ma **portret władcy**: herb w swoim kolorze oraz
imię z tytułem i przydomkiem (np. Książę Bolesław Śmiały), także w tabeli nacji i na ekranie wyników.

**Nowy wygląd** — menu z paskiem zakładek, ekran nowej bitwy z podglądem mapy, ustawienia w sekcjach Nacje / Świat / Zasady,
encyklopedia z wyszukiwarką, „Jak grać” ze skrótami, dryfujące tło z mapą świata i odświeżony interfejs w grze
(pismo Inter i Cinzel osadzone w pliku).

**Silnik Raptor** — generator kontynentów Raptor Atlas, strumieniowanie terenu, indeks wody i gór, ok. 2–3× szybsza
symulacja oraz zapis stanu gry sprawdzony testem „zapis → wczytanie → zapis daje identyczny stan”.

Gra wieloosobowa: wszyscy gracze muszą mieć to samo (najnowsze) wydanie pliku Reloaded V1.0. Szczegóły: menu gry → „Co nowego”.
