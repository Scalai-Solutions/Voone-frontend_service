/**
 * Whether a milestone row offers "Cambiar".
 *
 * Only a reward can be swapped: the backend refuses a perk milestone ("Ese hito no tiene un premio
 * que se pueda cambiar"), so the button is never offered there. A reward offers it whenever the
 * screen can swap at all: double points and a free text need nothing from the catalogue, so there
 * is always something to change it to.
 */
export const offersSwap = ({
  hasReward,
  canSwap,
}: {
  hasReward: boolean;
  canSwap: boolean;
}): boolean => hasReward && canSwap;
