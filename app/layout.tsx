import type { Metadata } from "next"
import "./globals.css"
import Header from "@/components/Header"

export const metadata: Metadata = {
  title: "Lackierbedarf – Fachhandel für Lackierer",
  description: "Klebeband, Abdeckmaterial, Lackierpistolen, Schleifmittel und mehr – für Werkstätten und Lackierereien.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-4 px-4 py-6 text-sm text-slate-500">
            <span>© {new Date().getFullYear()} Lackierbedarf</span>
            <span>Alle Preise netto zzgl. gesetzlicher MwSt. – nur für Gewerbekunden.</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
