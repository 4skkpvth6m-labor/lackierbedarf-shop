import "server-only"
import { db } from "@/lib/supabase/admin"
import type { Category } from "@/lib/types"

export async function getCategories(): Promise<Category[]> {
  const { data } = await db().from("categories").select("*").order("sort")
  return (data ?? []) as Category[]
}

// Suchbegriff für PostgREST-or()-Filter entschärfen (Komma/Klammern trennen dort Bedingungen).
export function searchFilter(q: string) {
  const term = q.replace(/[,()%*\\]/g, " ").trim()
  if (!term) return null
  const like = `%${term.replace(/\s+/g, "%")}%`
  return ["sku", "order_no", "name", "variant", "brand"].map((c) => `${c}.ilike.${like}`).join(",")
}
