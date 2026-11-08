# 🎮 Steam Library CSV Export

Ein Zero-Trust, Local-First Extraktionswerkzeug, um die eigene Steam-Bibliothek vollständig als `.csv`-Datei zu exportieren – ohne externe APIs, ohne Drittanbieter-Tools und ohne Datenabfluss.

## 🛡️ Security by Design (Zero Trust)
Das Ausführen von fremdem Code in der Browser-Konsole (Self-XSS) ist ein legitimer Angriffsvektor. Dieses Skript wurde mit einem strikten Security-by-Design-Ansatz entwickelt, um absolute Autarkie und Datensouveränität zu garantieren:
* **Kein Netzwerkverkehr:** Das Skript enthält keine `fetch()`- oder `XMLHttpRequest`-Aufrufe. Es funkt nicht nach Hause.
* **Keine API-Keys:** Es ist keine Registrierung bei der Steam Web API nötig.
* **Lokaler RAM-Scan:** Es liest ausschließlich den bereits geladenen React-Fiber-Speicherbaum (`window.SSR`) des lokalen Browsers aus.
* **Isolierter Export:** Die `.csv`-Datei wird über einen lokalen `Blob` direkt im Arbeitsspeicher generiert und lokal heruntergeladen. 

## ⚙️ Anwendung (Die Extraktion)

1. Öffne Google Chrome (oder einen Chromium-basierten Browser).
2. Logge Dich bei Steam ein und navigiere zu Deiner vollständigen Spieleliste:
   `https://steamcommunity.com/id/DEINE_STEAM_ID/games/?tab=all`
3. Scrolle einmal bis zum Ende der Seite, um sicherzustellen, dass alle Lizenzen in den Arbeitsspeicher geladen wurden.
4. Drücke **F12**, um die Entwicklerwerkzeuge (DevTools) zu öffnen.
5. Wechsle in den Reiter **Console** (Konsole).
6. Kopiere den gesamten Code aus der Datei [`extractor.js`](extractor.js).
7. Füge den Code in die Eingabezeile der Konsole ein und drücke **Enter**.

Der Download der Datei `Steam_Katalog_Komplett.csv` startet augenblicklich.

## 📊 Das Datenformat
Die generierte CSV-Datei ist portabel und frei von Vendor-Lock-in. Sie enthält folgende strukturierte Metadaten für tiefergehende Analysen:

| Spalte | Typ | Beschreibung |
| :--- | :--- | :--- |
| `App-ID` | Integer | Die eindeutige Steam-ID (Primärschlüssel) |
| `Titel` | String | Der Name des Spiels (Sonderzeichen escapet) |
| `Spielzeit_Stunden` | Float | Gesamtspielzeit in Stunden (z.B. `206.1`) |
| `Spielzeit_Minuten` | Integer | Gesamtspielzeit in Minuten (Rohwert) |
| `Zuletzt_Gespielt` | Date | ISO-Datum (YYYY-MM-DD) der letzten Sitzung |

## 🤝 Souveränität
Dieses Tool entstand aus dem Leitgedanken, weil man als Gamer nie so richtig weiß was man zocken will(Ein Wald, viele Bäume). Nutze die generierte CSV-Datei, um Deine Bibliothek zu analysieren, damit auch Du Deiner nächsten Gaming Erfahrung z.B. durch Zufall bestimmst. Möge das Glück und die besten Spiele dieser Welt in Deinem Schicksal auf ewig mit Dir mit laufen!
