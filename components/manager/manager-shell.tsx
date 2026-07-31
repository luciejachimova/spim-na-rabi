"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

// Bottom navigation on phones, a sidebar from md up. The bar sits at the bottom
// because this is used one-handed while standing in a doorway — the top of a
// 6" screen is out of thumb reach.
const NAV_ITEMS = [
  { href: "/manager/rezervace", label: "Rezervace", icon: CalendarIcon },
  { href: "/manager/hoste", label: "Hosté", icon: UsersIcon }
]

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M16 5.6a3.2 3.2 0 0 1 0 6.3M17.5 20c0-2.1-.6-3.8-1.7-5" />
    </svg>
  )
}

function PlusIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export default function ManagerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()

  // The login screen renders inside app/admin, so the only path that reaches
  // this shell without wanting the chrome is nothing today — kept simple.
  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login?next=/manager")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-dark/10 bg-sand/95 px-4 backdrop-blur-sm supports-[backdrop-filter]:bg-sand/80 md:px-6">
        {/* pt keeps the title clear of the iOS status bar on an installed app */}
        <div className="flex items-center gap-2 pt-[env(safe-area-inset-top)]">
          <Link href="/manager/rezervace" className="flex items-center gap-2 py-3">
            <span className="grid h-7 w-7 place-items-center rounded-[6px] bg-dark text-[11px] font-medium tracking-tight text-sand">
              SM
            </span>
            <span className="text-base tracking-wide">Spim Manager</span>
          </Link>
        </div>
        <div className="flex items-center gap-4 pt-[env(safe-area-inset-top)]">
          <Link
            href="/manager/rezervace/nova"
            className="hidden cursor-pointer items-center gap-1.5 rounded-[2px] bg-dark px-3 py-2 text-xs uppercase tracking-wide text-sand transition-colors hover:bg-alert md:flex"
          >
            <PlusIcon size={16} />
            Nová rezervace
          </Link>
          <button type="button" onClick={handleLogout} className="cursor-pointer text-sm text-muted underline hover:text-dark">
            Odhlásit
          </button>
        </div>
      </header>

      <div className="flex">
        <aside className="hidden w-52 shrink-0 border-r border-dark/10 p-4 md:block">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-[2px] px-3 py-2 text-sm transition-colors ${
                  isActive(pathname, item.href) ? "bg-dark text-sand" : "text-muted hover:bg-dark/5 hover:text-dark"
                }`}
              >
                <item.icon />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* pb clears the fixed bottom bar plus the iOS home indicator */}
        <main className="min-w-0 flex-1 px-4 pt-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:px-8 md:pt-8 md:pb-10">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 items-center border-t border-dark/10 bg-sand/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] tracking-wide transition-colors ${
              isActive(pathname, item.href) ? "text-dark" : "text-muted"
            }`}
          >
            <item.icon />
            {item.label}
          </Link>
        ))}
        <Link
          href="/manager/rezervace/nova"
          aria-label="Nová rezervace"
          className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] tracking-wide text-muted transition-colors hover:text-dark"
        >
          <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-dark text-sand">
            <PlusIcon size={14} />
          </span>
          Nová
        </Link>
      </nav>
    </div>
  )
}
