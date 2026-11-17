"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const WorldPeaceRegistry_1 = require("@civ-clone/core-score/WorldPeaceRegistry");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const isBarbarian_1 = require("@civ-clone/base-civilization-barbarian/isBarbarian");
// Any fight between two civilizations ends the world's peace, whoever they are, but not a fight with the Barbarians
//  (v474.05 `battle`, `BATTLE.C` ~156: `if (attacker_civ && defender_civ) player_peace_run = 0;`, and the Barbarians
//  are civ 0; civ-clone/web-renderer#956).
const getRules = (worldPeaceRegistry = WorldPeaceRegistry_1.instance) => [
    new Defeated_1.default('civ1-score:unit/defeated/world-peace', new Criterion_1.default((defeated, by) => ![defeated, by].some((unit) => unit !== null && (0, isBarbarian_1.default)(unit.player()))), new Effect_1.default(() => {
        if (worldPeaceRegistry.turns() > 0) {
            worldPeaceRegistry.get().reset();
        }
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=defeated.js.map