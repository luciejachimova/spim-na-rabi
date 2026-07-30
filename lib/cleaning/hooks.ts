// Phase 1 placeholders — deliberately no-ops.
//
// Cleaning tasks arrive in phase 2 (migration M2). The two events they will
// have to react to, though, both originate deep inside code that is risky to
// touch twice: the iCal importer, which runs unattended every 15 minutes, and
// the cancellation path. Calling these hooks now means phase 2 adds the
// cleaning logic *here*, with no second edit to the sync.
//
// Both are intentionally failure-tolerant by contract: a cleaning-side
// problem must never abort a reservation write or fail a whole feed import.
// Callers therefore do not await them for correctness, only for ordering.

import type { ReservationStatus } from "../reservations/types"

export interface ReservationDatesChangedEvent {
  reservationId: number
  apartmentId: number
  previousStartDate: string
  previousEndDate: string
  startDate: string
  endDate: string
}

export interface ReservationCancelledEvent {
  reservationId: number
  apartmentId: number
  /** Status the reservation held at the moment it was cancelled. Phase 2 uses
   * it to decide whether the stay actually happened: a cancelled `confirmed`
   * booking whose dates are already in the past still needs cleaning, an
   * `inquiry` that never became a stay does not. */
  previousStatus: ReservationStatus
  startDate: string
  endDate: string
  reason: string | null
}

// Phase 2: move a pending cleaning to the new departure date. If the cleaning
// is already `done`, leave the historical record alone and create a fresh
// task for the new date instead — never rewrite finished work.
export async function onReservationDatesChanged(_event: ReservationDatesChangedEvent): Promise<void> {
  // no-op until M2
}

// Phase 2: never delete the cleaning outright. Flag it for review and let the
// owner decide — a stay that already happened still has to be cleaned even if
// the reservation is cancelled afterwards.
export async function onReservationCancelled(_event: ReservationCancelledEvent): Promise<void> {
  // no-op until M2
}
