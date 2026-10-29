"use client"

import { useActionState } from "react"
import { importStartCatalog, type ImportResult } from "@/app/admin/artikel/actions"
import SubmitButton from "@/components/SubmitButton"

export default function StartCatalogButton() {
  const [result, action] = useActionState<ImportResult | null>(importStartCatalog, null)
  return (
    <div className="space-y-3">
      <form action={action}>
        <SubmitButton>Katalog „Lackzubehör“ einspielen (2.566 Artikel)</SubmitButton>
      </form>
      {result?.error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{result.error}</p>}
      {result && !result.error && (
        <p className="rounded bg-green-50 p-3 text-sm text-green-800">
          {result.created} Artikel neu angelegt, {result.updated} aktualisiert. Vorhandene Preise bleiben erhalten.
        </p>
      )}
    </div>
  )
}
