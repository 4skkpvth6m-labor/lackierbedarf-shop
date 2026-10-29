import ImportForm from "./ImportForm"
import StartCatalogButton from "./StartCatalogButton"

export default function ImportPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Import & Export</h1>
      <section className="card space-y-3 p-6">
        <h2 className="text-lg font-bold">Startkatalog</h2>
        <p className="text-sm text-slate-600">Spielt alle Artikel aus dem Katalog „Lackzubehör“ ein. Kann gefahrlos mehrfach ausgeführt werden – eingetragene Listenpreise werden nicht überschrieben.</p>
        <StartCatalogButton />
      </section>
      <section className="card space-y-3 p-6">
        <h2 className="text-lg font-bold">1. Aktuelle Artikelliste herunterladen</h2>
        <p className="text-sm text-slate-600">Enthält alle Artikel mit Listenpreis. In Excel öffnen, Preise in der Spalte <b>listenpreis</b> eintragen und als CSV speichern.</p>
        <a href="/admin/export" className="btn-secondary">Artikelliste herunterladen (CSV)</a>
      </section>
      <section className="card space-y-3 p-6">
        <h2 className="text-lg font-bold">2. CSV hochladen</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Pflichtspalte: <code>artikelnummer</code>. Optional: <code>listenpreis</code>, <code>bestellnummer</code>, <code>name</code>, <code>variante</code>, <code>kategorie</code>, <code>marke</code>, <code>aktiv</code>.</li>
          <li>Leere Zellen lassen den bisherigen Wert unverändert – eine Liste nur mit <code>artikelnummer;listenpreis</code> reicht für Preisupdates.</li>
          <li>Unbekannte Artikelnummern werden neu angelegt (dafür werden <code>name</code> und <code>kategorie</code> benötigt).</li>
          <li>Trennzeichen Semikolon oder Komma; Preise als „12,50“ oder „12.50“.</li>
        </ul>
        <ImportForm />
      </section>
    </div>
  )
}
