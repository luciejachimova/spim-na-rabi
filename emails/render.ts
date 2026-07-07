import type { ReactElement } from "react"

// Dynamically imported: Next.js's App Router build statically forbids any
// reachable-from-app/ import of react-dom/server, even from a plain route
// handler that's never part of an RSC tree (which is what this actually is
// — sendLifecycleEmail is called from API routes, not rendered by Next's own
// SSR pipeline). A dynamic import is the standard workaround.
export async function renderEmail(element: ReactElement) {
  const { renderToStaticMarkup } = await import("react-dom/server")
  return `<!DOCTYPE html>\n${renderToStaticMarkup(element)}`
}
