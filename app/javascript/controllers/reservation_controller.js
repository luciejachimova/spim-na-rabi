import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal"]

  open(event) {
    event.preventDefault()

    this.modalTarget.classList.remove("hidden")
    this.modalTarget.classList.add("flex")
    this.modalTarget.setAttribute("aria-hidden", "false")
    document.documentElement.classList.add("overflow-hidden")
  }

  close() {
    this.modalTarget.classList.add("hidden")
    this.modalTarget.classList.remove("flex")
    this.modalTarget.setAttribute("aria-hidden", "true")
    document.documentElement.classList.remove("overflow-hidden")
  }

  closeOnBackdrop(event) {
    if (event.target === this.modalTarget) this.close()
  }
}
