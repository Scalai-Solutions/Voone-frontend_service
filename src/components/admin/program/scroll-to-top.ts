/**
 * Scrolls to the very top of the page that `from` sits in.
 *
 * The admin shell is a fixed-height frame whose `<main>` is what scrolls, so `window.scrollTo`
 * alone does nothing there. Every scrollable ancestor is reset, and the window too for layouts
 * where the document itself scrolls. Instant, never animated: a step change is a new screen.
 */
export const scrollToTop = (from: Element | null): void => {
  for (let node = from?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);

    if (
      (overflowY === "auto" || overflowY === "scroll") &&
      node.scrollHeight > node.clientHeight
    ) {
      node.scrollTo({ top: 0, behavior: "instant" });
    }
  }

  window.scrollTo({ top: 0, behavior: "instant" });
};
