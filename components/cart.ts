"use client"

// Warenkorb im Browser: { [artikelnummer]: menge }. Preise werden immer
// serverseitig neu berechnet – der Browser kennt nur Artikel und Mengen.
export type Cart = Record<string, number>
const KEY = "warenkorb"

export function readCart(): Cart {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}")
  } catch {
    return {}
  }
}

export function writeCart(cart: Cart) {
  try {
    localStorage.setItem(KEY, JSON.stringify(cart))
  } catch {}
  window.dispatchEvent(new Event("cart-change"))
}

export function addToCart(sku: string, qty: number) {
  const cart = readCart()
  cart[sku] = (cart[sku] ?? 0) + qty
  writeCart(cart)
}
