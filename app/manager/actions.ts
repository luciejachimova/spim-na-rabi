"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { inputToCents } from "@/lib/format"
import { cancelReservation, deleteReservationPermanently } from "@/lib/reservations/cancel"
import { createManualReservation } from "@/lib/reservations/create"
import { ReservationError, ReservationNotFoundError } from "@/lib/reservations/errors"
import { updateGuestNote } from "@/lib/reservations/guests"
import { updateReservation } from "@/lib/reservations/update"
import type { ManualReservationInput, ReservationSource, ReservationStatus } from "@/lib/reservations/types"
import type { ManagerFormState } from "./form-state"

const SOURCES: ReservationSource[] = ["website", "booking", "airbnb", "phone", "email", "admin_block"]
const STATUSES: ReservationStatus[] = ["inquiry", "confirmed", "cancelled", "no_show"]

function readString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function readInt(formData: FormData, key: string, fallback = 0) {
  const parsed = Number.parseInt(readString(formData, key), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

class FormInputError extends Error {}

function readMoney(formData: FormData, key: string, label: string) {
  const cents = inputToCents(readString(formData, key))
  // undefined means the text wasn't a number — reported rather than silently
  // dropped, which is the difference between "cleared the price" and "typed
  // 8.4OO and lost it".
  if (cents === undefined) {
    throw new FormInputError(`${label} není platné číslo. Zadejte částku v korunách, např. 8400.`)
  }
  return cents
}

function readReservationInput(formData: FormData): ManualReservationInput {
  const source = readString(formData, "source") as ReservationSource
  const status = readString(formData, "status") as ReservationStatus

  if (!SOURCES.includes(source)) throw new FormInputError("Vyberte zdroj rezervace.")
  if (!STATUSES.includes(status)) throw new FormInputError("Vyberte stav rezervace.")

  const apartmentId = readInt(formData, "apartmentId", 0)
  if (!apartmentId) throw new FormInputError("Vyberte apartmán.")

  const startDate = readString(formData, "startDate")
  const endDate = readString(formData, "endDate")
  if (!startDate || !endDate) throw new FormInputError("Vyplňte datum příjezdu a odjezdu.")

  const hasDog = formData.get("hasDog") === "on"

  return {
    apartmentId,
    startDate,
    endDate,
    source,
    status,
    name: readString(formData, "name") || null,
    email: readString(formData, "email") || null,
    phone: readString(formData, "phone") || null,
    adults: readInt(formData, "adults", 0),
    children: readInt(formData, "children", 0),
    childrenAges: readString(formData, "childrenAges") || null,
    hasDog,
    dogsCount: hasDog ? Math.max(1, readInt(formData, "dogsCount", 1)) : 0,
    priceCents: readMoney(formData, "price", "Cena"),
    depositCents: readMoney(formData, "deposit", "Záloha"),
    isPaid: formData.get("isPaid") === "on",
    note: readString(formData, "note") || null,
    guestNote: readString(formData, "guestNote") || null,
    arrivalTime: readString(formData, "arrivalTime") || null,
    departureTime: readString(formData, "departureTime") || null
  }
}

// Domain errors carry messages already written for the owner, so they are shown
// as-is. Anything else is a bug and must not leak its internals into the UI.
function toFormState(error: unknown): ManagerFormState {
  if (error instanceof FormInputError || error instanceof ReservationError) {
    return { error: error.message }
  }

  console.error("Manager form action failed", error)
  return { error: "Něco se nepovedlo. Zkuste to prosím znovu." }
}

export async function createReservationAction(
  _prevState: ManagerFormState,
  formData: FormData
): Promise<ManagerFormState> {
  let reservationId: number

  try {
    const reservation = await createManualReservation(readReservationInput(formData))
    reservationId = reservation.id
  } catch (error) {
    return toFormState(error)
  }

  // Outside the try: redirect() signals by throwing, and catching it here would
  // turn a successful save into "Něco se nepovedlo".
  revalidatePath("/manager/rezervace")
  redirect(`/manager/rezervace/${reservationId}`)
}

export async function updateReservationAction(
  _prevState: ManagerFormState,
  formData: FormData
): Promise<ManagerFormState> {
  const reservationId = readInt(formData, "reservationId", 0)
  if (!reservationId) return { error: "Chybí ID rezervace." }

  try {
    await updateReservation(reservationId, {
      ...readReservationInput(formData),
      cancelReason: readString(formData, "cancelReason") || null
    })
  } catch (error) {
    return toFormState(error)
  }

  revalidatePath("/manager/rezervace")
  revalidatePath(`/manager/rezervace/${reservationId}`)
  redirect(`/manager/rezervace/${reservationId}`)
}

export async function cancelReservationAction(formData: FormData): Promise<void> {
  const reservationId = readInt(formData, "reservationId", 0)
  if (!reservationId) return

  try {
    await cancelReservation(reservationId, readString(formData, "reason") || "manual")
  } catch (error) {
    if (!(error instanceof ReservationNotFoundError)) throw error
  }

  revalidatePath("/manager/rezervace")
  revalidatePath(`/manager/rezervace/${reservationId}`)
}

export async function deleteReservationAction(formData: FormData): Promise<void> {
  const reservationId = readInt(formData, "reservationId", 0)
  if (!reservationId) return

  try {
    await deleteReservationPermanently(reservationId)
  } catch (error) {
    if (!(error instanceof ReservationNotFoundError)) throw error
  }

  revalidatePath("/manager/rezervace")
  redirect("/manager/rezervace")
}

export async function updateGuestNoteAction(formData: FormData): Promise<void> {
  const guestId = readString(formData, "guestId")
  if (!guestId) return

  await updateGuestNote(guestId, readString(formData, "note") || null)
  revalidatePath(`/manager/hoste/${guestId}`)
  revalidatePath("/manager/hoste")
}
