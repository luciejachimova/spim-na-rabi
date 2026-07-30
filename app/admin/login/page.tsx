"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

// Only internal paths are accepted as a redirect target, so a crafted
// ?next=https://elsewhere can't turn the login form into an open redirect.
function safeNext(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/admin"
  return value
}

// useSearchParams() opts a component out of static prerendering, so the form
// sits behind a Suspense boundary and the page itself stays static.
export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <AdminLoginForm />
    </Suspense>
  )
}

function AdminLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get("next"))
  const isManager = next.startsWith("/manager")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 font-jost text-dark">
      <h1 className="mb-6 font-serif text-2xl">{isManager ? "Spim Manager" : "Administrace"}</h1>
      <form
        className="space-y-4"
        onSubmit={async (event) => {
          event.preventDefault()
          setLoading(true)
          setError(null)
          const password = new FormData(event.currentTarget).get("password")

          try {
            const response = await fetch("/api/admin/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password })
            })
            const payload = await response.json()

            if (!response.ok) {
              setError(payload.error || "Přihlášení selhalo.")
              return
            }

            router.push(next)
            router.refresh()
          } finally {
            setLoading(false)
          }
        }}
      >
        <input
          type="password"
          name="password"
          required
          placeholder="Heslo"
          autoComplete="current-password"
          className="w-full rounded-[2px] border border-mid/20 bg-pale px-4 py-3 text-dark outline-none focus:border-dark"
        />
        {error && <p className="text-sm text-accent">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-[2px] bg-dark px-4 py-3 text-sm uppercase tracking-wide text-cream transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          Přihlásit se
        </button>
      </form>
    </div>
  )
}
