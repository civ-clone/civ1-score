"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const WorldPeaceRegistry_1 = require("@civ-clone/core-score/WorldPeaceRegistry");
const Defeated_1 = require("@civ-clone/core-unit/Rules/Defeated");
const Effect_1 = require("@civ-clone/core-rule/Effect");
// Any fight between two civilizations ends the world's peace, whoever they are (v474.05, `Segment_29f3.cs` L758-783,
//  the combat routine). v474.05 leaves barbarians out; there are none yet (civ-clone/web-renderer#169).
const getRules = (worldPeaceRegistry = WorldPeaceRegistry_1.instance) => [
    new Defeated_1.default('civ1-score:unit/defeated/world-peace', new Effect_1.default(() => {
        if (worldPeaceRegistry.turns() > 0) {
            worldPeaceRegistry.get().reset();
        }
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=defeated.js.map