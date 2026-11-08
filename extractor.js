// Datei: extractor.js
// Repository: steam-library-csv-export
// Ausführung: Google Chrome DevTools (F12) -> Console auf der Steam "All Games" Ansicht z.B.: https://steamcommunity.com/id/your_ID_Here/games/?tab=all
(function() {
    // [Sicherheits-Audit]
    // Dieses Skript führt KEINE externen Netzwerkanfragen (weder fetch noch XMLHttpRequest) aus.
    // Es liest ausschließlich den lokalen Arbeitsspeicher (RAM) des laufenden Browsers aus
    // und generiert einen lokalen Download. Es verlassen keine Daten den lokalen Rechner.

    // Ein WeakSet verhindert Endlosschleifen ("Maximum call stack size exceeded").
    // React-Fiber-Objekte referenzieren sich im Speicher oft gegenseitig (Eltern- zu Kind-Knoten und zurück).
    // Das WeakSet merkt sich jede bereits besuchte Speicheradresse, um sie nicht doppelt zu scannen.
    const visited = new WeakSet();
    let foundGames = null;

    // Die Kernfunktion: Ein rekursiver Deep-Memory-Scanner.
    // Anstatt sich auf feste Variablennamen zu verlassen (die Valve jederzeit ändern könnte),
    // suchen wir heuristisch nach der Datenstruktur der Spieleliste selbst (Duck Typing).
    function deepScan(obj, depth = 0) {
        // Abbruchbedingungen: Maximale Suchtiefe erreicht, kein Objekt, oder ungültiger Typ.
        if (!obj || typeof obj !== 'object' || depth > 35) return null;
        
        // Wir ignorieren native DOM-Knoten und Fenster-Objekte, da die Daten im JavaScript-Heap (V8) liegen.
        if (obj instanceof Node || obj instanceof Window || obj instanceof Event) return null;
        
        // Wenn der Speicherknoten bereits gescannt wurde, brechen wir ab (Zirkelbezugsschutz).
        if (visited.has(obj)) return null;
        visited.add(obj);

        // [Signatur-Erkennung]
        // Wir prüfen, ob das aktuelle Objekt ein Array mit mindestens 20 Einträgen ist.
        // Dann testen wir ein Stichproben-Element auf die typischen Steam-Datenbank-Attribute ('appid' und 'name').
        if (Array.isArray(obj) && obj.length >= 20) {
            const sample = obj[0];
            if (sample && typeof sample === 'object' && 
               ('appid' in sample || 'app_id' in sample || 'appID' in sample) && 
               ('name' in sample || 'strName' in sample)) {
                return obj; // Zielobjekt (das Array mit allen Spielen) im RAM gefunden!
            }
        }

        // Falls es nicht das Array ist, iterieren wir über alle Unter-Eigenschaften dieses Objekts.
        let keys;
        try { keys = Object.keys(obj); } catch (e) { return null; }

        for (let key of keys) {
            let val;
            try { val = obj[key]; } catch (e) { continue; }

            // Steam verkapselt die Init-Daten teilweise zusätzlich als JSON-String.
            // Wir fangen große Strings ab, die nach Steam-App-Daten aussehen, und parsen sie.
            if (typeof val === 'string' && val.length > 100 && (val.includes('"appid"') || val.includes('Cyberpunk'))) {
                try {
                    const parsed = JSON.parse(val);
                    const res = deepScan(parsed, depth + 1);
                    if (res) return res;
                } catch (e) {}
            } 
            // Bei verschachtelten Objekten tauchen wir eine Ebene tiefer in den Speicherbaum ab.
            else if (typeof val === 'object' && val !== null) {
                const res = deepScan(val, depth + 1);
                if (res) return res;
            }
        }
        return null; // Nichts in diesem Zweig gefunden.
    }

    console.log("Starte Vektor 1: Scan von window.SSR (Server-Side-Rendering State)...");
    if (window.SSR) foundGames = deepScan(window.SSR);

    // Fallback-Protokoll, falls window.SSR maskiert ist.
    if (!foundGames) {
        console.log("Starte Vektor 2: Direkter Eingriff in den React-Fiber-Speicherbaum...");
        // Wir suchen alle HTML-Elemente ab und greifen in ihre internen React-Status-Eigenschaften (__react...).
        const allElements = document.querySelectorAll('*');
        for (let el of allElements) {
            const reactKeys = Object.keys(el).filter(k => k.startsWith('__react'));
            for (let rk of reactKeys) {
                foundGames = deepScan(el[rk]);
                if (foundGames) break;
            }
            if (foundGames) break;
        }
    }

    if (!foundGames) {
        console.error("Forensischer Befund: Array im Heap nicht lokalisierbar. Bitte Seite neu laden und ganz nach unten scrollen.");
        return;
    }

    console.log(`Zielobjekt im RAM isoliert: ${foundGames.length} Lizenzen erkannt. Beginne CSV-Konvertierung.`);

    // [Formatierung & Sanitization]
    // Initialisierung des standardkonformen CSV-Headers.
    let csv = "App-ID,Titel,Spielzeit_Stunden,Spielzeit_Minuten,Zuletzt_Gespielt\n";
    
    foundGames.forEach(g => {
        let appId = g.appid ?? g.app_id ?? g.appID ?? 0;
        let rawName = g.name ?? g.strName ?? "Unbekannt";
        
        // Escapen von doppelten Anführungszeichen im Spieletitel (z.B. bei "Director's Cut"), 
        // um die CSV-Struktur nicht zu kompromittieren.
        let safeTitle = String(rawName).replace(/"/g, '""');
        
        let mins = g.playtime_forever ?? g.playtime ?? 0;
        let hours = (mins / 60).toFixed(1);
        let rtime = g.rtime_last_played ?? g.rt_last_played ?? 0;
        
        // Konvertierung des Unix-Timestamps in das maschinenlesbare ISO-Format (YYYY-MM-DD).
        let lastPlayed = rtime > 0 
            ? new Date(rtime * 1000).toISOString().split('T')[0] 
            : "Nie";
            
        // Zeile zur CSV hinzufügen, alle Felder sicherheitshalber in Anführungszeichen gefasst.
        csv += `"${appId}","${safeTitle}","${hours}","${mins}","${lastPlayed}"\n`;
    });

    // [Lokaler Datei-Export (Zero Trust)]
    // Wir erzeugen einen binären Datenblock (Blob) direkt im Arbeitsspeicher des Browsers.
    let blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    let link = document.createElement("a");
    
    // URL.createObjectURL generiert einen rein lokalen 'blob:'-URI, der keinerlei externe Server kontaktiert.
    link.href = URL.createObjectURL(blob);
    link.download = "Steam_Katalog_Komplett.csv";
    
    // Das unsichtbare Element wird in den DOM gehängt, angeklickt und zur Spurenbeseitigung sofort zerstört.
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("Extraktion zu 100% lokal abgeschlossen: 'Steam_Katalog_Komplett.csv' wurde auf dem Host gesichert.");
})();
