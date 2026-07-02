declare module "node-ical" {
  export interface ICalEvent {
    type?: string
    uid?: string
    start?: Date | string
    end?: Date | string
    summary?: string
    description?: string
    status?: string
  }

  export function parseICS(input: string): Record<string, unknown>

  export const async: {
    fromURL(url: string): Promise<Record<string, unknown>>
  }

  const nodeIcal: {
    parseICS: typeof parseICS
    async: typeof async
  }

  export default nodeIcal
}
