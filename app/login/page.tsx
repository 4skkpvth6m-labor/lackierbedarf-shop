import Link from "next/link"
import LoginForm from "./LoginForm"

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="card p-6">
        <h1 className="mb-6 text-2xl font-bold">Anmelden</h1>
        <LoginForm />
        <p className="mt-6 text-sm text-slate-600">
          Noch kein Kundenkonto?{" "}
          <Link href="/registrieren" className="font-semibold text-brand-600 hover:underline">Jetzt beantragen</Link>
        </p>
      </div>
    </div>
  )
}
