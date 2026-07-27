import type { Mission, PromptMode } from "@/lib/missions";

export type ResponseSchema = {
  type: "object";
  properties: Record<
    string,
    {
      type: "number" | "boolean" | "string";
      description?: string;
    }
  >;
  required: string[];
};

const jsonOnlyRules = [
  "Return only valid JSON.",
  "Do not use markdown fences, labels, comments, or prose.",
  "If the photo is blurry, cropped, occluded, too messy to count, or the task cannot be verified from the image, set confident to false.",
  "When confident is false, still return the schema fields with your best estimates where possible.",
].join(" ");

const countingModeInstructions: Record<
  Extract<PromptMode, "object-count" | "array" | "equal-groups" | "skip-counting">,
  string
> = {
  "object-count":
    "Count the visible objects in the final single group. Ignore hands, background patterns, shadows, containers, and writing.",
  array:
    "Count the rows and columns in the visible object grid. Rows should be parallel lines of objects; columns are the objects in each row.",
  "equal-groups":
    "Count the separated groups or piles, estimate how many objects are in each group, and decide whether the groups are equal.",
  "skip-counting":
    "Count the separated groups, the number of objects in each group, and the total number of visible objects.",
};

export function buildPrompt(mission: Mission) {
  if (
    mission.promptMode === "object-count" ||
    mission.promptMode === "array" ||
    mission.promptMode === "equal-groups" ||
    mission.promptMode === "skip-counting"
  ) {
    return buildCountingPrompt(mission);
  }

  if (mission.promptMode === "fraction") {
    return buildFractionPrompt(mission);
  }

  if (mission.promptMode === "angle") {
    return buildAnglePrompt(mission);
  }

  return buildMeasurementPrompt(mission);
}

export function buildCountingPrompt(mission: Mission) {
  return [
    "You are verifying a child's hands-on math manipulative photo.",
    `Mission: ${mission.title}.`,
    `Task instruction: ${mission.instruction}`,
    countingModeInstructions[
      mission.promptMode as Extract<
        PromptMode,
        "object-count" | "array" | "equal-groups" | "skip-counting"
      >
    ],
    "Use visual evidence only; do not solve from the text alone.",
    jsonOnlyRules,
  ].join(" ");
}

export function buildFractionPrompt(mission: Mission) {
  return [
    "You are verifying a child's fraction photo.",
    `Mission: ${mission.title}.`,
    `Task instruction: ${mission.instruction}`,
    "Detect the number of visible parts made from one original whole and judge whether the parts are roughly equal in size.",
    "Allow small natural cutting or folding imperfections, but reject clearly unequal pieces.",
    jsonOnlyRules,
  ].join(" ");
}

export function buildAnglePrompt(mission: Mission) {
  return [
    "You are verifying a child's geometry photo.",
    `Mission: ${mission.title}.`,
    `Task instruction: ${mission.instruction}`,
    "Estimate the main folded angle in degrees from the two visible sides of the fold.",
    "Account for perspective, but set confident to false if the angle arms are not visible enough.",
    jsonOnlyRules,
  ].join(" ");
}

export function buildMeasurementPrompt(mission: Mission) {
  return [
    "You are verifying a child's measurement photo.",
    `Mission: ${mission.title}.`,
    `Task instruction: ${mission.instruction}`,
    "Read the ruler next to the object and estimate the object's measured length in centimeters.",
    "Set confident to false if the ruler markings, object endpoints, or alignment are not visible enough.",
    jsonOnlyRules,
  ].join(" ");
}

export const schemas = {
  count: {
    type: "object",
    properties: {
      count: {
        type: "number",
        description: "Number of target objects visible in the final group.",
      },
      confident: {
        type: "boolean",
        description: "True only when the count can be verified from the photo.",
      },
    },
    required: ["count", "confident"],
  },
  array: {
    type: "object",
    properties: {
      rows: {
        type: "number",
        description: "Number of visible rows in the object array.",
      },
      cols: {
        type: "number",
        description: "Number of visible objects in each row.",
      },
      product: {
        type: "number",
        description: "Total visible objects in the array.",
      },
      confident: {
        type: "boolean",
        description: "True only when rows and columns can be verified.",
      },
    },
    required: ["rows", "cols", "product", "confident"],
  },
  groups: {
    type: "object",
    properties: {
      groups: {
        type: "number",
        description: "Number of separated groups or piles.",
      },
      per_group: {
        type: "number",
        description: "Number of objects in each group when groups are equal, or best typical group size.",
      },
      equal: {
        type: "boolean",
        description: "Whether the visible groups have the same number of objects.",
      },
      confident: {
        type: "boolean",
        description: "True only when the grouping is visible enough to verify.",
      },
    },
    required: ["groups", "per_group", "equal", "confident"],
  },
  skipCounting: {
    type: "object",
    properties: {
      groups: {
        type: "number",
        description: "Number of separated groups.",
      },
      per_group: {
        type: "number",
        description: "Number of objects in each group.",
      },
      total: {
        type: "number",
        description: "Total number of visible objects.",
      },
      confident: {
        type: "boolean",
        description: "True only when groups and total can be verified.",
      },
    },
    required: ["groups", "per_group", "total", "confident"],
  },
  fraction: {
    type: "object",
    properties: {
      parts_detected: {
        type: "number",
        description: "Number of visible pieces or parts from the original whole.",
      },
      roughly_equal: {
        type: "boolean",
        description: "Whether the parts look roughly equal in area.",
      },
      confident: {
        type: "boolean",
        description: "True only when the parts are visible enough to verify.",
      },
    },
    required: ["parts_detected", "roughly_equal", "confident"],
  },
  angle: {
    type: "object",
    properties: {
      angle_estimate_deg: {
        type: "number",
        description: "Estimated angle in degrees.",
      },
      confident: {
        type: "boolean",
        description: "True only when the angle can be estimated from the photo.",
      },
    },
    required: ["angle_estimate_deg", "confident"],
  },
  measurement: {
    type: "object",
    properties: {
      measured_length_cm: {
        type: "number",
        description: "Measured object length in centimeters from the ruler.",
      },
      confident: {
        type: "boolean",
        description: "True only when the ruler and object endpoints are readable.",
      },
    },
    required: ["measured_length_cm", "confident"],
  },
} satisfies Record<string, ResponseSchema>;

export function schemaForMission(mission: Mission): ResponseSchema {
  switch (mission.promptMode) {
    case "object-count":
      return schemas.count;
    case "array":
      return schemas.array;
    case "equal-groups":
      return schemas.groups;
    case "skip-counting":
      return schemas.skipCounting;
    case "fraction":
      return schemas.fraction;
    case "angle":
      return schemas.angle;
    case "measurement":
      return schemas.measurement;
  }
}
