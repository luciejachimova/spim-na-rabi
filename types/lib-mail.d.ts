declare module "@/lib/mail" {
  export function readJsonBody(request: Request): Promise<unknown | null>
  export function cleanValue(value: unknown): string
  export function validateRequired(body: Record<string, unknown> | null | undefined, fields: string[]): string | null
  export function mailErrorMessage(error: unknown, formName?: string): string
  export function logMailError(error: unknown): void
  export function sendMail(params: { subject: string; replyTo?: string; text: string }): Promise<void>
}
