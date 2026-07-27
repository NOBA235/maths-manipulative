import type { EvidenceStage, Mission } from "@/lib/missions";

type BaseEvidenceVision = {
  setup_confident: boolean;
  result_confident: boolean;
  setup_summary: string;
  result_summary: string;
};

export type AdditionEvidenceVision = BaseEvidenceVision & {
  setup_first_count: number;
  setup_second_count: number;
  result_count: number;
};

export type SubtractionEvidenceVision = BaseEvidenceVision & {
  setup_count: number;
  result_count: number;
};

export type ArrayEvidenceVision = BaseEvidenceVision & {
  setup_count: number;
  result_rows: number;
  result_cols: number;
  result_total: number;
};

export type GroupsEvidenceVision = BaseEvidenceVision & {
  setup_count: number;
  result_groups: number;
  result_per_group: number;
  result_total: number;
  result_equal: boolean;
};

export type FractionEvidenceVision = BaseEvidenceVision & {
  setup_whole_visible: boolean;
  result_parts_detected: number;
  result_roughly_equal: boolean;
};

export type AngleEvidenceVision = BaseEvidenceVision & {
  setup_paper_visible: boolean;
  result_fold_visible: boolean;
  result_angle_estimate_deg: number;
};

export type MeasurementEvidenceVision = BaseEvidenceVision & {
  setup_pencil_visible: boolean;
  setup_ruler_visible: boolean;
  result_ruler_aligned: boolean;
  result_measured_length_cm: number;
};

export type EvidenceVisionResult =
  | AdditionEvidenceVision
  | SubtractionEvidenceVision
  | ArrayEvidenceVision
  | GroupsEvidenceVision
  | FractionEvidenceVision
  | AngleEvidenceVision
  | MeasurementEvidenceVision;

export type EvaluationStatus = "correct" | "incorrect" | "retake";

export type CheckpointEvaluation = {
  stage: EvidenceStage;
  title: string;
  status: EvaluationStatus;
  actual: string;
  needed: string;
  explanation: string;
};

export type EvaluationResult = {
  status: EvaluationStatus;
  actual: string;
  needed: string;
  explanation: string;
  checkpoints: [CheckpointEvaluation, CheckpointEvaluation];
  prediction?: {
    value: string;
    message: string;
  };
};

export function evaluateMission(
  mission: Mission,
  vision: EvidenceVisionResult,
  prediction?: string,
): EvaluationResult {
  const checkpoints = evaluateCheckpoints(mission, vision);
  const status = overallStatus(checkpoints);

  return {
    status,
    actual: checkpoints.map((item) => item.actual).join("; then "),
    needed: checkpoints.map((item) => item.needed).join("; then "),
    explanation: overallExplanation(mission, checkpoints, status),
    checkpoints,
    prediction: predictionFeedback(mission, vision, prediction),
  };
}

function evaluateCheckpoints(
  mission: Mission,
  vision: EvidenceVisionResult,
): [CheckpointEvaluation, CheckpointEvaluation] {
  const target = mission.targetSpec;

  switch (target.kind) {
    case "count": {
      if (target.operation === "addition") {
        const result = asAdditionVision(vision);
        const actualOperands = [
          result.setup_first_count,
          result.setup_second_count,
        ].sort((a, b) => a - b);
        const neededOperands = [...target.operands].sort((a, b) => a - b);

        return [
          checkpoint(
            mission,
            "setup",
            result.setup_confident,
            `separate piles of ${result.setup_first_count} and ${result.setup_second_count}`,
            `separate piles of ${target.operands[0]} and ${target.operands[1]}`,
            actualOperands[0] === neededOperands[0] &&
              actualOperands[1] === neededOperands[1],
          ),
          checkpoint(
            mission,
            "result",
            result.result_confident,
            `${result.result_count} objects in the combined group`,
            `${target.targetCount} objects in the combined group`,
            result.result_count === target.targetCount,
          ),
        ];
      }

      const result = asSubtractionVision(vision);

      return [
        checkpoint(
          mission,
          "setup",
          result.setup_confident,
          `${result.setup_count} objects in the starting group`,
          `${target.operands[0]} objects in the starting group`,
          result.setup_count === target.operands[0],
        ),
        checkpoint(
          mission,
          "result",
          result.result_confident,
          `${result.result_count} objects remaining`,
          `${target.targetCount} objects remaining`,
          result.result_count === target.targetCount,
        ),
      ];
    }
    case "array": {
      const result = asArrayVision(vision);

      return [
        checkpoint(
          mission,
          "setup",
          result.setup_confident,
          `${result.setup_count} loose objects`,
          `${target.product} loose objects`,
          result.setup_count === target.product,
        ),
        checkpoint(
          mission,
          "result",
          result.result_confident,
          `${result.result_rows} rows of ${result.result_cols}, for ${result.result_total} total`,
          `${target.rows} rows of ${target.cols}, for ${target.product} total`,
          result.result_rows === target.rows &&
            result.result_cols === target.cols &&
            result.result_total === target.product,
        ),
      ];
    }
    case "equalGroups": {
      const result = asGroupsVision(vision);

      return [
        checkpoint(
          mission,
          "setup",
          result.setup_confident,
          `${result.setup_count} objects in the starting group`,
          `${target.total} objects in the starting group`,
          result.setup_count === target.total,
        ),
        checkpoint(
          mission,
          "result",
          result.result_confident,
          `${result.result_groups} ${result.result_equal ? "equal" : "unequal"} groups of ${result.result_per_group}, for ${result.result_total} total`,
          `${target.groups} equal groups of ${target.perGroup}, for ${target.total} total`,
          result.result_groups === target.groups &&
            result.result_per_group === target.perGroup &&
            result.result_total === target.total &&
            result.result_equal,
        ),
      ];
    }
    case "fraction": {
      const result = asFractionVision(vision);

      return [
        checkpoint(
          mission,
          "setup",
          result.setup_confident,
          result.setup_whole_visible
            ? "one undivided whole"
            : "no clear undivided whole",
          "one undivided whole",
          result.setup_whole_visible,
        ),
        checkpoint(
          mission,
          "result",
          result.result_confident,
          `${result.result_parts_detected} parts that are ${
            result.result_roughly_equal ? "roughly equal" : "not roughly equal"
          }`,
          `${target.parts} roughly equal parts`,
          result.result_parts_detected === target.parts &&
            result.result_roughly_equal === target.roughlyEqual,
        ),
      ];
    }
    case "angle": {
      const result = asAngleVision(vision);

      return [
        checkpoint(
          mission,
          "setup",
          result.setup_confident,
          result.setup_paper_visible
            ? "one flat sheet of paper"
            : "no clear flat sheet of paper",
          "one flat sheet of paper",
          result.setup_paper_visible,
        ),
        checkpoint(
          mission,
          "result",
          result.result_confident,
          result.result_fold_visible
            ? `a visible fold measuring about ${Math.round(result.result_angle_estimate_deg)} degrees`
            : "no clear folded angle",
          `a visible folded angle from ${target.minDeg} to ${target.maxDeg} degrees`,
          result.result_fold_visible &&
            result.result_angle_estimate_deg >= target.minDeg &&
            result.result_angle_estimate_deg <= target.maxDeg,
        ),
      ];
    }
    case "measurement": {
      const result = asMeasurementVision(vision);
      const setupReady =
        result.setup_pencil_visible && result.setup_ruler_visible;
      const resultInRange =
        Math.abs(result.result_measured_length_cm - target.referenceLengthCm) <=
        target.toleranceCm;

      return [
        checkpoint(
          mission,
          "setup",
          result.setup_confident,
          describeMeasurementSetup(result),
          "a separate pencil and ruler, both clearly visible",
          setupReady,
        ),
        checkpoint(
          mission,
          "result",
          result.result_confident,
          result.result_ruler_aligned
            ? `an aligned ruler reading of ${roundToOne(result.result_measured_length_cm)} cm`
            : `a ruler reading of ${roundToOne(result.result_measured_length_cm)} cm without clear zero alignment`,
          `an aligned ruler reading near ${target.referenceLengthCm} cm`,
          result.result_ruler_aligned && resultInRange,
        ),
      ];
    }
  }
}

function checkpoint(
  mission: Mission,
  stage: EvidenceStage,
  confident: boolean,
  actual: string,
  needed: string,
  correct: boolean,
): CheckpointEvaluation {
  const title = mission.evidence[stage].title;

  if (!confident) {
    return {
      stage,
      title,
      status: "retake",
      actual,
      needed,
      explanation: `The ${stage} photo is not clear enough to verify ${title.toLowerCase()}.`,
    };
  }

  return {
    stage,
    title,
    status: correct ? "correct" : "incorrect",
    actual,
    needed,
    explanation: correct
      ? `${title} verified.`
      : `I detected ${actual}, but this checkpoint needs ${needed}.`,
  };
}

function overallStatus(
  checkpoints: [CheckpointEvaluation, CheckpointEvaluation],
): EvaluationStatus {
  if (checkpoints.some((item) => item.status === "retake")) {
    return "retake";
  }

  return checkpoints.every((item) => item.status === "correct")
    ? "correct"
    : "incorrect";
}

function overallExplanation(
  mission: Mission,
  checkpoints: [CheckpointEvaluation, CheckpointEvaluation],
  status: EvaluationStatus,
) {
  if (status === "correct") {
    return mission.explainer;
  }

  const setup = checkpoints[0];
  const result = checkpoints[1];

  if (status === "retake") {
    const stages = checkpoints
      .filter((item) => item.status === "retake")
      .map((item) => item.stage)
      .join(" and ");

    return `I could not verify the ${stages} evidence. Retake only the highlighted photo with a clear overhead view.`;
  }

  if (setup.status === "incorrect" && result.status === "correct") {
    return `Your final result is correct, but the setup does not match. I detected ${setup.actual}; it needs ${setup.needed}.`;
  }

  if (setup.status === "correct" && result.status === "incorrect") {
    return `Your setup is correct, but the result needs another look. I detected ${result.actual}; it needs ${result.needed}.`;
  }

  return `Both checkpoints need another look. The setup shows ${setup.actual}, and the result shows ${result.actual}.`;
}

function predictionFeedback(
  mission: Mission,
  vision: EvidenceVisionResult,
  prediction?: string,
) {
  const cleanPrediction = prediction?.trim();

  if (!cleanPrediction) {
    return undefined;
  }

  if (
    mission.targetSpec.kind === "measurement" &&
    "result_measured_length_cm" in vision
  ) {
    const estimate = Number.parseFloat(cleanPrediction);

    if (Number.isFinite(estimate)) {
      const difference = Math.abs(
        estimate - vision.result_measured_length_cm,
      );

      return {
        value: cleanPrediction,
        message: `Your estimate was ${roundToOne(difference)} cm from the ruler reading.`,
      };
    }
  }

  return {
    value: cleanPrediction,
    message: `Observed result: ${describeResultVision(mission, vision)}.`,
  };
}

function describeResultVision(
  mission: Mission,
  vision: EvidenceVisionResult,
) {
  const target = mission.targetSpec;

  switch (target.kind) {
    case "count":
      return `${asCountResultVision(vision).result_count} objects`;
    case "array": {
      const result = asArrayVision(vision);
      return `${result.result_rows} rows of ${result.result_cols}, for ${result.result_total} total`;
    }
    case "equalGroups": {
      const result = asGroupsVision(vision);
      return `${result.result_groups} groups of ${result.result_per_group}`;
    }
    case "fraction": {
      const result = asFractionVision(vision);
      return `${result.result_parts_detected} parts`;
    }
    case "angle":
      return `about ${Math.round(asAngleVision(vision).result_angle_estimate_deg)} degrees`;
    case "measurement":
      return `${roundToOne(asMeasurementVision(vision).result_measured_length_cm)} cm`;
  }
}

function describeMeasurementSetup(result: MeasurementEvidenceVision) {
  if (result.setup_pencil_visible && result.setup_ruler_visible) {
    return "a separate pencil and ruler, both visible";
  }

  if (result.setup_pencil_visible) {
    return "a pencil, but no clear ruler";
  }

  if (result.setup_ruler_visible) {
    return "a ruler, but no clear pencil";
  }

  return "no clear pencil or ruler";
}

function roundToOne(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function asAdditionVision(
  vision: EvidenceVisionResult,
): AdditionEvidenceVision {
  if (!("setup_first_count" in vision)) {
    throw new Error("Expected addition evidence result.");
  }

  return vision;
}

function asSubtractionVision(
  vision: EvidenceVisionResult,
): SubtractionEvidenceVision {
  if (
    !("setup_count" in vision) ||
    !("result_count" in vision)
  ) {
    throw new Error("Expected subtraction evidence result.");
  }

  return vision;
}

function asCountResultVision(
  vision: EvidenceVisionResult,
): AdditionEvidenceVision | SubtractionEvidenceVision {
  if (!("result_count" in vision)) {
    throw new Error("Expected count evidence result.");
  }

  return vision;
}

function asArrayVision(vision: EvidenceVisionResult): ArrayEvidenceVision {
  if (!("result_rows" in vision)) {
    throw new Error("Expected array evidence result.");
  }

  return vision;
}

function asGroupsVision(vision: EvidenceVisionResult): GroupsEvidenceVision {
  if (!("result_groups" in vision)) {
    throw new Error("Expected groups evidence result.");
  }

  return vision;
}

function asFractionVision(
  vision: EvidenceVisionResult,
): FractionEvidenceVision {
  if (!("result_parts_detected" in vision)) {
    throw new Error("Expected fraction evidence result.");
  }

  return vision;
}

function asAngleVision(vision: EvidenceVisionResult): AngleEvidenceVision {
  if (!("result_angle_estimate_deg" in vision)) {
    throw new Error("Expected angle evidence result.");
  }

  return vision;
}

function asMeasurementVision(
  vision: EvidenceVisionResult,
): MeasurementEvidenceVision {
  if (!("result_measured_length_cm" in vision)) {
    throw new Error("Expected measurement evidence result.");
  }

  return vision;
}
