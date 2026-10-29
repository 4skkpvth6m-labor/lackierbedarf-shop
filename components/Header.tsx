import Link from "next/link"
import { getProfile } from "@/lib/auth"
import { logout } from "@/app/login/actions"
import CartBadge from "@/components/CartBadge"

export default async function Header() {
  const profile = await getProfile()
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-brand-900">
          Lackier<span className="text-brand-600">bedarf</span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium text-slate-700">
          <Link href="/katalog" className="hover:text-brand-600">Katalog</Link>
          {profile && <Link href="/bestellungen" className="hover:text-brand-600">Meine Bestellungen</Link>}
          {profile?.is_admin && (
            <Link href="/admin" className="rounded bg-brand-900 px-2 py-0.5 text-white hover:bg-brand-700">Admin</Link>
          )}
        </nav>
        <div className="flex items-center gap-3 text-sm">
          {profile ? (
            <>
              <Link href="/konto" className="max-w-48 truncate text-slate-700 hover:text-brand-600" title={profile.email}>
                {profile.company || profile.email}
              </Link>
              <form action={logout}>
                <button className="text-slate-500 hover:text-slate-800">Abmelden</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-700 hover:text-brand-600">Anmelden</Link>
              <Link href="/registrieren" className="btn !py-1.5">Kundenkonto beantragen</Link>
            </>
          )}
          <CartBadge />
        </div>
      </div>
    </header>
  )
}
