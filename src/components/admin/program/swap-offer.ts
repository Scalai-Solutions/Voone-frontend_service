/**
 * Whether a milestone row offers "Cambiar".
 *
 * Only a reward can be swapped: the backend refuses a perk milestone ("Ese hito no tiene un premio
 * que se pueda cambiar"), so the button is never offered there. A reward offers it when the screen
 * can swap at all and there is something to swap to: an engine alternative or a catalogue item.
 */
export const offersSwap = ({
  hasReward,
  canSwap,
  alternatives,
  catalogItems,
}: {
  hasReward: boolean;
  canSwap: boolean;
  alternatives: number;
  catalogItems: number;
}): boolean => hasReward && canSwap && (alternatives > 0 || catalogItems > 0);
