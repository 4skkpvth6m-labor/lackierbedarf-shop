"use client"

import { useActionState } from "react"
import { register, type FormState } from "@/app/login/actions"
import SubmitButton from "@/components/SubmitButton"

const field = (name: string, label: string, opts: { type?: string; required?: boolean; auto?: string; span?: boolean } = {}) => (
  <div className={opts.span ? "sm:col-span-2" : ""}>
    <label className="label" htmlFor={name}>
      {label} {opts.required !== false && <span className="text-red-600">*</span>}
    </label>
    <input id={name} name={name} type={opts.type ?? "text"} required={opts.required !== false} autoComplete={opts.auto} className="input" />
  </div>
)

export default function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(register, {})
  if (state.ok) return <p className="rounded bg-green-50 p-4 text-green-800">{state.ok}</p>
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {field("company", "Firma", { auto: "organization", span: true })}
      {field("contact_name", "Ansprechpartner", { auto: "name" })}
      {field("phone", "Telefon", { type: "tel", required: false, auto: "tel" })}
      {field("street", "Straße und Hausnummer", { auto: "street-address", span: true })}
      {field("zip", "PLZ", { auto: "postal-code" })}
      {field("city", "Ort", { auto: "address-level2" })}
      {field("vat_id", "USt-IdNr.", { required: false, span: true })}
      {field("email", "E-Mail", { type: "email", auto: "email" })}
      {field("password", "Passwort (mind. 8 Zeichen)", { type: "password", auto: "new-password" })}
      {state.error && <p className="rounded bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{state.error}</p>}
      <div className="sm:col-span-2">
        <SubmitButton className="btn w-full">Kundenkonto beantragen</SubmitButton>
      </div>
    </form>
  )
}
