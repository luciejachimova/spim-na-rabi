import { createNavigation } from "next-intl/navigation"
import { routing } from "./routing"

// Locale-aware navigation helpers. Use these instead of next/link and
// next/navigation on the public site so hrefs resolve to the localized
// pathnames declared in routing.ts.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
