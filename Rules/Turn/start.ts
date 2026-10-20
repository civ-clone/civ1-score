import {
  WorldPeaceRegistry,
  instance as worldPeaceRegistryInstance,
} from '@civ-clone/core-score/WorldPeaceRegistry';
import { Year, instance as yearInstance } from '@civ-clone/core-game-year/Year';
import Effect from '@civ-clone/core-rule/Effect';
import Start from '@civ-clone/core-turn-based-game/Rules/Start';
import Turn from '@civ-clone/core-turn-based-game/Turn';

// A turn of world peace for the Civilization Score, once per turn and only in the years AD (v474.05,
//  `Segment_1238.cs` L165-168). A fight resets it (`Rules/Unit/defeated`).
export const getRules: (
  worldPeaceRegistry?: WorldPeaceRegistry,
  year?: Year
) => Start[] = (
  worldPeaceRegistry: WorldPeaceRegistry = worldPeaceRegistryInstance,
  year: Year = yearInstance
): Start[] => [
  new Start(
    'civ1-score:turn/start/world-peace',
    new Effect((turn: Turn): void => {
      if (year.value(turn.value()) > 0) {
        worldPeaceRegistry.get().increment();
      }
    })
  ),
];

export default getRules;
