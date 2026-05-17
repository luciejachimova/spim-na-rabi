import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.images = Array.from(
        this.element.querySelectorAll("[data-src]")
    )

    this.currentIndex = 0

    this.handleKeydown = this.handleKeydown.bind(this)

    this.touchStartX = 0
    this.touchEndX = 0
  }

  open(event) {
    event.preventDefault()

    const trigger = event.currentTarget

    this.currentIndex = parseInt(
        trigger.dataset.index,
        10
    )

    this.showImage()

    this.lightbox.classList.remove("hidden")
    this.lightbox.classList.add("flex")

    document.documentElement.classList.add(
        "overflow-hidden"
    )

    document.addEventListener(
        "keydown",
        this.handleKeydown
    )

    this.addTouchEvents()
  }

  close() {
    this.lightbox.classList.add("hidden")
    this.lightbox.classList.remove("flex")

    this.image.removeAttribute("src")
    this.image.alt = ""

    document.documentElement.classList.remove(
        "overflow-hidden"
    )

    document.removeEventListener(
        "keydown",
        this.handleKeydown
    )

    this.removeTouchEvents()
  }

  next(event) {
    if (event) event.stopPropagation()

    this.currentIndex =
        (this.currentIndex + 1) %
        this.images.length

    this.showImage()
  }

  prev(event) {
    if (event) event.stopPropagation()

    this.currentIndex =
        (this.currentIndex - 1 + this.images.length) %
        this.images.length

    this.showImage()
  }

  showImage() {
    const current =
        this.images[this.currentIndex]

    this.image.src =
        current.dataset.src

    this.image.alt =
        current.alt || ""
  }

  closeOnBackdrop(event) {
    if (event.target === this.lightbox) {
      this.close()
    }
  }

  handleKeydown(event) {
    switch (event.key) {
      case "ArrowRight":
        this.next()
        break

      case "ArrowLeft":
        this.prev()
        break

      case "Escape":
        this.close()
        break
    }
  }

  addTouchEvents() {
    this.lightbox.addEventListener(
        "touchstart",
        this.handleTouchStart
    )

    this.lightbox.addEventListener(
        "touchend",
        this.handleTouchEnd
    )
  }

  removeTouchEvents() {
    this.lightbox.removeEventListener(
        "touchstart",
        this.handleTouchStart
    )

    this.lightbox.removeEventListener(
        "touchend",
        this.handleTouchEnd
    )
  }

  handleTouchStart = (event) => {
    this.touchStartX =
        event.changedTouches[0].screenX
  }

  handleTouchEnd = (event) => {
    this.touchEndX =
        event.changedTouches[0].screenX

    this.handleSwipe()
  }

  handleSwipe() {
    const swipeDistance =
        this.touchStartX - this.touchEndX

    const minSwipeDistance = 50

    if (
        swipeDistance >
        minSwipeDistance
    ) {
      this.next()
    }

    if (
        swipeDistance <
        -minSwipeDistance
    ) {
      this.prev()
    }
  }

  get lightbox() {
    return document.getElementById(
        "lightbox"
    )
  }

  get image() {
    return document.getElementById(
        "lightbox-img"
    )
  }
}