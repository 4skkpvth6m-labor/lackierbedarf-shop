import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { supabaseAuth } from "@/lib/supabase/server"
import { db } from "@/lib/supabase/admin"
import type { Profile } from "@/lib/types"

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await supabaseAuth()
  const { data } = await supabase.auth.getUser()
  if (!data.user) return null
  const { data: profile } = await db().from("profiles").select("*").eq("id", data.user.id).maybeSingle()
  return (profile as Profile | null) ?? null
})

export async function requireUser() {
  const profile = await getProfile()
  if (!profile) redirect("/login")
  return profile
}

export async function requireApproved() {
  const profile = await requireUser()
  if (profile.status !== "approved" && !profile.is_admin) redirect("/konto")
  return profile
}

export async function requireAdmin() {
  const profile = await requireUser()
  if (!profile.is_admin) redirect("/")
  return profile
}

export function canSeePrices(profile: Profile | null) {
  return !!profile && (profile.status === "approved" || profile.is_admin)
}
