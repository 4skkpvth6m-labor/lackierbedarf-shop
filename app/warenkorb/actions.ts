"use server"

import { getProfile, canSeePrices } from "@/lib/auth"
import { db } from "@/lib/supabase/admin"
import { loadDiscounts, discountFor, customerPrice } from "@/lib/pricing"
import { sendMail, siteUrl } from "@/lib/mail"
import { formatEur } from "@/lib/format"
import type { Product } from "@/lib/types"

export type CartLine = {
  sku: string
  name: string
  variant: string | null
  quantity: number
  listPrice: number | null
  discount: number
  unitPrice: number | null
  lineTotal: number | null
}

async function priceLines(cart: Record<string, number>) {
  const profile = await getProfile()
  if (!profile || !canSeePrices(profile)) return { profile, lines: null }
  const skus = Object.keys(cart).slice(0, 500)
  if (skus.length === 0) return { profile, lines: [] as (CartLine & { productId: number })[] }
  const [{ data }, discounts] = await Promise.all([
    db().from("products").select("*").in("sku", skus).eq("active", true),
    loadDiscounts(profile),
  ])
  const lines = ((data ?? []) as Product[]).map((p) => {
    const quantity = Math.max(1, Math.floor(Number(cart[p.sku]) || 1))
    const discount = discountFor(discounts, p.category_id)
    const unitPrice = customerPrice(p.list_price, discount)
    return {
      productId: p.id,
      sku: p.sku,
      name: p.name,
      variant: p.variant,
      quantity,
      listPrice: p.list_price == null ? null : Number(p.list_price),
      discount,
      unitPrice,
      lineTotal: unitPrice == null ? null : Math.round(unitPrice * quantity * 100) / 100,
    }
  })
  return { profile, lines }
}

export async function getCartLines(cart: Record<string, number>) {
  const { profile, lines } = await priceLines(cart)
  if (!profile) return { error: "login" as const }
  if (!lines) return { error: "pending" as const }
  return { lines: lines.map(({ productId: _, ...l }) => l) }
}

export async function placeOrder(cart: Record<string, number>, note: string) {
  const { profile, lines } = await priceLines(cart)
  if (!profile || !lines) return { error: "Ihr Konto ist nicht freigegeben." }
  if (lines.length === 0) return { error: "Der Warenkorb ist leer." }

  const total = lines.reduce((s, l) => s + (l.lineTotal ?? 0), 0)
  const { data: order, error } = await db()
    .from("orders")
    .insert({ customer_id: profile.id, note: note.slice(0, 2000), total_net: Math.round(total * 100) / 100 })
    .select("id")
    .single()
  if (error || !order) return { error: "Die Bestellung konnte nicht gespeichert werden. Bitte erneut versuchen." }

  const { error: itemsError } = await db().from("order_items").insert(
    lines.map((l) => ({
      order_id: order.id,
      product_id: l.productId,
      sku: l.sku,
      name: [l.name, l.variant].filter(Boolean).join(" – "),
      quantity: l.quantity,
      list_price: l.listPrice,
      discount_percent: l.discount,
      unit_price: l.unitPrice,
    }))
  )
  if (itemsError) {
    await db().from("orders").delete().eq("id", order.id)
    return { error: "Die Bestellung konnte nicht gespeichert werden. Bitte erneut versuchen." }
  }

  const text = [
    `Bestellung #${order.id} von ${profile.company} (${profile.contact_name}, ${profile.email})`,
    "",
    ...lines.map((l) => `${l.quantity} × ${l.sku} ${l.name}${l.variant ? " – " + l.variant : ""}  à ${formatEur(l.unitPrice)}`),
    "",
    `Summe netto: ${formatEur(total)}`,
    note ? `\nAnmerkung: ${note}` : "",
    `\n${siteUrl()}/admin/bestellungen/${order.id}`,
  ].join("\n")
  await Promise.all([
    sendMail(process.env.SHOP_OWNER_EMAIL, `Neue Bestellung #${order.id} – ${profile.company}`, text),
    sendMail(profile.email, `Ihre Bestellung #${order.id}`, `Vielen Dank für Ihre Bestellung!\n\n${text.split("\n").slice(2).join("\n")}`),
  ])
  return { orderId: order.id as number }
}
