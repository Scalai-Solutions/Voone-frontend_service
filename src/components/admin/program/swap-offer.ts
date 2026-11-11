/**
 * Whether a milestone row offers "Cambiar".
 *
 * Every reward and every perk can be changed (a perk becomes a reward holding the choice); a tier
 * step never can. Offered whenever the screen can swap at all: double points and a free text need
 * nothing from the catalogue, so there is always something to change it to.
 */
export const offersSwap = ({
  hasReward,
  hasPerk = false,
  canSwap,
}: {
  hasReward: boolean;
  hasPerk?: boolean;
  canSwap: boolean;
}): boolean => (hasReward || hasPerk) && canSwap;
