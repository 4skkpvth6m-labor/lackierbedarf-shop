import Link from "next/link"
import { getCategories } from "@/lib/catalog"
import { getProfile } from "@/lib/auth"
import { db } from "@/lib/supabase/admin"

export default async function Home() {
  const [categories, profile] = await Promise.all([getCategories(), getProfile()])
  const { data: counts } = await db().rpc("category_counts")
  const countBy = new Map<number, number>(((counts ?? []) as { category_id: number; n: number | string }[]).map((c) => [c.category_id, Number(c.n)]))
  return (
    <div className="space-y-10">
      <section className="overflow-hidden rounded-xl bg-gradient-to-br from-brand-900 to-brand-600 px-6 py-12 text-white sm:px-10">
        <h1 className="max-w-2xl text-3xl font-extrabold sm:text-4xl">Lackierbedarf für Profis</h1>
        <p className="mt-3 max-w-2xl text-brand-100">
          Abdeckmaterial, Klebebänder, Lackierpistolen, Schleifmittel, Poliersysteme und Werkstattausrüstung – mit Ihren
          persönlichen Konditionen.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/katalog" className="btn !bg-white !text-brand-900 hover:!bg-brand-50">Zum Katalog</Link>
          {!profile && (
            <Link href="/registrieren" className="btn !bg-accent-500 !text-slate-900 hover:brightness-95">Kundenkonto beantragen</Link>
          )}
        </div>
      </section>

      {profile?.status === "pending" && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Ihr Konto wartet noch auf Freigabe. Sobald es freigeschaltet ist, sehen Sie hier Ihre persönlichen Preise.
        </p>
      )}

      <section>
        <h2 className="mb-4 text-xl font-bold">Sortiment</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/katalog?kategorie=${c.slug}`} className="card group flex items-center justify-between p-5 transition hover:border-brand-500">
              <span className="font-semibold group-hover:text-brand-600">{c.name}</span>
              <span className="text-sm text-slate-500">{countBy.get(c.id) ?? 0} Artikel</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
