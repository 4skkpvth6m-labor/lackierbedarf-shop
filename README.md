# Lackierbedarf – B2B-Shop

Shop für Lackiererbedarf (Abdeckmaterial, Klebeband, Lackierpistolen, Schleifmittel …) mit
Kunden-Freigabe und individuellen Rabatten pro Kunde und Kategorie.

**Technik:** Next.js 16 · Supabase (Datenbank + Login) · Tailwind CSS · Hosting z. B. auf Vercel

## So funktioniert der Shop

| Wer | Was passiert |
|---|---|
| Besucher | sieht den Katalog **ohne Preise** und kann ein Kundenkonto beantragen |
| Neuer Kunde | registriert sich mit Firmendaten → Status **„Wartet auf Freigabe“**, weiterhin keine Preise |
| Du (Admin) | gibst den Kunden unter **Admin → Kunden & Rabatte** frei und trägst seine Rabatte ein |
| Freigegebener Kunde | sieht bei jedem Artikel den **Listenpreis** (durchgestrichen) und daneben **„Ihr Preis“**, kann bestellen |

### Rabatte
Pro Kunde:
- **Rabatt auf alles** (z. B. 10 %) gilt für jede Kategorie ohne Häkchen.
- **Häkchen bei einer Kategorie** → eigener Rabatt nur für diese Kategorie (z. B. Lackierpistolen 20 %).
- „Allen angehakten Kategorien __ % geben“ setzt mehrere Kategorien auf einmal.
- „alle Häkchen entfernen“ → überall wieder der Rabatt auf alles.

Bestellungen speichern Listenpreis, Rabatt und Einzelpreis zum Bestellzeitpunkt. Spätere
Preisänderungen verändern alte Bestellungen also nicht.

### Artikel & Preise
- Der Katalog „Lackzubehör 2021“ ist importiert: **2.566 Artikel** in 10 Kategorien (`data/artikel.csv`).
- Im PDF stehen **keine Preise**. Listenpreise trägst du ein unter
  - **Admin → Artikel & Preise** (einzeln, Filter „nur ohne Preis“), oder
  - **Admin → Import**: Artikelliste als CSV herunterladen, in Excel die Spalte `listenpreis`
    füllen, als CSV speichern und wieder hochladen.
- Artikel ohne Preis werden als „auf Anfrage“ angezeigt.

## Einrichtung

### 1. Supabase
1. Projekt auf [supabase.com](https://supabase.com) anlegen.
2. Im **SQL Editor** nacheinander ausführen:
   1. `supabase/migrations/001_schema.sql` (Tabellen, Kategorien)
   2. `supabase/seed.sql` (die 2.566 Katalogartikel)
3. **Authentication → URL Configuration**: Site URL = deine Shop-Adresse.

### 2. Umgebungsvariablen
`.env.example` nach `.env.local` kopieren (lokal) bzw. in Vercel eintragen:
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API)
- `NEXT_PUBLIC_SITE_URL` – Adresse des Shops
- optional `RESEND_API_KEY`, `SHOP_OWNER_EMAIL`, `MAIL_FROM` – E-Mails bei neuer Anmeldung,
  Freigabe und Bestellung (über [resend.com](https://resend.com)). Ohne diese Angaben läuft alles,
  nur ohne E-Mails.

### 3. Admin
`dkalina25@icloud.com` wird bei der Registrierung automatisch Admin (Tabelle `admin_emails`).
Weitere Admins: Adresse in `admin_emails` eintragen, oder bei bestehendem Konto im Supabase SQL Editor:
```sql
update public.profiles set is_admin = true, status = 'approved' where email = 'deine@email.de';
```

### 4. Starten
```bash
npm install
npm run dev        # lokal auf http://localhost:3000
```
Für Vercel: Repository importieren, Umgebungsvariablen setzen und deployen.

## Sicherheit
Alle Tabellen haben Row Level Security ohne öffentliche Policies. Preise, Rabatte und Bestellungen
werden ausschließlich serverseitig gelesen, und nur nach Prüfung von Login, Freigabe bzw.
Admin-Rechten. Mit dem öffentlichen Anon-Key lassen sich keine Daten abfragen.

## Katalog neu einlesen
`data/artikel.csv` bearbeiten, dann `npm run seed:sql` und `supabase/seed.sql` erneut ausführen.
Vorhandene Listenpreise bleiben dabei erhalten, wenn die CSV keinen Preis enthält.
