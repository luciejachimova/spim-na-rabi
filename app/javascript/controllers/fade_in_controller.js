import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.observer = new IntersectionObserver(this.reveal.bind(this), {
      threshold: 0.14,
      rootMargin: "0px 0px -40px 0px",
    })

    this.items.forEach((item) => {
      item.classList.remove("js-fade-in--visible")
      this.observer.observe(item)
    })
  }

  disconnect() {
    if (this.observer) this.observer.disconnect()
  }

  reveal(entries) {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return

      entry.target.classList.add("js-fade-in--visible")
      this.observer.unobserve(entry.target)
    })
  }

  get items() {
    return Array.from(this.element.querySelectorAll(".js-fade-in"))
  }
}
