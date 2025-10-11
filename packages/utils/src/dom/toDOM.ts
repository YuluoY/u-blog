export type ToDOM = string | HTMLElement | { value: HTMLElement | null }

export const toDOM = (el: ToDOM): HTMLElement | null =>
{
  if (typeof el === 'string') {
    return document.querySelector(el)
  } else if (el instanceof HTMLElement) {
    return el
  } else if (el.value) {
    return el.value
  } else {
    return null
  }
}