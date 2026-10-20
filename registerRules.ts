import { Game, defaultGame } from '@civ-clone/core-game';
import playerScore from './Rules/Player/score';
import turnStart from './Rules/Turn/start';
import unitDefeated from './Rules/Unit/defeated';

export const register = (game: Game): void =>
  game.rules.register(
    ...playerScore(
      game.cities,
      game.cityGrowth,
      game.specialists,
      game.playerTradeRates,
      game.wonders,
      game.spaceships,
      game.tileImprovements,
      game.worldPeace,
      game.year,
      game.playerResearch
    ),
    ...turnStart(game.worldPeace, game.year),
    ...unitDefeated(game.worldPeace)
  );

// The plugin loader imports each package for this side effect.
register(defaultGame);

export default register;
