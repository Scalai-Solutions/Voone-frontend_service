/**
 * Where a tooltip bubble goes. The bubble is drawn with `position: fixed` outside the rows'
 * `overflow-hidden` cards, so this works in viewport coordinates: centred on the anchor on the
 * wanted side, flipped when that side has no room, and kept inside the viewport horizontally.
 */

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

export type TipSide = "top" | "bottom";

export const TIP_GAP = 8;
export const TIP_MARGIN = 8;

export function placeTooltip(
  anchor: Box,
  tip: Size,
  viewport: Size,
  side: TipSide,
): { left: number; top: number; side: TipSide } {
  const above = anchor.top - TIP_GAP - tip.height;
  const below = anchor.top + anchor.height + TIP_GAP;
  const fitsAbove = above >= TIP_MARGIN;
  const fitsBelow = below + tip.height <= viewport.height - TIP_MARGIN;
  const chosen: TipSide =
    side === "top" ? (fitsAbove || !fitsBelow ? "top" : "bottom") : fitsBelow || !fitsAbove ? "bottom" : "top";
  const centred = anchor.left + anchor.width / 2 - tip.width / 2;
  const maxLeft = viewport.width - TIP_MARGIN - tip.width;
  // Min last: a bubble wider than the viewport pins to the left margin.
  const left = Math.max(TIP_MARGIN, Math.min(centred, maxLeft));

  return { left, top: chosen === "top" ? above : below, side: chosen };
}
