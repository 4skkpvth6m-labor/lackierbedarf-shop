"use client"

import { useActionState } from "react"
import { login, type FormState } from "./actions"
import SubmitButton from "@/components/SubmitButton"

export default function LoginForm() {
  const [state, action] = useActionState<FormState, FormData>(login, {})
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">E-Mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label className="label" htmlFor="password">Passwort</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {state.error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      <SubmitButton className="btn w-full">Anmelden</SubmitButton>
    </form>
  )
}
