import {
  WorldPeaceRegistry,
  instance as worldPeaceRegistryInstance,
} from '@civ-clone/core-score/WorldPeaceRegistry';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Effect from '@civ-clone/core-rule/Effect';

// Any fight between two civilizations ends the world's peace, whoever they are (v474.05, `Segment_29f3.cs` L758-783,
//  the combat routine). v474.05 leaves barbarians out; there are none yet (civ-clone/web-renderer#169).
export const getRules: (
  worldPeaceRegistry?: WorldPeaceRegistry
) => Defeated[] = (
  worldPeaceRegistry: WorldPeaceRegistry = worldPeaceRegistryInstance
): Defeated[] => [
  new Defeated(
    'civ1-score:unit/defeated/world-peace',
    new Effect((): void => {
      if (worldPeaceRegistry.turns() > 0) {
        worldPeaceRegistry.get().reset();
      }
    })
  ),
];

export default getRules;
