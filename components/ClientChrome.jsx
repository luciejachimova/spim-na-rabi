"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import Footer from "./Footer"
import Navbar from "./Navbar"
import ReservationModal from "./ReservationModal"

const ReservationContext = createContext(null)

export function useReservation() {
  return useContext(ReservationContext)
}

export default function ClientChrome({ children }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")
  const [reservationOpen, setReservationOpen] = useState(false)

  useEffect(() => {
    document.querySelectorAll(".js-fade-in").forEach((item) => {
      item.classList.add("js-fade-in--visible")
    })
  }, [children])

  useEffect(() => {
    document.documentElement.classList.toggle("overflow-hidden", reservationOpen)
    return () => document.documentElement.classList.remove("overflow-hidden")
  }, [reservationOpen])

  const value = useMemo(
    () => ({
      openReservation: () => setReservationOpen(true),
      closeReservation: () => setReservationOpen(false)
    }),
    []
  )

  if (isAdmin) {
    return <ReservationContext.Provider value={value}>{children}</ReservationContext.Provider>
  }

  return (
    <ReservationContext.Provider value={value}>
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
      <ReservationModal open={reservationOpen} onClose={() => setReservationOpen(false)} />
    </ReservationContext.Provider>
  )
}
