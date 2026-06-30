export default function manifest() {
  return {
    name: "Spim na Rabí",
    short_name: "Spim na Rabí",
    description: "Studio a loft pod hradem Rabí v Pošumaví.",
    start_url: "/",
    display: "standalone",
    background_color: "#E8E1D7",
    theme_color: "#E8E1D7",
    lang: "cs",
    icons: [
      {
        src: "/images/spim-na-rabi-favicon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
