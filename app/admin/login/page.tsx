"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 font-jost text-dark">
      <h1 className="mb-6 font-serif text-2xl">Administrace</h1>
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

            router.push("/admin")
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
