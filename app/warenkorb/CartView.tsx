"use client"

import Link from "next/link"
import { useEffect, useState, useTransition } from "react"
import { readCart, writeCart, type Cart } from "@/components/cart"
import { getCartLines, placeOrder, type CartLine } from "./actions"

const eur = (v: number | null) =>
  v == null ? "auf Anfrage" : v.toLocaleString("de-DE", { style: "currency", currency: "EUR" })

export default function CartView() {
  const [cart, setCart] = useState<Cart | null>(null)
  const [lines, setLines] = useState<CartLine[]>([])
  const [state, setState] = useState<"loading" | "ready" | "login" | "pending">("loading")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [orderId, setOrderId] = useState<number | null>(null)
  const [busy, start] = useTransition()

  useEffect(() => setCart(readCart()), [])
  useEffect(() => {
    if (!cart) return
    getCartLines(cart).then((res) => {
      if ("error" in res) setState(res.error === "login" ? "login" : "pending")
      else {
        setLines(res.lines)
        setState("ready")
      }
    })
  }, [cart])

  const update = (sku: string, qty: number) => {
    const next = { ...(cart ?? {}) }
    if (qty <= 0) delete next[sku]
    else next[sku] = qty
    writeCart(next)
    setCart(next)
  }

  if (orderId)
    return (
      <div className="card p-8 text-center">
        <h2 className="text-xl font-bold text-green-700">Vielen Dank für Ihre Bestellung!</h2>
        <p className="mt-2 text-slate-600">Bestellnummer #{orderId}. Wir melden uns in Kürze.</p>
        <Link href="/bestellungen" className="btn mt-6">Meine Bestellungen</Link>
      </div>
    )
  if (state === "loading") return <p className="text-slate-500">Lade Warenkorb…</p>
  if (state === "login")
    return <p className="card p-6">Bitte <Link href="/login" className="font-semibold text-brand-600 underline">melden Sie sich an</Link>, um zu bestellen.</p>
  if (state === "pending") return <p className="card p-6">Ihr Konto wartet noch auf Freigabe. Danach können Sie bestellen.</p>
  if (lines.length === 0)
    return <p className="card p-6">Ihr Warenkorb ist leer. <Link href="/katalog" className="font-semibold text-brand-600 underline">Zum Katalog</Link></p>

  const total = lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0)
  const onRequest = lines.some((l) => l.unitPrice == null)

  return (
    <div className="space-y-6">
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="table-head">
            <tr>
              <th className="px-3 py-2">Artikel</th>
              <th className="px-3 py-2 text-right">Listenpreis</th>
              <th className="px-3 py-2 text-right">Ihr Preis</th>
              <th className="px-3 py-2 text-center">Menge</th>
              <th className="px-3 py-2 text-right">Summe</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lines.map((l) => (
              <tr key={l.sku}>
                <td className="px-3 py-2">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-slate-600">{l.variant}</div>
                  <div className="font-mono text-xs text-slate-400">{l.sku}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-500">{eur(l.listPrice)}</td>
                <td className="whitespace-nowrap px-3 py-2 text-right">
                  <div className="font-semibold text-brand-700">{eur(l.unitPrice)}</div>
                  {l.discount > 0 && l.listPrice != null && <div className="text-xs text-green-700">−{l.discount.toLocaleString("de-DE")} %</div>}
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="number"
                    min={1}
                    value={l.quantity}
                    onChange={(e) => update(l.sku, Math.max(1, Number(e.target.value) || 1))}
                    className="input !w-20 text-right"
                    aria-label="Menge"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold">{eur(l.lineTotal)}</td>
                <td className="px-3 py-2 text-right">
                  <button onClick={() => update(l.sku, 0)} className="text-slate-400 hover:text-red-600" aria-label="Entfernen">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_20rem]">
        <div>
          <label className="label" htmlFor="note">Anmerkung zur Bestellung (optional)</label>
          <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="input" placeholder="z. B. Lieferadresse, Kommission, Wunschtermin" />
        </div>
        <div className="card space-y-3 p-5">
          <div className="flex justify-between text-lg font-bold">
            <span>Summe netto</span>
            <span>{eur(total)}</span>
          </div>
          <p className="text-xs text-slate-500">zzgl. MwSt.{onRequest && " – Artikel „auf Anfrage“ werden separat bepreist."}</p>
          {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
          <button
            className="btn w-full"
            disabled={busy}
            onClick={() =>
              start(async () => {
                setError("")
                const res = await placeOrder(cart ?? {}, note)
                if ("error" in res && res.error) setError(res.error)
                else if ("orderId" in res && res.orderId) {
                  writeCart({})
                  setOrderId(res.orderId)
                }
              })
            }
          >
            {busy ? "Wird gesendet…" : "Verbindlich bestellen"}
          </button>
        </div>
      </div>
    </div>
  )
}
