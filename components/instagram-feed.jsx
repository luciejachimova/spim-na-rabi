"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { SectionHeader } from "./ui"

const INSTAGRAM_URL = "https://www.instagram.com/spimnarabi/"

// The posts are fetched from our own /api/instagram rather than rendered on the
// server because the homepage is a client component. They are decorative, so
// nothing is lost by them arriving a moment later — and until they do, the grid
// holds its space with placeholders instead of making the page jump.
export default function InstagramFeed() {
  const t = useTranslations("home")
  const [posts, setPosts] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetch("/api/instagram")
      .then((response) => (response.ok ? response.json() : { posts: [] }))
      .then((data) => {
        if (!cancelled) setPosts(data.posts ?? [])
      })
      .catch(() => {
        if (!cancelled) setPosts([])
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Render nothing until there is something to render. Holding the space with
  // placeholders would mean every visitor sees an empty grid flash past on a
  // site with no token configured, or whenever Instagram is unreachable — and
  // the section sits above the footer, so appearing late shifts nothing anyone
  // is looking at.
  if (posts === null || posts.length === 0) {
    return null
  }

  return (
    <section id="instagram" className="py-24 md:py-[100px]">
      <div className="mx-auto max-w-[1100px] px-8">
        <div className="js-fade-in">
          <SectionHeader label={t("instagramLabel")} title={t("instagramTitle")} align="center" />
        </div>

        <div className="mt-16 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {posts.map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block overflow-hidden"
            >
              <img
                src={post.imageUrl}
                alt={post.caption ? post.caption.slice(0, 120) : t("instagramPhotoAlt")}
                loading="lazy"
                className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="pointer-events-none absolute inset-0 bg-dark/0 transition-colors duration-300 group-hover:bg-dark/20" />
            </a>
          ))}
        </div>

        <div className="mt-10 text-center js-fade-in">
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-[2px] border border-dark px-[1.6rem] py-[0.65rem] text-[0.72rem] font-medium uppercase tracking-[0.18em] text-dark transition-colors duration-200 hover:bg-dark hover:text-cream"
          >
            {t("instagramCta")}
          </a>
        </div>
      </div>
    </section>
  )
}
