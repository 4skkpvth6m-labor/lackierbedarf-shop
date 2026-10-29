import Link from "next/link"
import { requireUser } from "@/lib/auth"
import { STATUS_LABEL } from "@/lib/types"

export default async function AccountPage() {
  const p = await requireUser()
  const badge =
    p.status === "approved" ? "bg-green-100 text-green-800" : p.status === "pending" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Mein Konto</h1>
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <span className="text-sm text-slate-600">Status:</span>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${badge}`}>{STATUS_LABEL[p.status]}</span>
        </div>
        {p.status === "pending" && (
          <p className="text-sm text-slate-700">
            Danke für deine Anmeldung! Wir prüfen deine Angaben und schalten dein Konto so schnell wie möglich frei. Bis dahin
            kannst du den <Link href="/katalog" className="text-brand-600 underline">Katalog</Link> schon ansehen – Preise
            werden nach der Freigabe angezeigt.
          </p>
        )}
        {p.status === "rejected" && <p className="text-sm text-slate-700">Dein Konto wurde nicht freigegeben. Bitte melde dich bei Fragen direkt bei uns.</p>}
        {p.status === "approved" && (
          <p className="text-sm text-slate-700">
            Dein Konto ist freigegeben. Im <Link href="/katalog" className="text-brand-600 underline">Katalog</Link> siehst du neben
            dem Listenpreis jetzt deinen persönlichen Preis.
          </p>
        )}
      </div>
      <div className="card p-6">
        <h2 className="mb-3 font-semibold">Firmendaten</h2>
        <dl className="grid grid-cols-[10rem_1fr] gap-y-1 text-sm">
          <dt className="text-slate-500">Firma</dt><dd>{p.company}</dd>
          <dt className="text-slate-500">Ansprechpartner</dt><dd>{p.contact_name}</dd>
          <dt className="text-slate-500">Adresse</dt><dd>{p.street}, {p.zip} {p.city}</dd>
          <dt className="text-slate-500">Telefon</dt><dd>{p.phone || "–"}</dd>
          <dt className="text-slate-500">USt-IdNr.</dt><dd>{p.vat_id || "–"}</dd>
          <dt className="text-slate-500">E-Mail</dt><dd>{p.email}</dd>
          {p.customer_no && (<><dt className="text-slate-500">Kundennummer</dt><dd>{p.customer_no}</dd></>)}
        </dl>
        <p className="mt-4 text-xs text-slate-500">Änderungen an deinen Firmendaten teile uns bitte kurz mit.</p>
      </div>
    </div>
  )
}
