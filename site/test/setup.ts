import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does not implement the modal <dialog>: mirroring the open attribute and emitting close is enough.
// Behavior that depends on a real showModal() (focus, top layer) is tested in browser mode instead.
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}

// jsdom does not implement popovers either: a popover stays closed there, whatever calls open or close it.
if (!HTMLElement.prototype.hidePopover) {
  HTMLElement.prototype.showPopover = () => {}
  HTMLElement.prototype.hidePopover = () => {}
}

// jsdom does not implement matchMedia: no media query matches by default.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})
