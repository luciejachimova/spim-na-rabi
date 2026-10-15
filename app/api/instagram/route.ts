import { NextResponse } from "next/server"
import { fetchRecentPosts } from "@/lib/instagram"

export const runtime = "nodejs"

// Public, unauthenticated: returns only what the Instagram profile already
// shows publicly. The access token never leaves the server — the homepage grid
// reads this endpoint instead of talking to Meta itself.
export async function GET() {
  const posts = await fetchRecentPosts(8)

  return NextResponse.json(
    { posts },
    // Served from the edge cache for an hour, and allowed to serve the stale
    // copy for a day while it refreshes, so a Meta hiccup never empties the
    // section for visitors.
    { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
  )
}
