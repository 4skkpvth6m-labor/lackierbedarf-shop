"use client"

import { useState } from "react"
import SubmitButton from "@/components/SubmitButton"

type Props = {
  categories: { id: number; name: string }[]
  discountAll: number
  overrides: Record<number, number>
  action: (formData: FormData) => void
}

// Rabatt "auf alles" plus abweichende Rabatte pro Kategorie per Häkchen.
export default function DiscountEditor({ categories, discountAll, overrides, action }: Props) {
  const [all, setAll] = useState(String(discountAll).replace(".", ","))
  const [checked, setChecked] = useState<Record<number, boolean>>(Object.fromEntries(categories.map((c) => [c.id, c.id in overrides])))
  const [values, setValues] = useState<Record<number, string>>(
    Object.fromEntries(categories.map((c) => [c.id, c.id in overrides ? String(overrides[c.id]).replace(".", ",") : ""]))
  )
  const [bulk, setBulk] = useState("")
  const allNum = Number(all.replace(",", ".")) || 0
  const anyChecked = Object.values(checked).some(Boolean)

  return (
    <form action={action} className="space-y-5">
      <div className="flex flex-wrap items-end gap-3 rounded-lg bg-brand-50 p-4">
        <div>
          <label className="label" htmlFor="discount_all">Rabatt auf alles</label>
          <div className="flex items-center gap-2">
            <input id="discount_all" name="discount_all" inputMode="decimal" value={all} onChange={(e) => setAll(e.target.value)} className="input !w-24 text-right text-lg font-bold" />
            <span className="text-lg font-bold">%</span>
          </div>
        </div>
        <p className="max-w-md text-sm text-slate-600">Gilt für alle Kategorien ohne Häkchen. Für abweichende Konditionen unten die Kategorie anhaken und einen eigenen Rabatt eintragen.</p>
      </div>

      <table className="w-full text-sm">
        <thead className="table-head">
          <tr>
            <th className="w-10 px-3 py-2" />
            <th className="px-3 py-2">Kategorie</th>
            <th className="px-3 py-2 text-right">Rabatt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {categories.map((c) => (
            <tr key={c.id} className={checked[c.id] ? "bg-amber-50" : ""}>
              <td className="px-3 py-2">
                <input
                  type="checkbox"
                  name={`override_${c.id}`}
                  checked={!!checked[c.id]}
                  onChange={(e) => {
                    setChecked({ ...checked, [c.id]: e.target.checked })
                    if (e.target.checked && !values[c.id]) setValues({ ...values, [c.id]: all })
                  }}
                  className="h-4 w-4 accent-brand-600"
                  aria-label={`Eigener Rabatt für ${c.name}`}
                />
              </td>
              <td className="px-3 py-2">
                {c.name}
                {checked[c.id] && <span className="ml-2 text-xs font-semibold text-amber-700">eigener Rabatt</span>}
              </td>
              <td className="px-3 py-2 text-right">
                {checked[c.id] ? (
                  <span className="inline-flex items-center gap-1">
                    <input
                      name={`pct_${c.id}`}
                      inputMode="decimal"
                      value={values[c.id]}
                      onChange={(e) => setValues({ ...values, [c.id]: e.target.value })}
                      className="input !w-20 !py-1 text-right font-semibold"
                    />
                    %
                  </span>
                ) : (
                  <span className="text-slate-400">{allNum.toLocaleString("de-DE")} % (wie alles)</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-600">Allen angehakten Kategorien</span>
        <input value={bulk} onChange={(e) => setBulk(e.target.value)} inputMode="decimal" placeholder="z. B. 10" className="input !w-20 !py-1 text-right" />
        <span>%</span>
        <button
          type="button"
          className="btn-secondary !py-1"
          disabled={!anyChecked || bulk.trim() === ""}
          onClick={() => setValues(Object.fromEntries(categories.map((c) => [c.id, checked[c.id] ? bulk : values[c.id]])))}
        >
          geben
        </button>
        <span className="mx-2 text-slate-300">|</span>
        <button type="button" className="text-slate-600 underline hover:text-slate-900" onClick={() => setChecked({})}>
          alle Häkchen entfernen (überall {allNum.toLocaleString("de-DE")} %)
        </button>
      </div>

      <SubmitButton>Rabatte speichern</SubmitButton>
    </form>
  )
}
