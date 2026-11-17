import Barbarian from '@civ-clone/base-civilization-barbarian/Barbarian';
import Civilization from '@civ-clone/core-civilization/Civilization';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Defeated from '@civ-clone/core-unit/Rules/Defeated';
import Start from '@civ-clone/core-turn-based-game/Rules/Start';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import WorldPeaceRegistry from '@civ-clone/core-score/WorldPeaceRegistry';
import { expect } from 'chai';
import turnStart from '../Rules/Turn/start';
import unitDefeated from '../Rules/Unit/defeated';

const setUp = (yearFor: (turn: number) => number) => {
  const ruleRegistry = new RuleRegistry(),
    worldPeaceRegistry = new WorldPeaceRegistry(),
    turn = new Turn();

  ruleRegistry.register(
    ...turnStart(worldPeaceRegistry, { value: yearFor } as any),
    ...unitDefeated(worldPeaceRegistry)
  );

  return { ruleRegistry, turn, worldPeaceRegistry };
};

describe('world peace', (): void => {
  it('counts a turn of peace at the start of each turn in the years AD', (): void => {
    const { ruleRegistry, turn, worldPeaceRegistry } = setUp((turn) =>
      turn < 3 ? -100 : 100
    );

    for (let i = 0; i < 5; i++) {
      turn.increment();
      ruleRegistry.process(Start, turn);
    }

    // Turns 3, 4 and 5.
    expect(worldPeaceRegistry.turns()).to.equal(3);
  });

  it('is ended by a fight', (): void => {
    const { ruleRegistry, turn, worldPeaceRegistry } = setUp(() => 100);

    turn.increment();
    ruleRegistry.process(Start, turn);
    ruleRegistry.process(Defeated, null as any, null as any, null as any);

    expect(worldPeaceRegistry.turns()).to.equal(0);
  });

  it("doesn't make an entry for a fight before any peace", (): void => {
    const { ruleRegistry, worldPeaceRegistry } = setUp(() => 100);

    ruleRegistry.process(Defeated, null as any, null as any, null as any);

    expect(worldPeaceRegistry.length).to.equal(0);
  });

  // v474.05 counts only a fight between two civilizations; the Barbarians are civ 0 (civ-clone/web-renderer#956).
  const unitOf = (civilization: unknown) =>
    ({ player: () => ({ civilization: () => civilization }) } as any);

  it("isn't ended by a fight with the Barbarians, on either side", (): void => {
    const { ruleRegistry, turn, worldPeaceRegistry } = setUp(() => 100),
      barbarian = unitOf(new Barbarian()),
      civilization = unitOf(new Civilization());

    turn.increment();
    ruleRegistry.process(Start, turn);
    ruleRegistry.process(Defeated, barbarian, civilization, null as any);
    ruleRegistry.process(Defeated, civilization, barbarian, null as any);

    expect(worldPeaceRegistry.turns()).to.equal(1);
  });

  it('is ended by a fight between two civilizations', (): void => {
    const { ruleRegistry, turn, worldPeaceRegistry } = setUp(() => 100);

    turn.increment();
    ruleRegistry.process(Start, turn);
    ruleRegistry.process(
      Defeated,
      unitOf(new Civilization()),
      unitOf(new Civilization()),
      null as any
    );

    expect(worldPeaceRegistry.turns()).to.equal(0);
  });
});
