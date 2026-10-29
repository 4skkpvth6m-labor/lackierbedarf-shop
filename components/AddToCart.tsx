"use client"

import { useState } from "react"
import { addToCart } from "@/components/cart"

export default function AddToCart({ sku }: { sku: string }) {
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  return (
    <div className="flex items-center justify-end gap-1">
      <input
        type="number"
        min={1}
        value={qty}
        onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
        className="input !w-16 !px-2 !py-1 text-right"
        aria-label="Menge"
      />
      <button
        type="button"
        className="btn !px-3 !py-1.5"
        onClick={() => {
          addToCart(sku, qty)
          setAdded(true)
          setTimeout(() => setAdded(false), 1500)
        }}
      >
        {added ? "✓" : "In den Korb"}
      </button>
    </div>
  )
}
