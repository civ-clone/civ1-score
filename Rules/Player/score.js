"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.SCORE_LUXURY_RATE = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const PlayerResearchRegistry_1 = require("@civ-clone/core-science/PlayerResearchRegistry");
const PlayerTradeRatesRegistry_1 = require("@civ-clone/core-trade-rate/PlayerTradeRatesRegistry");
const SpaceshipRegistry_1 = require("@civ-clone/core-spaceship/SpaceshipRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const WonderRegistry_1 = require("@civ-clone/core-wonder/WonderRegistry");
const WorldPeaceRegistry_1 = require("@civ-clone/core-score/WorldPeaceRegistry");
const Year_1 = require("@civ-clone/core-game-year/Year");
const calculateCitizenState_1 = require("@civ-clone/civ1-city-happiness/lib/calculateCitizenState");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Advances_1 = require("@civ-clone/civ1-science/Advances");
const Luxuries_1 = require("@civ-clone/base-trade-rate-luxuries/Luxuries");
const Pollution_1 = require("@civ-clone/base-tile-improvement-pollution/Pollution");
const Population_1 = require("@civ-clone/base-spaceship-yield-population/Population");
const Research_1 = require("@civ-clone/base-trade-rate-research/Research");
const Score_1 = require("@civ-clone/core-score/Rules/Score");
const Tax_1 = require("@civ-clone/base-trade-rate-tax/Tax");
// Civilization's Civilization Score, as v474.05 adds it up (OpenCivOne's decompile, `Overlay_20.cs`
//  `F20_0000_0ca9_ShowCivilizationScorePopup`, L1144-1655; Rome on 640K a Day pp325-328). v474.05 only ever shows the
//  human their own score, so it reads the spaceship and Future Technologies of the human whoever is scored; here each
//  player is scored with their own.
// The luxury rate the citizens are counted at. v474.05 sets the tax rate to `6 − science` (in tenths) for the count,
//  which leaves luxuries at 40%, then puts it back.
exports.SCORE_LUXURY_RATE = 40;
// Each happy citizen counts 2, a content one or a specialist 1, an unhappy one nothing: the city's size, plus its happy
//  citizens, less its unhappy ones. Counted at 40% luxuries, with science kept where it is when it fits (only luxuries
//  change a citizen's mood) and tax the rest, and the player's rates put back afterwards.
const citizens = (player, cityRegistry, cityGrowthRegistry, specialistRegistry, playerTradeRatesRegistry) => {
    const count = () => cityRegistry.getByPlayer(player).reduce((total, city) => {
        const cityGrowth = cityGrowthRegistry.getByCity(city), [unhappy, , happy] = (0, calculateCitizenState_1.citizenSummary)((0, calculateCitizenState_1.calculateCitizenState)(cityGrowth, city.yields(), specialistRegistry));
        return total + cityGrowth.size() + happy - unhappy;
    }, 0);
    let luxuries, research, tax, rates = [];
    try {
        const playerTradeRates = playerTradeRatesRegistry.getByPlayer(player);
        rates = playerTradeRates.all();
        luxuries = playerTradeRates.get(Luxuries_1.default);
        research = playerTradeRates.get(Research_1.default);
        tax = playerTradeRates.get(Tax_1.default);
    }
    catch (e) {
        // A player with no trade rates (yet) is counted as they are.
    }
    if (!luxuries || !research || !tax) {
        return count();
    }
    const saved = rates.map((rate) => [
        rate,
        rate.value(),
    ]), science = Math.min(research.value(), 100 - exports.SCORE_LUXURY_RATE);
    try {
        luxuries.set(exports.SCORE_LUXURY_RATE);
        research.set(science);
        tax.set(100 - exports.SCORE_LUXURY_RATE - science);
        return count();
    }
    finally {
        saved.forEach(([rate, value]) => rate.set(value));
    }
};
const getRules = (cityRegistry = CityRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, playerTradeRatesRegistry = PlayerTradeRatesRegistry_1.instance, wonderRegistry = WonderRegistry_1.instance, spaceshipRegistry = SpaceshipRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, worldPeaceRegistry = WorldPeaceRegistry_1.instance, year = Year_1.instance, playerResearchRegistry = PlayerResearchRegistry_1.instance) => [
    new Score_1.default('civ1-score:player/score/citizens', new Effect_1.default((player) => ({
        term: 'citizens',
        value: citizens(player, cityRegistry, cityGrowthRegistry, specialistRegistry, playerTradeRatesRegistry),
    }))),
    // 20 for each Wonder, obsolete or not.
    new Score_1.default('civ1-score:player/score/wonders', new Effect_1.default((player) => ({
        term: 'wonders',
        value: 20 * wonderRegistry.getByPlayer(player).length,
    }))),
    // A spaceship that has landed: its population in tens of thousands (one Habitation module each) × its chance of
    //  success as a percentage, halved, so 50 a module at 100%. v474.05 counts it in the year it arrives.
    new Score_1.default('civ1-score:player/score/spaceship', new Effect_1.default((player) => ({
        term: 'spaceship',
        value: spaceshipRegistry
            .filter((spaceship) => spaceship.player() === player && spaceship.successful() === true)
            .reduce((total, spaceship) => {
            const population = spaceship
                .yields()
                .filter((shipYield) => shipYield instanceof Population_1.default)
                .reduce((sum, shipYield) => sum + shipYield.value(), 0);
            return (total +
                Math.max(0, Math.floor(((population / 10000) *
                    Math.round(spaceship.chanceOfSuccess() * 100)) /
                    2)));
        }, 0),
    }))),
    // −10 for each polluted square anywhere in the world, the same for every player.
    new Score_1.default('civ1-score:player/score/pollution', new Effect_1.default(() => ({
        term: 'pollution',
        value: 0 -
            10 *
                tileImprovementRegistry.filter((improvement) => improvement instanceof Pollution_1.default).length,
    }))),
    // 3 for each turn of world peace, at most 100, and only in the years AD.
    new Score_1.default('civ1-score:player/score/peace', new Effect_1.default(() => ({
        term: 'peace',
        value: year.value() > 0 ? Math.min(3 * worldPeaceRegistry.turns(), 100) : 0,
    }))),
    // 5 for each Future Technology.
    new Score_1.default('civ1-score:player/score/future-technology', new Effect_1.default((player) => {
        let futureTechnologies = 0;
        try {
            futureTechnologies = playerResearchRegistry
                .getByPlayer(player)
                .complete()
                .filter((advance) => advance instanceof Advances_1.FutureTechnology).length;
        }
        catch (e) {
            // A player with no research (yet) knows no Future Technology.
        }
        return {
            term: 'future-technology',
            value: 5 * futureTechnologies,
        };
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=score.js.map