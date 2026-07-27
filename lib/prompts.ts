import type { Mission, PromptMode } from "@/lib/missions";

type PrimitiveSchema = {
  type: "number" | "boolean" | "string";
  description?: string;
};

export type ResponseSchema = {
  type: "object";
  properties: Record<string, PrimitiveSchema>;
  required: string[];
};

const jsonOnlyRules = [
  "Return only valid JSON matching the provided schema.",
  "Do not use markdown fences, labels, comments, or prose outside the JSON.",
  "Use visual evidence only; do not copy or solve the expected values from the task text.",
  "Judge setup_confident and result_confident independently.",
  "Set a stage's confidence to false when its photo is blurry, cropped, occluded, too crowded, or cannot support the requested observation.",
  "Always provide setup_summary and result_summary as short descriptions of what is actually visible.",
].join(" ");

const countingModeInstructions: Record<
  Extract<PromptMode, "object-count" | "array" | "equal-groups" | "skip-counting">,
  string
> = {
  "object-count":
    "Count the objects in each separated setup group and count the objects visible in the final result group.",
  array:
    "Count all loose objects in the setup. In the result, count rows, objects per row, and the total visible objects.",
  "equal-groups":
    "Count the starting objects in the setup. In the result, count separated groups, objects per group, the total, and whether every group is equal.",
  "skip-counting":
    "Count the starting objects in the setup. In the result, count separated groups, objects per group, the total, and whether every group is equal.",
};

function evidenceContext(mission: Mission) {
  return [
    "You are verifying two photos of a child's hands-on math activity.",
    "The first supplied image is the SETUP PHOTO. The second supplied image is the RESULT PHOTO.",
    `Mission: ${mission.title}.`,
    `Mission overview: ${mission.instruction}`,
    `Setup checkpoint: ${mission.evidence.setup.instruction}`,
    `Result checkpoint: ${mission.evidence.result.instruction}`,
  ].join(" ");
}

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
    return [
      evidenceContext(mission),
      "In the setup, decide whether one undivided whole is clearly visible.",
      "In the result, count the parts and judge whether their areas are roughly equal. Allow small natural folding or tearing imperfections.",
      jsonOnlyRules,
    ].join(" ");
  }

  if (mission.promptMode === "angle") {
    return [
      evidenceContext(mission),
      "In the setup, decide whether one flat sheet of paper is clearly visible.",
      "In the result, decide whether a fold forming the angle is visible and estimate the angle between its two arms in degrees.",
      "Account for camera perspective, but do not infer an angle when both arms are not visible.",
      jsonOnlyRules,
    ].join(" ");
  }

  return [
    evidenceContext(mission),
    "In the setup, decide whether both a pencil and a ruler are visible but not yet aligned for measurement.",
    "In the result, decide whether the ruler zero is aligned with one pencil endpoint and read the pencil length in centimeters.",
    "Do not claim confidence unless ruler markings and both pencil endpoints are readable.",
    jsonOnlyRules,
  ].join(" ");
}

export function buildCountingPrompt(mission: Mission) {
  return [
    evidenceContext(mission),
    countingModeInstructions[
      mission.promptMode as Extract<
        PromptMode,
        "object-count" | "array" | "equal-groups" | "skip-counting"
      >
    ],
    "Ignore hands, background patterns, shadows, containers, and writing when counting.",
    jsonOnlyRules,
  ].join(" ");
}

const summaryProperties = {
  setup_summary: {
    type: "string",
    description: "Short factual description of the visible setup evidence.",
  },
  result_summary: {
    type: "string",
    description: "Short factual description of the visible result evidence.",
  },
} satisfies Record<string, PrimitiveSchema>;

const confidenceProperties = {
  setup_confident: {
    type: "boolean",
    description: "True only when the setup checkpoint can be verified.",
  },
  result_confident: {
    type: "boolean",
    description: "True only when the result checkpoint can be verified.",
  },
} satisfies Record<string, PrimitiveSchema>;

export const schemas = {
  addition: {
    type: "object",
    properties: {
      setup_first_count: {
        type: "number",
        description: "Object count in the first separated setup pile.",
      },
      setup_second_count: {
        type: "number",
        description: "Object count in the second separated setup pile.",
      },
      result_count: {
        type: "number",
        description: "Object count in the combined result group.",
      },
      ...confidenceProperties,
      ...summaryProperties,
    },
    required: [
      "setup_first_count",
      "setup_second_count",
      "result_count",
      "setup_confident",
      "result_confident",
      "setup_summary",
      "result_summary",
    ],
  },
  subtraction: {
    type: "object",
    properties: {
      setup_count: {
        type: "number",
        description: "Object count in the complete starting group.",
      },
      result_count: {
        type: "number",
        description: "Object count remaining in the result.",
      },
      ...confidenceProperties,
      ...summaryProperties,
    },
    required: [
      "setup_count",
      "result_count",
      "setup_confident",
      "result_confident",
      "setup_summary",
      "result_summary",
    ],
  },
  array: {
    type: "object",
    properties: {
      setup_count: {
        type: "number",
        description: "Total loose objects visible in the setup.",
      },
      result_rows: {
        type: "number",
        description: "Rows visible in the result array.",
      },
      result_cols: {
        type: "number",
        description: "Objects visible in each result row.",
      },
      result_total: {
        type: "number",
        description: "Total objects visible in the result array.",
      },
      ...confidenceProperties,
      ...summaryProperties,
    },
    required: [
      "setup_count",
      "result_rows",
      "result_cols",
      "result_total",
      "setup_confident",
      "result_confident",
      "setup_summary",
      "result_summary",
    ],
  },
  groups: {
    type: "object",
    properties: {
      setup_count: {
        type: "number",
        description: "Total objects visible in the starting setup group.",
      },
      result_groups: {
        type: "number",
        description: "Separated groups visible in the result.",
      },
      result_per_group: {
        type: "number",
        description: "Objects in each result group, or the best typical count.",
      },
      result_total: {
        type: "number",
        description: "Total objects visible across all result groups.",
      },
      result_equal: {
        type: "boolean",
        description: "Whether every visible result group has the same count.",
      },
      ...confidenceProperties,
      ...summaryProperties,
    },
    required: [
      "setup_count",
      "result_groups",
      "result_per_group",
      "result_total",
      "result_equal",
      "setup_confident",
      "result_confident",
      "setup_summary",
      "result_summary",
    ],
  },
  fraction: {
    type: "object",
    properties: {
      setup_whole_visible: {
        type: "boolean",
        description: "Whether one clearly undivided whole is visible in the setup.",
      },
      result_parts_detected: {
        type: "number",
        description: "Parts visible after dividing the whole.",
      },
      result_roughly_equal: {
        type: "boolean",
        description: "Whether the result parts are roughly equal in area.",
      },
      ...confidenceProperties,
      ...summaryProperties,
    },
    required: [
      "setup_whole_visible",
      "result_parts_detected",
      "result_roughly_equal",
      "setup_confident",
      "result_confident",
      "setup_summary",
      "result_summary",
    ],
  },
  angle: {
    type: "object",
    properties: {
      setup_paper_visible: {
        type: "boolean",
        description: "Whether one flat sheet of paper is clearly visible in the setup.",
      },
      result_fold_visible: {
        type: "boolean",
        description: "Whether a fold with two visible angle arms is present.",
      },
      result_angle_estimate_deg: {
        type: "number",
        description: "Estimated angle between the result fold arms in degrees.",
      },
      ...confidenceProperties,
      ...summaryProperties,
    },
    required: [
      "setup_paper_visible",
      "result_fold_visible",
      "result_angle_estimate_deg",
      "setup_confident",
      "result_confident",
      "setup_summary",
      "result_summary",
    ],
  },
  measurement: {
    type: "object",
    properties: {
      setup_pencil_visible: {
        type: "boolean",
        description: "Whether a pencil is clearly visible in the setup.",
      },
      setup_ruler_visible: {
        type: "boolean",
        description: "Whether a ruler is clearly visible in the setup.",
      },
      result_ruler_aligned: {
        type: "boolean",
        description: "Whether ruler zero is aligned with one pencil endpoint.",
      },
      result_measured_length_cm: {
        type: "number",
        description: "Pencil length in centimeters read from the ruler.",
      },
      ...confidenceProperties,
      ...summaryProperties,
    },
    required: [
      "setup_pencil_visible",
      "setup_ruler_visible",
      "result_ruler_aligned",
      "result_measured_length_cm",
      "setup_confident",
      "result_confident",
      "setup_summary",
      "result_summary",
    ],
  },
} satisfies Record<string, ResponseSchema>;

export function schemaForMission(mission: Mission): ResponseSchema {
  switch (mission.promptMode) {
    case "object-count":
      return mission.targetSpec.kind === "count" &&
        mission.targetSpec.operation === "addition"
        ? schemas.addition
        : schemas.subtraction;
    case "array":
      return schemas.array;
    case "equal-groups":
    case "skip-counting":
      return schemas.groups;
    case "fraction":
      return schemas.fraction;
    case "angle":
      return schemas.angle;
    case "measurement":
      return schemas.measurement;
  }
}
