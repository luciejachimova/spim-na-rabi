"use client"

import { useEffect, useState } from "react"

// Reusable dialog shell with smooth open/close animation (backdrop fade +
// panel scale/translate), Escape to close, scroll lock, and click-outside.
// Stays mounted during the exit animation, then unmounts.
export default function Modal({ open, onClose, labelledBy, className = "", children }) {
  const [mounted, setMounted] = useState(open)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const id = requestAnimationFrame(() => setVisible(true))
      return () => cancelAnimationFrame(id)
    }
    setVisible(false)
    const timer = setTimeout(() => setMounted(false), 220)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!mounted) return
    const onKey = (event) => {
      if (event.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    document.documentElement.classList.add("overflow-hidden")
    return () => {
      document.removeEventListener("keydown", onKey)
      document.documentElement.classList.remove("overflow-hidden")
    }
  }, [mounted, onClose])

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-[190] flex items-center justify-center bg-dark/70 px-4 py-8 transition-opacity duration-200 ease-out ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className={`relative transition-all duration-200 ease-out ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        } ${className}`}
      >
        {children}
      </div>
    </div>
  )
}
