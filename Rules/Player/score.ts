import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  PlayerResearchRegistry,
  instance as playerResearchRegistryInstance,
} from '@civ-clone/core-science/PlayerResearchRegistry';
import {
  PlayerTradeRatesRegistry,
  instance as playerTradeRatesRegistryInstance,
} from '@civ-clone/core-trade-rate/PlayerTradeRatesRegistry';
import {
  SpaceshipRegistry,
  instance as spaceshipRegistryInstance,
} from '@civ-clone/core-spaceship/SpaceshipRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  WonderRegistry,
  instance as wonderRegistryInstance,
} from '@civ-clone/core-wonder/WonderRegistry';
import {
  WorldPeaceRegistry,
  instance as worldPeaceRegistryInstance,
} from '@civ-clone/core-score/WorldPeaceRegistry';
import { Year, instance as yearInstance } from '@civ-clone/core-game-year/Year';
import {
  calculateCitizenState,
  citizenSummary,
} from '@civ-clone/civ1-city-happiness/lib/calculateCitizenState';
import City from '@civ-clone/core-city/City';
import Effect from '@civ-clone/core-rule/Effect';
import { FutureTechnology } from '@civ-clone/civ1-science/Advances';
import { IScoreTerm } from '@civ-clone/core-score/Rules/Score';
import Luxuries from '@civ-clone/base-trade-rate-luxuries/Luxuries';
import Player from '@civ-clone/core-player/Player';
import Pollution from '@civ-clone/base-tile-improvement-pollution/Pollution';
import Population from '@civ-clone/base-spaceship-yield-population/Population';
import Research from '@civ-clone/base-trade-rate-research/Research';
import Score from '@civ-clone/core-score/Rules/Score';
import Spaceship from '@civ-clone/core-spaceship/Spaceship';
import Tax from '@civ-clone/base-trade-rate-tax/Tax';
import TradeRate from '@civ-clone/core-trade-rate/TradeRate';

// Civilization's Civilization Score, as v474.05 adds it up (OpenCivOne's decompile, `Overlay_20.cs`
//  `F20_0000_0ca9_ShowCivilizationScorePopup`, L1144-1655; Rome on 640K a Day pp325-328). v474.05 only ever shows the
//  human their own score, so it reads the spaceship and Future Technologies of the human whoever is scored; here each
//  player is scored with their own.

// The luxury rate the citizens are counted at. v474.05 sets the tax rate to `6 − science` (in tenths) for the count,
//  which leaves luxuries at 40%, then puts it back.
export const SCORE_LUXURY_RATE = 40;

// Each happy citizen counts 2, a content one or a specialist 1, an unhappy one nothing: the city's size, plus its happy
//  citizens, less its unhappy ones. Counted at 40% luxuries, with science kept where it is when it fits (only luxuries
//  change a citizen's mood) and tax the rest, and the player's rates put back afterwards.
const citizens = (
  player: Player,
  cityRegistry: CityRegistry,
  cityGrowthRegistry: CityGrowthRegistry,
  specialistRegistry: SpecialistRegistry,
  playerTradeRatesRegistry: PlayerTradeRatesRegistry
): number => {
  const count = (): number =>
    cityRegistry.getByPlayer(player).reduce((total: number, city: City) => {
      const cityGrowth = cityGrowthRegistry.getByCity(city),
        [unhappy, , happy] = citizenSummary(
          calculateCitizenState(cityGrowth, city.yields(), specialistRegistry)
        );

      return total + cityGrowth.size() + happy - unhappy;
    }, 0);

  let luxuries: TradeRate | undefined,
    research: TradeRate | undefined,
    tax: TradeRate | undefined,
    rates: TradeRate[] = [];

  try {
    const playerTradeRates = playerTradeRatesRegistry.getByPlayer(player);

    rates = playerTradeRates.all();
    luxuries = playerTradeRates.get(Luxuries);
    research = playerTradeRates.get(Research);
    tax = playerTradeRates.get(Tax);
  } catch (e) {
    // A player with no trade rates (yet) is counted as they are.
  }

  if (!luxuries || !research || !tax) {
    return count();
  }

  const saved: [TradeRate, number][] = rates.map((rate: TradeRate) => [
      rate,
      rate.value(),
    ]),
    science = Math.min(research.value(), 100 - SCORE_LUXURY_RATE);

  try {
    luxuries.set(SCORE_LUXURY_RATE);
    research.set(science);
    tax.set(100 - SCORE_LUXURY_RATE - science);

    return count();
  } finally {
    saved.forEach(([rate, value]) => rate.set(value));
  }
};

export const getRules: (
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
) => Score[] = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  specialistRegistry: SpecialistRegistry = specialistRegistryInstance,
  playerTradeRatesRegistry: PlayerTradeRatesRegistry = playerTradeRatesRegistryInstance,
  wonderRegistry: WonderRegistry = wonderRegistryInstance,
  spaceshipRegistry: SpaceshipRegistry = spaceshipRegistryInstance,
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  worldPeaceRegistry: WorldPeaceRegistry = worldPeaceRegistryInstance,
  year: Year = yearInstance,
  playerResearchRegistry: PlayerResearchRegistry = playerResearchRegistryInstance
): Score[] => [
  new Score(
    'civ1-score:player/score/citizens',
    new Effect(
      (player: Player): IScoreTerm => ({
        term: 'citizens',
        value: citizens(
          player,
          cityRegistry,
          cityGrowthRegistry,
          specialistRegistry,
          playerTradeRatesRegistry
        ),
      })
    )
  ),

  // 20 for each Wonder, obsolete or not.
  new Score(
    'civ1-score:player/score/wonders',
    new Effect(
      (player: Player): IScoreTerm => ({
        term: 'wonders',
        value: 20 * wonderRegistry.getByPlayer(player).length,
      })
    )
  ),

  // A spaceship that has landed: its population in tens of thousands (one Habitation module each) × its chance of
  //  success as a percentage, halved, so 50 a module at 100%. v474.05 counts it in the year it arrives.
  new Score(
    'civ1-score:player/score/spaceship',
    new Effect(
      (player: Player): IScoreTerm => ({
        term: 'spaceship',
        value: spaceshipRegistry
          .filter(
            (spaceship: Spaceship): boolean =>
              spaceship.player() === player && spaceship.successful() === true
          )
          .reduce((total: number, spaceship: Spaceship): number => {
            const population = spaceship
              .yields()
              .filter((shipYield) => shipYield instanceof Population)
              .reduce((sum, shipYield) => sum + shipYield.value(), 0);

            return (
              total +
              Math.max(
                0,
                Math.floor(
                  ((population / 10000) *
                    Math.round(spaceship.chanceOfSuccess() * 100)) /
                    2
                )
              )
            );
          }, 0),
      })
    )
  ),

  // −10 for each polluted square anywhere in the world, the same for every player.
  new Score(
    'civ1-score:player/score/pollution',
    new Effect(
      (): IScoreTerm => ({
        term: 'pollution',
        value:
          0 -
          10 *
            tileImprovementRegistry.filter(
              (improvement) => improvement instanceof Pollution
            ).length,
      })
    )
  ),

  // 3 for each turn of world peace, at most 100, and only in the years AD.
  new Score(
    'civ1-score:player/score/peace',
    new Effect(
      (): IScoreTerm => ({
        term: 'peace',
        value:
          year.value() > 0 ? Math.min(3 * worldPeaceRegistry.turns(), 100) : 0,
      })
    )
  ),

  // 5 for each Future Technology.
  new Score(
    'civ1-score:player/score/future-technology',
    new Effect((player: Player): IScoreTerm => {
      let futureTechnologies = 0;

      try {
        futureTechnologies = playerResearchRegistry
          .getByPlayer(player)
          .complete()
          .filter((advance) => advance instanceof FutureTechnology).length;
      } catch (e) {
        // A player with no research (yet) knows no Future Technology.
      }

      return {
        term: 'future-technology',
        value: 5 * futureTechnologies,
      };
    })
  ),
];

export default getRules;
