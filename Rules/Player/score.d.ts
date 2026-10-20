import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { PlayerResearchRegistry } from '@civ-clone/core-science/PlayerResearchRegistry';
import { PlayerTradeRatesRegistry } from '@civ-clone/core-trade-rate/PlayerTradeRatesRegistry';
import { SpaceshipRegistry } from '@civ-clone/core-spaceship/SpaceshipRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { WonderRegistry } from '@civ-clone/core-wonder/WonderRegistry';
import { WorldPeaceRegistry } from '@civ-clone/core-score/WorldPeaceRegistry';
import { Year } from '@civ-clone/core-game-year/Year';
import Score from '@civ-clone/core-score/Rules/Score';
export declare const SCORE_LUXURY_RATE = 40;
export declare const getRules: (
  cityRegistry?: CityRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  specialistRegistry?: SpecialistRegistry,
  playerTradeRatesRegistry?: PlayerTradeRatesRegistry,
  wonderRegistry?: WonderRegistry,
  spaceshipRegistry?: SpaceshipRegistry,
  tileImprovementRegistry?: TileImprovementRegistry,
  worldPeaceRegistry?: WorldPeaceRegistry,
  year?: Year,
  playerResearchRegistry?: PlayerResearchRegistry
) => Score[];
export default getRules;
