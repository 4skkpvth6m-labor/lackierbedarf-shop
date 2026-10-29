import Link from "next/link"
import { requireAdmin } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  const links = [
    ["/admin", "Übersicht"],
    ["/admin/kunden", "Kunden & Rabatte"],
    ["/admin/bestellungen", "Bestellungen"],
    ["/admin/artikel", "Artikel & Preise"],
    ["/admin/import", "Import"],
  ]
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 text-sm font-medium">
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-white hover:shadow-sm">{label}</Link>
        ))}
      </nav>
      {children}
    </div>
  )
}
