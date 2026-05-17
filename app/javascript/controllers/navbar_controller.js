import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button", "menu", "bar1", "bar2", "bar3"]
  static classes = ["scrolled"]

  connect() {
    this.onScroll = this.updateShadow.bind(this)
    window.addEventListener("scroll", this.onScroll, { passive: true })
    this.updateShadow()
  }

  disconnect() {
    window.removeEventListener("scroll", this.onScroll)
  }

  toggleMenu() {
    this.isOpen ? this.close() : this.open()
  }

  open() {
    this.menuTarget.classList.remove("max-md:hidden")
    if (this.hasButtonTarget) this.buttonTarget.setAttribute("aria-expanded", "true")
    this.bar1Target.classList.add("translate-y-[6.5px]", "rotate-45")
    this.bar2Target.classList.add("opacity-0")
    this.bar3Target.classList.add("-translate-y-[6.5px]", "-rotate-45")
  }

  close() {
    if (!this.hasMenuTarget) return

    this.menuTarget.classList.add("max-md:hidden")
    if (this.hasButtonTarget) this.buttonTarget.setAttribute("aria-expanded", "false")
    this.bar1Target.classList.remove("translate-y-[6.5px]", "rotate-45")
    this.bar2Target.classList.remove("opacity-0")
    this.bar3Target.classList.remove("-translate-y-[6.5px]", "-rotate-45")
  }

  updateShadow() {
    if (!this.hasScrolledClass) return

    if (window.scrollY > 8) {
      this.element.classList.add(...this.scrolledClasses)
    } else {
      this.element.classList.remove(...this.scrolledClasses)
    }
  }

  get isOpen() {
    return this.hasMenuTarget && !this.menuTarget.classList.contains("max-md:hidden")
  }
}
