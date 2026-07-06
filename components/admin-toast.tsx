"use client"

import { useRef, useState } from "react"

// Minimal, dependency-free toast — a self-dismissing message in the corner.
// Shared across admin pages so each doesn't reimplement its own copy.
export function useToast() {
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(type: "success" | "error", message: string) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setToast({ type, message })
    timeoutRef.current = setTimeout(() => setToast(null), 5000)
  }

  const toastElement = toast ? (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-[300] max-w-sm rounded-[2px] px-4 py-3 text-sm text-cream shadow-lg ${
        toast.type === "error" ? "bg-accent" : "bg-dark"
      }`}
    >
      {toast.message}
    </div>
  ) : null

  return { showToast, toastElement }
}
