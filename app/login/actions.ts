"use server"

import { redirect } from "next/navigation"
import { supabaseAuth } from "@/lib/supabase/server"
import { sendMail, siteUrl } from "@/lib/mail"

export type FormState = { error?: string; ok?: string }

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await supabaseAuth()
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  })
  if (error) {
    return {
      error: error.message.includes("Email not confirmed")
        ? "Bitte bestätige zuerst deine E-Mail-Adresse über den Link in der Bestätigungsmail."
        : "E-Mail oder Passwort ist falsch.",
    }
  }
  redirect("/katalog")
}

export async function register(_: FormState, formData: FormData): Promise<FormState> {
  const get = (k: string) => String(formData.get(k) ?? "").trim()
  const required = ["company", "contact_name", "street", "zip", "city", "email", "password"]
  if (required.some((k) => !get(k))) return { error: "Bitte alle Pflichtfelder ausfüllen." }
  if (get("password").length < 8) return { error: "Das Passwort muss mindestens 8 Zeichen lang sein." }

  const supabase = await supabaseAuth()
  const { error } = await supabase.auth.signUp({
    email: get("email"),
    password: get("password"),
    options: {
      emailRedirectTo: `${siteUrl()}/konto`,
      data: {
        company: get("company"),
        contact_name: get("contact_name"),
        street: get("street"),
        zip: get("zip"),
        city: get("city"),
        phone: get("phone"),
        vat_id: get("vat_id"),
      },
    },
  })
  if (error) {
    return { error: error.message.includes("already") ? "Für diese E-Mail gibt es bereits ein Konto." : error.message }
  }
  await sendMail(
    process.env.SHOP_OWNER_EMAIL,
    `Neue Kundenanmeldung: ${get("company")}`,
    `${get("company")} (${get("contact_name")}, ${get("email")}) hat ein Kundenkonto beantragt.\n\nFreigeben: ${siteUrl()}/admin/kunden?status=pending`
  )
  return {
    ok: "Danke! Wir haben dir eine E-Mail zur Bestätigung geschickt. Sobald wir dein Konto freigegeben haben, siehst du deine Preise.",
  }
}

export async function logout() {
  const supabase = await supabaseAuth()
  await supabase.auth.signOut()
  redirect("/")
}
