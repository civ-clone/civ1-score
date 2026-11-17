import {
  WorldPeaceRegistry,
  instance as worldPeaceRegistryInstance,
} from '@civ-clone/core-score/WorldPeaceRegistry';
import Criterion from '@civ-clone/core-rule/Criterion';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Effect from '@civ-clone/core-rule/Effect';
import Unit from '@civ-clone/core-unit/Unit';
import isBarbarian from '@civ-clone/base-civilization-barbarian/isBarbarian';

// Any fight between two civilizations ends the world's peace, whoever they are, but not a fight with the Barbarians
//  (v474.05 `battle`, `BATTLE.C` ~156: `if (attacker_civ && defender_civ) player_peace_run = 0;`, and the Barbarians
//  are civ 0; civ-clone/web-renderer#956).
export const getRules: (
  worldPeaceRegistry?: WorldPeaceRegistry
) => Defeated[] = (
  worldPeaceRegistry: WorldPeaceRegistry = worldPeaceRegistryInstance
): Defeated[] => [
  new Defeated(
    'civ1-score:unit/defeated/world-peace',
    new Criterion(
      (defeated: Unit | null, by: Unit | null): boolean =>
        ![defeated, by].some(
          (unit: Unit | null): boolean =>
            unit !== null && isBarbarian(unit.player())
        )
    ),
    new Effect((): void => {
      if (worldPeaceRegistry.turns() > 0) {
        worldPeaceRegistry.get().reset();
      }
    })
  ),
];

export default getRules;
