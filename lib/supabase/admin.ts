import "server-only"
import { createClient } from "@supabase/supabase-js"

// Service-Role-Client: umgeht RLS. Nur serverseitig verwenden und vorher
// immer prüfen, ob der aktuelle Nutzer die Daten sehen/ändern darf.
export function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
