import Link from "next/link"
import { db } from "@/lib/supabase/admin"

export default async function AdminHome() {
  const count = async (table: string, col?: string, val?: string) => {
    let q = db().from(table).select("*", { count: "exact", head: true })
    if (col && val) q = q.eq(col, val)
    return (await q).count ?? 0
  }
  const [pending, approved, newOrders, products, noPrice] = await Promise.all([
    count("profiles", "status", "pending"),
    count("profiles", "status", "approved"),
    count("orders", "status", "neu"),
    count("products"),
    db().from("products").select("*", { count: "exact", head: true }).is("list_price", null).then((r) => r.count ?? 0),
  ])
  const tiles = [
    { href: "/admin/kunden?status=pending", label: "Warten auf Freigabe", value: pending, hot: pending > 0 },
    { href: "/admin/bestellungen?status=neu", label: "Neue Bestellungen", value: newOrders, hot: newOrders > 0 },
    { href: "/admin/kunden?status=approved", label: "Freigegebene Kunden", value: approved },
    { href: "/admin/artikel?ohnepreis=1", label: `Artikel ohne Listenpreis (von ${products})`, value: noPrice, hot: noPrice > 0 },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Adminbereich</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className={`card p-5 transition hover:border-brand-500 ${t.hot ? "border-amber-300 bg-amber-50" : ""}`}>
            <div className="text-3xl font-extrabold">{t.value}</div>
            <div className="mt-1 text-sm text-slate-600">{t.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
