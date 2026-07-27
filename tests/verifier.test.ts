import assert from "node:assert/strict";
import { evaluateMission } from "../lib/evaluate";
import { missions } from "../lib/missions";
import { buildCountingPrompt, buildPrompt, schemaForMission } from "../lib/prompts";

const byId = Object.fromEntries(missions.map((mission) => [mission.id, mission]));

const confidentEvidence = {
  setup_confident: true,
  result_confident: true,
  setup_summary: "Clear setup",
  result_summary: "Clear result",
};

assert.equal(missions.length, 8);

for (const mission of missions) {
  const prompt = buildPrompt(mission);
  const schema = schemaForMission(mission);

  assert.match(prompt, /Return only valid JSON/);
  assert.match(prompt, /SETUP PHOTO/);
  assert.match(prompt, /RESULT PHOTO/);
  assert.ok(schema.required.includes("setup_confident"));
  assert.ok(schema.required.includes("result_confident"));
  assert.ok(mission.evidence.setup.instruction.length > 0);
  assert.ok(mission.evidence.result.instruction.length > 0);
}

const sharedCountingMissions = [
  byId["add-7-8"],
  byId["sub-15-to-9"],
  byId["multi-6-by-4"],
  byId["divide-20-by-4"],
  byId["skip-5-to-25"],
];

for (const mission of sharedCountingMissions) {
  assert.ok(
    buildCountingPrompt(mission).includes("hands-on math activity"),
  );
}

const correctAddition = evaluateMission(byId["add-7-8"], {
  setup_first_count: 7,
  setup_second_count: 8,
  result_count: 15,
  ...confidentEvidence,
});
assert.equal(correctAddition.status, "correct");
assert.deepEqual(
  correctAddition.checkpoints.map((item) => item.status),
  ["correct", "correct"],
);

const reversedAddition = evaluateMission(byId["add-7-8"], {
  setup_first_count: 8,
  setup_second_count: 7,
  result_count: 15,
  ...confidentEvidence,
});
assert.equal(reversedAddition.status, "correct");

const wrongSetupCorrectResult = evaluateMission(byId["add-7-8"], {
  setup_first_count: 6,
  setup_second_count: 8,
  result_count: 15,
  ...confidentEvidence,
});
assert.equal(wrongSetupCorrectResult.status, "incorrect");
assert.equal(wrongSetupCorrectResult.checkpoints[0].status, "incorrect");
assert.equal(wrongSetupCorrectResult.checkpoints[1].status, "correct");
assert.match(
  wrongSetupCorrectResult.explanation,
  /final result is correct, but the setup does not match/i,
);
assert.match(wrongSetupCorrectResult.explanation, /6 and 8/);

const wrongSubtractionResult = evaluateMission(byId["sub-15-to-9"], {
  setup_count: 15,
  result_count: 8,
  ...confidentEvidence,
});
assert.equal(wrongSubtractionResult.status, "incorrect");
assert.equal(wrongSubtractionResult.checkpoints[0].status, "correct");
assert.equal(wrongSubtractionResult.checkpoints[1].status, "incorrect");

assert.equal(
  evaluateMission(byId["multi-6-by-4"], {
    setup_count: 24,
    result_rows: 6,
    result_cols: 4,
    result_total: 24,
    ...confidentEvidence,
  }).status,
  "correct",
);

assert.equal(
  evaluateMission(byId["divide-20-by-4"], {
    setup_count: 20,
    result_groups: 4,
    result_per_group: 5,
    result_total: 20,
    result_equal: false,
    ...confidentEvidence,
  }).status,
  "incorrect",
);

assert.equal(
  evaluateMission(byId["fraction-fourths"], {
    setup_whole_visible: true,
    result_parts_detected: 4,
    result_roughly_equal: true,
    ...confidentEvidence,
  }).status,
  "correct",
);

assert.equal(
  evaluateMission(byId["geometry-right-angle"], {
    setup_paper_visible: true,
    result_fold_visible: true,
    result_angle_estimate_deg: 101,
    ...confidentEvidence,
  }).status,
  "incorrect",
);

const measurement = evaluateMission(
  byId["measure-pencil"],
  {
    setup_pencil_visible: true,
    setup_ruler_visible: true,
    result_ruler_aligned: true,
    result_measured_length_cm: 17.2,
    ...confidentEvidence,
  },
  "16",
);
assert.equal(measurement.status, "correct");
assert.match(measurement.prediction?.message ?? "", /1.2 cm/);

assert.equal(
  evaluateMission(byId["skip-5-to-25"], {
    setup_count: 25,
    result_groups: 5,
    result_per_group: 5,
    result_total: 25,
    result_equal: true,
    ...confidentEvidence,
  }).status,
  "correct",
);

const resultRetake = evaluateMission(byId["skip-5-to-25"], {
  setup_count: 25,
  result_groups: 5,
  result_per_group: 5,
  result_total: 24,
  result_equal: false,
  ...confidentEvidence,
  result_confident: false,
});
assert.equal(resultRetake.status, "retake");
assert.equal(resultRetake.checkpoints[0].status, "correct");
assert.equal(resultRetake.checkpoints[1].status, "retake");

console.log("Multi-step verifier prompt and comparison tests passed.");
