const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" })

export function formatEur(value: number | null | undefined) {
  return value == null ? "auf Anfrage" : eur.format(value)
}

export function formatPercent(value: number) {
  return `${Number(value).toLocaleString("de-DE", { maximumFractionDigits: 2 })} %`
}

export function formatDate(value: string) {
  return new Date(value).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Berlin" })
}
