/**
 * Text that changes while the tour runs, safe under browser page translation.
 *
 * Chrome's "Translate this page" swaps text nodes for its own <font> elements. React then holds
 * text nodes that are no longer in the page: updating one changes nothing on screen (stale
 * translation), and removing one throws "Failed to execute 'removeChild' on 'Node'". Keying a
 * span by its text makes React replace the whole element instead, which translation survives,
 * and the new words get translated too.
 */
export function TourText({ children }: { children: string }) {
  return <span key={children}>{children}</span>;
}
