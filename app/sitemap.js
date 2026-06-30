const baseUrl = "https://spimnarabi.cz"

export default function sitemap() {
  return [
    { url: baseUrl, changeFrequency: "monthly", priority: 1 },
    { url: `${baseUrl}/o-nas`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${baseUrl}/galerie`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/cenik`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/kontakt`, changeFrequency: "yearly", priority: 0.8 },
  ]
}
