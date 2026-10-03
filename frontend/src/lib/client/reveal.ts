export function revealAndFocus(element: HTMLElement | null): void {
  if (element === null) {
    return;
  }

  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  const marginTop = Number.parseFloat(style.scrollMarginTop) || 0;
  const marginBottom = Number.parseFloat(style.scrollMarginBottom) || 0;
  const isFullyVisible = rect.top >= marginTop && rect.bottom <= window.innerHeight - marginBottom;

  if (!isFullyVisible) {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior = prefersReducedMotion ? "auto" : "smooth";
    element.scrollIntoView({ block: "start", behavior });
  }

  element.focus({ preventScroll: true });
}
