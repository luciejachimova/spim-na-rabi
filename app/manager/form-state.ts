// Kept out of actions.ts because a "use server" module may only export async
// functions — a type export there is a build error waiting to happen.
export interface ManagerFormState {
  error?: string
}

export const EMPTY_FORM_STATE: ManagerFormState = {}
