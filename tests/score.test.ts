import { score, scoreTerms } from '@civ-clone/core-score/lib/score';
import { FutureTechnology } from '@civ-clone/civ1-science/Advances';
import Happiness from '@civ-clone/base-city-yield-happiness/Happiness';
import Luxuries from '@civ-clone/base-trade-rate-luxuries/Luxuries';
import Player from '@civ-clone/core-player/Player';
import PlayerTradeRates from '@civ-clone/core-trade-rate/PlayerTradeRates';
import Pollution from '@civ-clone/base-tile-improvement-pollution/Pollution';
import Population from '@civ-clone/base-spaceship-yield-population/Population';
import Research from '@civ-clone/base-trade-rate-research/Research';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tax from '@civ-clone/base-trade-rate-tax/Tax';
import Unhappiness from '@civ-clone/base-city-yield-unhappiness/Unhappiness';
import WorldPeaceRegistry from '@civ-clone/core-score/WorldPeaceRegistry';
import { expect } from 'chai';
import playerScore from '../Rules/Player/score';

// Stand-ins for the registries: each rule only asks them for one player's entries.
const setUp = ({
  research = 70,
  tax = 30,
  luxuries = 0,
  wonders = 0,
  polluted = 0,
  peace = 0,
  year = 1000,
  futureTechnologies = 0,
  spaceship = null as null | {
    successful: boolean | null;
    habitation: number;
    chance: number;
  },
} = {}) => {
  const ruleRegistry = new RuleRegistry(),
    player = new Player(ruleRegistry),
    rates = new PlayerTradeRates(
      player,
      new Tax(tax),
      new Luxuries(luxuries),
      new Research(research)
    ),
    // A size 4 city with 2 unhappy citizens, where every 20% of luxuries makes one citizen happier.
    city = {
      yields: () => [
        new Unhappiness(2),
        new Happiness(Math.floor(rates.get(Luxuries).value() / 20)),
      ],
    },
    cityGrowth = { size: () => 4, city: () => city },
    worldPeaceRegistry = new WorldPeaceRegistry();

  for (let turn = 0; turn < peace; turn++) {
    worldPeaceRegistry.get().increment();
  }

  ruleRegistry.register(
    ...playerScore(
      { getByPlayer: () => [city] } as any,
      { getByCity: () => cityGrowth } as any,
      { getByCity: () => [] } as any,
      { getByPlayer: () => rates } as any,
      { getByPlayer: () => new Array(wonders) } as any,
      {
        filter: (predicate: (spaceship: any) => boolean) =>
          (spaceship
            ? [
                {
                  player: () => player,
                  successful: () => spaceship.successful,
                  chanceOfSuccess: () => spaceship.chance,
                  yields: () =>
                    new Array(spaceship.habitation)
                      .fill(0)
                      .map(() => new Population(10000)),
                },
              ]
            : []
          ).filter(predicate),
      } as any,
      {
        filter: (predicate: (improvement: any) => boolean) =>
          new Array(polluted)
            .fill(0)
            .map(() => Object.create(Pollution.prototype))
            .filter(predicate),
      } as any,
      worldPeaceRegistry,
      { value: () => year } as any,
      {
        getByPlayer: () => ({
          complete: () =>
            new Array(futureTechnologies)
              .fill(0)
              .map(() => Object.create(FutureTechnology.prototype)),
        }),
      } as any
    )
  );

  return { player, rates, ruleRegistry };
};

const term = (
  name: string,
  { player, ruleRegistry }: ReturnType<typeof setUp>
): number =>
  scoreTerms(player, ruleRegistry).find(({ term }) => term === name)!.value;

describe('civ1-score', (): void => {
  it('lists the terms in the order of the score screen', (): void => {
    const { player, ruleRegistry } = setUp();

    expect(scoreTerms(player, ruleRegistry).map(({ term }) => term)).to.eql([
      'citizens',
      'wonders',
      'spaceship',
      'pollution',
      'peace',
      'future-technology',
    ]);
  });

  it('counts the citizens at 40% luxuries, whatever the rates are', (): void => {
    // 2 happiness at 40%: 2 happy, 2 unhappy, so 4 + 2 − 2.
    expect(term('citizens', setUp())).to.equal(4);
    expect(
      term('citizens', setUp({ luxuries: 80, research: 20, tax: 0 }))
    ).to.equal(4);
  });

  it("puts the player's rates back exactly", (): void => {
    const context = setUp({ research: 70, tax: 30 });

    term('citizens', context);

    expect(context.rates.get(Research).value()).to.equal(70);
    expect(context.rates.get(Tax).value()).to.equal(30);
    expect(context.rates.get(Luxuries).value()).to.equal(0);
  });

  it('counts 20 for each Wonder', (): void => {
    expect(term('wonders', setUp({ wonders: 3 }))).to.equal(60);
  });

  it('takes 10 for each polluted square', (): void => {
    expect(term('pollution', setUp())).to.equal(0);
    expect(term('pollution', setUp({ polluted: 4 }))).to.equal(-40);
  });

  it('counts 3 for each turn of peace in the years AD, at most 100', (): void => {
    expect(term('peace', setUp({ peace: 10 }))).to.equal(30);
    expect(term('peace', setUp({ peace: 40 }))).to.equal(100);
    expect(term('peace', setUp({ peace: 10, year: -500 }))).to.equal(0);
  });

  it('counts 5 for each Future Technology', (): void => {
    expect(
      term('future-technology', setUp({ futureTechnologies: 3 }))
    ).to.equal(15);
  });

  it('counts a landed spaceship by its population and chance of success', (): void => {
    const spaceship = { successful: true, habitation: 2, chance: 0.8 };

    // 2 × 80 / 2
    expect(term('spaceship', setUp({ spaceship }))).to.equal(80);
    expect(
      term(
        'spaceship',
        setUp({ spaceship: { ...spaceship, successful: null } })
      )
    ).to.equal(0);
  });

  it('is never below 0', (): void => {
    const { player, ruleRegistry } = setUp({ polluted: 10 });

    expect(score(player, ruleRegistry)).to.equal(0);
  });
});
