# Zen Media Tools

Zwei getrennte Extensions für Zen (und Firefox):

| | Was | Wo |
|---|---|---|
| **Grab** (`grab/`) | Bilder und Videos in Originalqualität herunterladen, direkt in *Downloads* | Pinterest, Are.na |
| **Pin It** (`pinit/`) | Bilder auf Pinterest speichern (Pinterests eigener Dialog mit Pinnwand-Auswahl) | jede Website |

## Bedienung
**Grab:** Über ein Bild oder Video fahren → runder Button (Pinterest unten links, Are.na oben rechts). Oder Rechtsklick → *Original herunterladen*.
- Pinterest: Originalbild, Videos als MP4, Karussell- und Idea-Pins mit allen Seiten.
- Are.na: Originalbild, hochgeladene Videos/Dateien. Eingebettete YouTube-/Vimeo-Videos gehen nicht.

**Pin It:** Über ein Bild fahren → *Pin* oben links. Oder Rechtsklick → *Auf Pinterest speichern*. Oder Symbol in der Toolbar → Auswahl aller Bilder der Seite.

## Installieren
Neueste `.xpi` aus den [Releases](https://github.com/louisdotxyz/zen-media-tools/releases) in Zen öffnen. Danach aktualisieren sich beide automatisch (sofort prüfen: `about:addons` → Zahnrad → *Nach Updates suchen*).

## Neue Version veröffentlichen
`version` in `grab/manifest.json` oder `pinit/manifest.json` erhöhen und auf `main` pushen. Die Action testet, signiert bei Mozilla (unlisted), legt ein Release an (`grab-vX.Y.Z` / `pinit-vX.Y.Z`) und trägt es in `<ext>/updates.json` ein.

Einmalig: Repo-Secrets `AMO_JWT_ISSUER` und `AMO_JWT_SECRET` (gleiche Mozilla-Schlüssel wie bei der Claude Sidebar).

Test: `node tests/lib.test.js` · Lokal ausprobieren: `about:debugging#/runtime/this-firefox` → *Temporäres Add-on laden* → `manifest.json`.
