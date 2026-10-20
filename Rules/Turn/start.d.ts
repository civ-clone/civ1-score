import { WorldPeaceRegistry } from '@civ-clone/core-score/WorldPeaceRegistry';
import { Year } from '@civ-clone/core-game-year/Year';
import Start from '@civ-clone/core-turn-based-game/Rules/Start';
export declare const getRules: (
  worldPeaceRegistry?: WorldPeaceRegistry,
  year?: Year
) => Start[];
export default getRules;
