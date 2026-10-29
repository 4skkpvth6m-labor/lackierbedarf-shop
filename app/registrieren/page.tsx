import RegisterForm from "./RegisterForm"

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card p-6">
        <h1 className="text-2xl font-bold">Kundenkonto beantragen</h1>
        <p className="mb-6 mt-2 text-sm text-slate-600">
          Unser Shop richtet sich an Gewerbekunden. Nach der Anmeldung prüfen wir deine Angaben und schalten dein Konto frei –
          danach siehst du deine persönlichen Preise und kannst bestellen.
        </p>
        <RegisterForm />
      </div>
    </div>
  )
}
