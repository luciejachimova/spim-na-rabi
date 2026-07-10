"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"
import Footer from "./Footer"
import Navbar from "./Navbar"
import ReservationModal from "./ReservationModal"

const ReservationContext = createContext(null)

export function useReservation() {
  return useContext(ReservationContext)
}

// Public-site chrome (navbar/footer/reservation modal). Admin has its own root
// layout and never renders this.
export default function ClientChrome({ children }) {
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

  return (
    <ReservationContext.Provider value={value}>
      <Navbar />
      <main id="main-content">{children}</main>
      <Footer />
      <ReservationModal open={reservationOpen} onClose={() => setReservationOpen(false)} />
    </ReservationContext.Provider>
  )
}
