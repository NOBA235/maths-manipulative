import assert from "node:assert/strict";
import { evaluateMission } from "../lib/evaluate";
import { missions } from "../lib/missions";
import { buildCountingPrompt, buildPrompt, schemaForMission } from "../lib/prompts";

const byId = Object.fromEntries(missions.map((mission) => [mission.id, mission]));

assert.equal(missions.length, 8);

for (const mission of missions) {
  const prompt = buildPrompt(mission);
  const schema = schemaForMission(mission);

  assert.match(prompt, /Return only valid JSON/);
  assert.ok(schema.required.includes("confident"));
}

const sharedCountingMissions = [
  byId["add-7-8"],
  byId["sub-15-to-9"],
  byId["multi-6-by-4"],
  byId["divide-20-by-4"],
  byId["skip-5-to-25"],
];

for (const mission of sharedCountingMissions) {
  assert.ok(buildCountingPrompt(mission).includes("hands-on math manipulative"));
}

assert.equal(
  evaluateMission(byId["add-7-8"], { count: 15, confident: true }).status,
  "correct",
);
assert.equal(
  evaluateMission(byId["sub-15-to-9"], { count: 8, confident: true }).status,
  "incorrect",
);
assert.equal(
  evaluateMission(byId["multi-6-by-4"], {
    rows: 6,
    cols: 4,
    product: 24,
    confident: true,
  }).status,
  "correct",
);
assert.equal(
  evaluateMission(byId["divide-20-by-4"], {
    groups: 4,
    per_group: 5,
    equal: false,
    confident: true,
  }).status,
  "incorrect",
);
assert.equal(
  evaluateMission(byId["fraction-fourths"], {
    parts_detected: 4,
    roughly_equal: true,
    confident: true,
  }).status,
  "correct",
);
assert.equal(
  evaluateMission(byId["geometry-right-angle"], {
    angle_estimate_deg: 101,
    confident: true,
  }).status,
  "incorrect",
);
assert.equal(
  evaluateMission(
    byId["measure-pencil"],
    { measured_length_cm: 17.2, confident: true },
    "16",
  ).status,
  "correct",
);
assert.equal(
  evaluateMission(byId["skip-5-to-25"], {
    groups: 5,
    per_group: 5,
    total: 25,
    confident: true,
  }).status,
  "correct",
);
assert.equal(
  evaluateMission(byId["skip-5-to-25"], {
    groups: 5,
    per_group: 5,
    total: 24,
    confident: false,
  }).status,
  "retake",
);

console.log("Verifier prompt and comparison tests passed.");
