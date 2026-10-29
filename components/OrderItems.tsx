import { formatEur, formatPercent } from "@/lib/format"

export type OrderItem = {
  id: number
  sku: string
  name: string
  quantity: number
  list_price: number | null
  discount_percent: number
  unit_price: number | null
}

export default function OrderItems({ items }: { items: OrderItem[] }) {
  return (
    <table className="w-full text-sm">
      <thead className="table-head">
        <tr>
          <th className="px-3 py-2">Art.-Nr.</th>
          <th className="px-3 py-2">Artikel</th>
          <th className="px-3 py-2 text-right">Menge</th>
          <th className="px-3 py-2 text-right">Listenpreis</th>
          <th className="px-3 py-2 text-right">Rabatt</th>
          <th className="px-3 py-2 text-right">Einzelpreis</th>
          <th className="px-3 py-2 text-right">Summe</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((i) => (
          <tr key={i.id}>
            <td className="px-3 py-2 font-mono text-xs">{i.sku}</td>
            <td className="px-3 py-2">{i.name}</td>
            <td className="px-3 py-2 text-right">{i.quantity}</td>
            <td className="px-3 py-2 text-right text-slate-500">{formatEur(i.list_price)}</td>
            <td className="px-3 py-2 text-right">{Number(i.discount_percent) > 0 ? formatPercent(i.discount_percent) : "–"}</td>
            <td className="px-3 py-2 text-right">{formatEur(i.unit_price)}</td>
            <td className="px-3 py-2 text-right font-semibold">{i.unit_price == null ? "–" : formatEur(Number(i.unit_price) * i.quantity)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
