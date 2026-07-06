"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/reservations", label: "Rezervace" },
  { href: "/admin/sync", label: "Kalendáře" }
]

function isNavItemActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin"
  return pathname.startsWith(href)
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className={`rounded-[2px] px-3 py-2 text-sm uppercase tracking-wide transition-colors ${
            isNavItemActive(pathname, item.href) ? "bg-dark text-cream" : "text-mid hover:bg-cream hover:text-dark"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-cream font-jost text-dark">
      <header className="flex items-center justify-between border-b border-mid/20 bg-pale px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="cursor-pointer p-1 text-dark md:hidden"
            aria-label="Otevřít menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <span className="font-serif text-lg">Spim na Rabí – Administrace</span>
        </div>
        <button type="button" onClick={handleLogout} className="cursor-pointer text-sm text-mid underline hover:text-dark">
          Odhlásit
        </button>
      </header>

      <div className="flex">
        <aside className="hidden w-56 shrink-0 border-r border-mid/20 bg-pale/60 p-4 md:block">
          <NavLinks pathname={pathname} />
        </aside>

        {drawerOpen && (
          <div
            className="fixed inset-0 z-[350] bg-dark/60 md:hidden"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setDrawerOpen(false)
            }}
          >
            <aside className="h-full w-64 bg-cream p-4 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <span className="font-serif text-lg">Menu</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="cursor-pointer text-2xl leading-none text-dark"
                  aria-label="Zavřít menu"
                >
                  ×
                </button>
              </div>
              <NavLinks pathname={pathname} onNavigate={() => setDrawerOpen(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-8 md:px-8">{children}</main>
      </div>
    </div>
  )
}
