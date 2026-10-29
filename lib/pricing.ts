import "server-only"
import { db } from "@/lib/supabase/admin"
import type { Profile } from "@/lib/types"

// Rabatte eines Kunden: Kategorie-Rabatt hat Vorrang vor dem Rabatt "auf alles".
export type DiscountMap = { all: number; byCategory: Map<number, number> }

export async function loadDiscounts(profile: Profile): Promise<DiscountMap> {
  const { data } = await db()
    .from("customer_category_discounts")
    .select("category_id, percent")
    .eq("customer_id", profile.id)
  return {
    all: Number(profile.discount_all),
    byCategory: new Map((data ?? []).map((r) => [r.category_id as number, Number(r.percent)])),
  }
}

export function discountFor(discounts: DiscountMap, categoryId: number) {
  return discounts.byCategory.get(categoryId) ?? discounts.all
}

export function customerPrice(listPrice: number | null, percent: number) {
  if (listPrice == null) return null
  // in Cent rechnen, damit z. B. 11,50 € − 5 % sauber auf 10,93 € rundet
  return Math.round(Number((Number(listPrice) * (100 - percent)).toFixed(6))) / 100
}
