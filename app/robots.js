export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: "https://spimnarabi.cz/sitemap.xml",
    host: "https://spimnarabi.cz",
  }
}
