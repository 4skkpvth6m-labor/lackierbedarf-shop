"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/supabase/admin"
import { sendMail, siteUrl } from "@/lib/mail"
import type { CustomerStatus } from "@/lib/types"

const pct = (v: FormDataEntryValue | null) => {
  const n = Number(String(v ?? "").replace(",", "."))
  return Number.isFinite(n) ? Math.min(100, Math.max(0, Math.round(n * 100) / 100)) : 0
}

export async function setStatus(customerId: string, status: CustomerStatus) {
  await requireAdmin()
  const { data: profile } = await db()
    .from("profiles")
    .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
    .eq("id", customerId)
    .select("email, company, status")
    .single()
  if (profile && status === "approved") {
    await sendMail(
      profile.email,
      "Ihr Kundenkonto ist freigeschaltet",
      `Guten Tag,\n\nIhr Kundenkonto für ${profile.company} ist ab sofort freigeschaltet. Ihre persönlichen Preise sehen Sie nach der Anmeldung im Katalog:\n${siteUrl()}/katalog`
    )
  }
  revalidatePath("/admin/kunden")
  revalidatePath(`/admin/kunden/${customerId}`)
}

export async function saveDiscounts(customerId: string, formData: FormData) {
  await requireAdmin()
  const all = pct(formData.get("discount_all"))
  const overrides: { customer_id: string; category_id: number; percent: number }[] = []
  for (const [key] of formData.entries()) {
    const m = key.match(/^override_(\d+)$/)
    if (m) overrides.push({ customer_id: customerId, category_id: Number(m[1]), percent: pct(formData.get(`pct_${m[1]}`)) })
  }
  const client = db()
  await client.from("profiles").update({ discount_all: all }).eq("id", customerId)
  await client.from("customer_category_discounts").delete().eq("customer_id", customerId)
  if (overrides.length) await client.from("customer_category_discounts").insert(overrides)
  revalidatePath(`/admin/kunden/${customerId}`)
  revalidatePath("/admin/kunden")
}

export async function saveCustomerData(customerId: string, formData: FormData) {
  await requireAdmin()
  const fields = ["company", "contact_name", "street", "zip", "city", "phone", "vat_id", "customer_no", "admin_note"] as const
  const update = Object.fromEntries(fields.map((f) => [f, String(formData.get(f) ?? "").trim()]))
  await db().from("profiles").update({ ...update, customer_no: update.customer_no || null }).eq("id", customerId)
  revalidatePath(`/admin/kunden/${customerId}`)
}
