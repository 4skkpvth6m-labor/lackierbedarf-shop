"use client"

import { useActionState } from "react"
import { importCsv, type ImportResult } from "@/app/admin/artikel/actions"
import SubmitButton from "@/components/SubmitButton"

export default function ImportForm() {
  const [result, action] = useActionState<ImportResult | null, FormData>(importCsv, null)
  return (
    <div className="space-y-4">
      <form action={action} className="flex flex-wrap items-center gap-3">
        <input type="file" name="file" accept=".csv,text/csv" className="text-sm" />
        <SubmitButton>Importieren</SubmitButton>
      </form>
      {result?.error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{result.error}</p>}
      {result && !result.error && (
        <div className="rounded bg-green-50 p-3 text-sm text-green-800">
          {result.updated} Artikel aktualisiert, {result.created} neu angelegt.
          {result.skipped.length > 0 && (
            <details className="mt-2 text-amber-800">
              <summary>{result.skipped.length} Zeilen übersprungen</summary>
              <ul className="mt-1 list-disc pl-5">{result.skipped.slice(0, 200).map((s) => <li key={s}>{s}</li>)}</ul>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
