import "server-only"

// Optionaler E-Mail-Versand über Resend. Ohne RESEND_API_KEY passiert nichts –
// Anmeldungen und Bestellungen stehen dann trotzdem im Adminbereich.
export async function sendMail(to: string | undefined, subject: string, text: string) {
  const key = process.env.RESEND_API_KEY
  if (!key || !to) return
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.MAIL_FROM || "Shop <onboarding@resend.dev>", to, subject, text }),
    })
  } catch (err) {
    console.error("E-Mail-Versand fehlgeschlagen", err)
  }
}

export const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
