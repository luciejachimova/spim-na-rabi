export class ReservationError extends Error {}

// `code` (optional) is a stable key into the "errors" message namespace so
// public API routes can translate the failure into the guest's language. The
// Czech `message` remains for admin callers (admin UI stays Czech) and logs.
export class ReservationValidationError extends ReservationError {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.code = code
  }
}

export class ReservationConflictError extends ReservationError {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.code = code
  }
}

export class ReservationNotFoundError extends ReservationError {}
