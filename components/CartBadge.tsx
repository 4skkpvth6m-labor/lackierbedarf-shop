"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { readCart } from "@/components/cart"

export default function CartBadge() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    const update = () => setCount(Object.values(readCart()).reduce((a, b) => a + b, 0))
    update()
    window.addEventListener("cart-change", update)
    window.addEventListener("storage", update)
    return () => {
      window.removeEventListener("cart-change", update)
      window.removeEventListener("storage", update)
    }
  }, [])
  return (
    <Link href="/warenkorb" className="relative rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50">
      Warenkorb
      {count > 0 && (
        <span className="absolute -right-2 -top-2 rounded-full bg-accent-500 px-1.5 text-xs font-bold text-slate-900">{count}</span>
      )}
    </Link>
  )
}
