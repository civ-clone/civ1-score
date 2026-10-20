"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const WorldPeaceRegistry_1 = require("@civ-clone/core-score/WorldPeaceRegistry");
const Year_1 = require("@civ-clone/core-game-year/Year");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Start_1 = require("@civ-clone/core-turn-based-game/Rules/Start");
// A turn of world peace for the Civilization Score, once per turn and only in the years AD (v474.05,
//  `Segment_1238.cs` L165-168). A fight resets it (`Rules/Unit/defeated`).
const getRules = (worldPeaceRegistry = WorldPeaceRegistry_1.instance, year = Year_1.instance) => [
    new Start_1.default('civ1-score:turn/start/world-peace', new Effect_1.default((turn) => {
        if (year.value(turn.value()) > 0) {
            worldPeaceRegistry.get().increment();
        }
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=start.js.map