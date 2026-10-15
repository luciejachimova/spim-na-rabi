// Reads the latest posts from the Instagram account shown on the homepage.
//
// Meta shut the old Basic Display API down at the end of 2024; this uses its
// replacement, "Instagram API with Instagram Login", which serves Business and
// Creator accounts from graph.instagram.com. The token is a long-lived one and
// expires after 60 days — see refreshAccessToken() and README.
//
// Everything here fails soft on purpose. A missing token, an expired one or a
// Meta outage must leave the homepage looking deliberate, not broken, so the
// callers get an empty list and the section hides itself.

const GRAPH_URL = "https://graph.instagram.com"
const FIELDS = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp"

// Instagram's CDN links are signed and time-limited, so the response cannot be
// cached for long: an hour keeps us far away from both the link expiry and the
// API's rate limits.
const CACHE_SECONDS = 3600

export interface InstagramPost {
  id: string
  permalink: string
  imageUrl: string
  caption: string | null
  timestamp: string
}

interface RawMedia {
  id: string
  permalink?: string
  media_type?: string
  media_url?: string
  thumbnail_url?: string
  caption?: string
  timestamp?: string
}

// Videos carry their poster frame in thumbnail_url and nothing usable in
// media_url (that is the MP4), so the grid needs the thumbnail for those.
function imageFor(media: RawMedia) {
  return media.media_type === "VIDEO" ? media.thumbnail_url : media.media_url
}

export function isInstagramConfigured() {
  return Boolean(process.env.INSTAGRAM_ACCESS_TOKEN)
}

export async function fetchRecentPosts(limit = 8): Promise<InstagramPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  if (!token) {
    return []
  }

  const url = new URL(`${GRAPH_URL}/me/media`)
  url.searchParams.set("fields", FIELDS)
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("access_token", token)

  let response: Response
  try {
    response = await fetch(url, { next: { revalidate: CACHE_SECONDS } })
  } catch (error) {
    console.error("Instagram: request failed", error)
    return []
  }

  if (!response.ok) {
    // The token expiring is the expected failure here, and it is silent from
    // the outside, so say so loudly enough to find in the logs.
    console.error("Instagram: API returned an error", {
      status: response.status,
      body: await response.text().catch(() => "")
    })
    return []
  }

  const payload = (await response.json()) as { data?: RawMedia[] }

  return (payload.data ?? [])
    .filter((media) => media.permalink && imageFor(media))
    .map((media) => ({
      id: media.id,
      permalink: media.permalink as string,
      imageUrl: imageFor(media) as string,
      caption: media.caption ?? null,
      timestamp: media.timestamp ?? ""
    }))
}

// Long-lived tokens last 60 days and can be swapped for a fresh one at any
// point after they are 24 hours old. The new token replaces the old one, so
// whoever calls this has to persist what it returns.
export async function refreshAccessToken(token: string) {
  const url = new URL(`${GRAPH_URL}/refresh_access_token`)
  url.searchParams.set("grant_type", "ig_refresh_token")
  url.searchParams.set("access_token", token)

  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) {
    throw new Error(`Instagram token refresh failed (${response.status}): ${await response.text()}`)
  }

  return (await response.json()) as { access_token: string; expires_in: number }
}
