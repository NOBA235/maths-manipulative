import type { Mission } from "@/lib/missions";

export type CountVision = {
  count: number;
  confident: boolean;
};

export type ArrayVision = {
  rows: number;
  cols: number;
  product: number;
  confident: boolean;
};

export type GroupsVision = {
  groups: number;
  per_group: number;
  equal?: boolean;
  total?: number;
  confident: boolean;
};

export type FractionVision = {
  parts_detected: number;
  roughly_equal: boolean;
  confident: boolean;
};

export type AngleVision = {
  angle_estimate_deg: number;
  confident: boolean;
};

export type MeasurementVision = {
  measured_length_cm: number;
  confident: boolean;
};

export type VisionResult =
  | CountVision
  | ArrayVision
  | GroupsVision
  | FractionVision
  | AngleVision
  | MeasurementVision;

export type EvaluationStatus = "correct" | "incorrect" | "retake";

export type EvaluationResult = {
  status: EvaluationStatus;
  actual: string;
  needed: string;
  explanation: string;
  prediction?: {
    value: string;
    message: string;
  };
};

export function isConfident(vision: VisionResult) {
  return Boolean("confident" in vision && vision.confident);
}

export function evaluateMission(
  mission: Mission,
  vision: VisionResult,
  prediction?: string,
): EvaluationResult {
  if (!isConfident(vision)) {
    return {
      status: "retake",
      actual: describeVision(vision),
      needed: describeTarget(mission),
      explanation:
        "The photo looks too blurry, crowded, cropped, or ambiguous to verify. Take a clearer photo from above with the objects separated.",
      prediction: predictionFeedback(mission, vision, prediction),
    };
  }

  let correct = false;
  const target = mission.targetSpec;

  switch (target.kind) {
    case "count": {
      const result = asCountVision(vision);
      correct = result.count === target.targetCount;
      break;
    }
    case "array": {
      const result = asArrayVision(vision);
      correct =
        result.rows === target.rows &&
        result.cols === target.cols &&
        result.product === target.product;
      break;
    }
    case "equalGroups": {
      const result = asGroupsVision(vision);
      const total = result.total ?? result.groups * result.per_group;
      correct =
        result.groups === target.groups &&
        result.per_group === target.perGroup &&
        total === target.total &&
        (mission.promptMode === "skip-counting" || result.equal === true);
      break;
    }
    case "fraction": {
      const result = asFractionVision(vision);
      correct =
        result.parts_detected === target.parts &&
        result.roughly_equal === target.roughlyEqual;
      break;
    }
    case "angle": {
      const result = asAngleVision(vision);
      correct =
        result.angle_estimate_deg >= target.minDeg &&
        result.angle_estimate_deg <= target.maxDeg;
      break;
    }
    case "measurement": {
      const result = asMeasurementVision(vision);
      correct =
        Math.abs(result.measured_length_cm - target.referenceLengthCm) <=
        target.toleranceCm;
      break;
    }
  }

  return {
    status: correct ? "correct" : "incorrect",
    actual: describeVision(vision),
    needed: describeTarget(mission),
    explanation: correct
      ? mission.explainer
      : `I detected ${describeVision(vision).toLowerCase()}, but this mission needs ${describeTarget(mission).toLowerCase()}.`,
    prediction: predictionFeedback(mission, vision, prediction),
  };
}

export function describeTarget(mission: Mission) {
  const target = mission.targetSpec;

  switch (target.kind) {
    case "count":
      return `${target.targetCount} objects (${target.equation})`;
    case "array":
      return `${target.rows} rows of ${target.cols}, for ${target.product} total`;
    case "equalGroups":
      return `${target.groups} groups of ${target.perGroup}, for ${target.total} total`;
    case "fraction":
      return `${target.parts} roughly equal parts`;
    case "angle":
      return `an angle from ${target.minDeg} to ${target.maxDeg} degrees`;
    case "measurement":
      return `${target.objectName} near ${target.referenceLengthCm} cm`;
  }
}

export function describeVision(vision: VisionResult) {
  if ("count" in vision) {
    return `${vision.count} objects`;
  }

  if ("rows" in vision) {
    return `${vision.rows} rows of ${vision.cols}, for ${vision.product} total`;
  }

  if ("groups" in vision) {
    const total = vision.total ?? vision.groups * vision.per_group;
    const equal = "equal" in vision ? (vision.equal ? "equal" : "unequal") : "grouped";
    return `${vision.groups} ${equal} groups of ${vision.per_group}, for ${total} total`;
  }

  if ("parts_detected" in vision) {
    return `${vision.parts_detected} parts that are ${
      vision.roughly_equal ? "roughly equal" : "not roughly equal"
    }`;
  }

  if ("angle_estimate_deg" in vision) {
    return `about ${Math.round(vision.angle_estimate_deg)} degrees`;
  }

  return `${roundToOne(vision.measured_length_cm)} cm`;
}

function predictionFeedback(
  mission: Mission,
  vision: VisionResult,
  prediction?: string,
) {
  const cleanPrediction = prediction?.trim();

  if (!cleanPrediction) {
    return undefined;
  }

  if (mission.targetSpec.kind === "measurement" && "measured_length_cm" in vision) {
    const estimate = Number.parseFloat(cleanPrediction);

    if (Number.isFinite(estimate)) {
      const difference = Math.abs(estimate - vision.measured_length_cm);
      return {
        value: cleanPrediction,
        message: `Your estimate was ${roundToOne(difference)} cm from the ruler reading.`,
      };
    }
  }

  return {
    value: cleanPrediction,
    message: `Actual result: ${describeVision(vision)}.`,
  };
}

function roundToOne(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

function asCountVision(vision: VisionResult): CountVision {
  if (!("count" in vision)) {
    throw new Error("Expected count vision result.");
  }

  return vision;
}

function asArrayVision(vision: VisionResult): ArrayVision {
  if (!("rows" in vision)) {
    throw new Error("Expected array vision result.");
  }

  return vision;
}

function asGroupsVision(vision: VisionResult): GroupsVision {
  if (!("groups" in vision)) {
    throw new Error("Expected groups vision result.");
  }

  return vision;
}

function asFractionVision(vision: VisionResult): FractionVision {
  if (!("parts_detected" in vision)) {
    throw new Error("Expected fraction vision result.");
  }

  return vision;
}

function asAngleVision(vision: VisionResult): AngleVision {
  if (!("angle_estimate_deg" in vision)) {
    throw new Error("Expected angle vision result.");
  }

  return vision;
}

function asMeasurementVision(vision: VisionResult): MeasurementVision {
  if (!("measured_length_cm" in vision)) {
    throw new Error("Expected measurement vision result.");
  }

  return vision;
}
