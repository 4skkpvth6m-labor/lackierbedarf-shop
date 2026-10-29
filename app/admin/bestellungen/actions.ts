"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth"
import { db } from "@/lib/supabase/admin"
import type { OrderStatus } from "@/lib/types"

export async function setOrderStatus(orderId: number, formData: FormData) {
  await requireAdmin()
  await db().from("orders").update({ status: String(formData.get("status")) as OrderStatus }).eq("id", orderId)
  revalidatePath("/admin/bestellungen")
  revalidatePath(`/admin/bestellungen/${orderId}`)
}
