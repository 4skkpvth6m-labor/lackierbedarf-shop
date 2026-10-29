export type CustomerStatus = "pending" | "approved" | "rejected"
export type OrderStatus = "neu" | "in_bearbeitung" | "versendet" | "storniert"

export type Category = { id: number; name: string; slug: string; sort: number }

export type Product = {
  id: number
  sku: string
  order_no: string | null
  name: string
  variant: string | null
  brand: string | null
  category_id: number
  catalog_page: number | null
  list_price: number | null
  description: string | null
  image_url: string | null
  active: boolean
}

export type Profile = {
  id: string
  email: string
  company: string
  contact_name: string
  street: string
  zip: string
  city: string
  phone: string
  vat_id: string
  customer_no: string | null
  status: CustomerStatus
  is_admin: boolean
  discount_all: number
  admin_note: string
  created_at: string
  approved_at: string | null
}

export const STATUS_LABEL: Record<CustomerStatus, string> = {
  pending: "Wartet auf Freigabe",
  approved: "Freigegeben",
  rejected: "Abgelehnt",
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  neu: "Neu",
  in_bearbeitung: "In Bearbeitung",
  versendet: "Versendet",
  storniert: "Storniert",
}
