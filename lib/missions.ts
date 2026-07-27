export type Concept =
  | "Addition"
  | "Subtraction"
  | "Multiplication"
  | "Division"
  | "Fractions"
  | "Geometry"
  | "Measurement";

export type PromptMode =
  | "object-count"
  | "array"
  | "equal-groups"
  | "skip-counting"
  | "fraction"
  | "angle"
  | "measurement";

export type CountTarget = {
  kind: "count";
  operation: "addition" | "subtraction";
  operands: [number, number];
  targetCount: number;
  equation: string;
};

export type ArrayTarget = {
  kind: "array";
  rows: number;
  cols: number;
  product: number;
};

export type EqualGroupsTarget = {
  kind: "equalGroups";
  groups: number;
  perGroup: number;
  total: number;
};

export type FractionTarget = {
  kind: "fraction";
  parts: number;
  roughlyEqual: boolean;
};

export type AngleTarget = {
  kind: "angle";
  targetDeg: number;
  minDeg: number;
  maxDeg: number;
};

export type MeasurementTarget = {
  kind: "measurement";
  objectName: string;
  referenceLengthCm: number;
  toleranceCm: number;
};

export type TargetSpec =
  | CountTarget
  | ArrayTarget
  | EqualGroupsTarget
  | FractionTarget
  | AngleTarget
  | MeasurementTarget;

export type EvidenceStage = "setup" | "result";

export type EvidenceCheckpoint = {
  title: string;
  instruction: string;
};

export type EvidencePlan = Record<EvidenceStage, EvidenceCheckpoint>;

export type Mission = {
  id: string;
  title: string;
  grade: string;
  concept: Concept;
  promptMode: PromptMode;
  instruction: string;
  predictionLabel: string;
  targetSpec: TargetSpec;
  evidence: EvidencePlan;
  xp: number;
  explainer: string;
};

export const missions: Mission[] = [
  {
    id: "add-7-8",
    title: "Combine Two Piles",
    grade: "G2",
    concept: "Addition",
    promptMode: "object-count",
    instruction:
      "Build two starting piles, then combine them to show how addition changes two parts into one total.",
    predictionLabel: "How many objects will be in the combined group?",
    targetSpec: {
      kind: "count",
      operation: "addition",
      operands: [7, 8],
      targetCount: 15,
      equation: "7 + 8 = 15",
    },
    evidence: {
      setup: {
        title: "Two starting piles",
        instruction:
          "Make one pile of 7 objects and one pile of 8. Leave clear space between them and photograph both from above.",
      },
      result: {
        title: "Combined total",
        instruction:
          "Combine both piles into one group. Keep every object visible and photograph the final group from above.",
      },
    },
    xp: 30,
    explainer:
      "Addition joins two amounts into one total, so the final group should show all 15 objects together.",
  },
  {
    id: "sub-15-to-9",
    title: "Leave 9 Behind",
    grade: "G2",
    concept: "Subtraction",
    promptMode: "object-count",
    instruction:
      "Show the starting amount, then remove objects to demonstrate what remains after subtraction.",
    predictionLabel: "How many objects should be left?",
    targetSpec: {
      kind: "count",
      operation: "subtraction",
      operands: [15, 6],
      targetCount: 9,
      equation: "15 - 6 = 9",
    },
    evidence: {
      setup: {
        title: "Starting amount",
        instruction:
          "Place all 15 objects in one visible group and photograph the complete group from above.",
      },
      result: {
        title: "Objects remaining",
        instruction:
          "Remove 6 objects so that 9 remain. Photograph only the remaining objects.",
      },
    },
    xp: 30,
    explainer:
      "Subtraction tells what remains after part of a group is taken away. The photo should show the remaining 9.",
  },
  {
    id: "multi-6-by-4",
    title: "Rows of Four",
    grade: "G3",
    concept: "Multiplication",
    promptMode: "array",
    instruction:
      "Count out the full set, then organize it into equal rows to demonstrate multiplication.",
    predictionLabel: "How many objects will the grid have?",
    targetSpec: {
      kind: "array",
      rows: 6,
      cols: 4,
      product: 24,
    },
    evidence: {
      setup: {
        title: "Count out 24",
        instruction:
          "Place 24 objects in one loose, countable group and photograph all of them from above.",
      },
      result: {
        title: "Six rows of four",
        instruction:
          "Arrange the same 24 objects into 6 straight rows of 4, then photograph the full array.",
      },
    },
    xp: 40,
    explainer:
      "A multiplication array uses equal rows. Six rows with four objects in each row makes 24 objects.",
  },
  {
    id: "divide-20-by-4",
    title: "Four Equal Piles",
    grade: "G3",
    concept: "Division",
    promptMode: "equal-groups",
    instruction:
      "Show the total first, then share it into equal groups to demonstrate division.",
    predictionLabel: "How many objects should be in each group?",
    targetSpec: {
      kind: "equalGroups",
      groups: 4,
      perGroup: 5,
      total: 20,
    },
    evidence: {
      setup: {
        title: "Starting total",
        instruction:
          "Place all 20 objects in one countable group and photograph the complete group.",
      },
      result: {
        title: "Four equal groups",
        instruction:
          "Split the same objects into 4 groups of 5. Leave space between groups and photograph all four.",
      },
    },
    xp: 40,
    explainer:
      "Division shares a total into equal groups. Twenty objects split into four equal groups gives five per group.",
  },
  {
    id: "fraction-fourths",
    title: "Four Fair Parts",
    grade: "G3",
    concept: "Fractions",
    promptMode: "fraction",
    instruction:
      "Show one whole, then divide it into four roughly equal parts to demonstrate fourths.",
    predictionLabel: "What fraction is one part of the whole?",
    targetSpec: {
      kind: "fraction",
      parts: 4,
      roughlyEqual: true,
    },
    evidence: {
      setup: {
        title: "One whole",
        instruction:
          "Place one whole sheet of paper or soft food item flat and photograph it from above.",
      },
      result: {
        title: "Four fair parts",
        instruction:
          "Fold or tear the whole into 4 roughly equal parts and photograph all parts from above. Use adult help with food.",
      },
    },
    xp: 45,
    explainer:
      "Four equal parts make fourths. Each part is one fourth of the whole.",
  },
  {
    id: "geometry-right-angle",
    title: "Paper Right Angle",
    grade: "G4",
    concept: "Geometry",
    promptMode: "angle",
    instruction:
      "Show the paper before folding, then create and reveal a right angle.",
    predictionLabel: "About how many degrees is a right angle?",
    targetSpec: {
      kind: "angle",
      targetDeg: 90,
      minDeg: 80,
      maxDeg: 100,
    },
    evidence: {
      setup: {
        title: "Paper ready to fold",
        instruction:
          "Place one flat sheet of paper where its edges and corners are clearly visible, then photograph it.",
      },
      result: {
        title: "Folded right angle",
        instruction:
          "Fold the paper to create a right angle. Photograph the fold with both arms of the angle visible.",
      },
    },
    xp: 45,
    explainer:
      "A right angle is 90 degrees. A small photo estimate range is allowed because camera perspective is imperfect.",
  },
  {
    id: "measure-pencil",
    title: "Measure a Pencil",
    grade: "G4",
    concept: "Measurement",
    promptMode: "measurement",
    instruction:
      "Estimate first, then align a ruler with the pencil to compare the estimate with a measured length.",
    predictionLabel: "Your estimate in centimeters",
    targetSpec: {
      kind: "measurement",
      objectName: "standard pencil",
      referenceLengthCm: 18,
      toleranceCm: 3,
    },
    evidence: {
      setup: {
        title: "Estimate before measuring",
        instruction:
          "Place the pencil and ruler separately so both are visible. Enter your estimate before taking this photo.",
      },
      result: {
        title: "Ruler measurement",
        instruction:
          "Align the ruler's zero mark with one end of the pencil. Photograph both endpoints and readable ruler marks.",
      },
    },
    xp: 45,
    explainer:
      "Measurement compares an object to a standard unit. The typed estimate is compared with the ruler reading from the photo.",
  },
  {
    id: "skip-5-to-25",
    title: "Five, Ten, Fifteen",
    grade: "G2",
    concept: "Multiplication",
    promptMode: "skip-counting",
    instruction:
      "Show the full amount, then organize it into groups that can be skip-counted by five.",
    predictionLabel: "How many groups of 5 will make 25?",
    targetSpec: {
      kind: "equalGroups",
      groups: 5,
      perGroup: 5,
      total: 25,
    },
    evidence: {
      setup: {
        title: "Starting total",
        instruction:
          "Place all 25 objects in one loose, countable group and photograph the full set.",
      },
      result: {
        title: "Five groups of five",
        instruction:
          "Arrange the same objects into 5 separated groups of 5 and photograph all groups from above.",
      },
    },
    xp: 35,
    explainer:
      "Skip counting by fives counts equal groups: 5, 10, 15, 20, 25.",
  },
];

export const concepts: Concept[] = [
  "Addition",
  "Subtraction",
  "Multiplication",
  "Division",
  "Fractions",
  "Geometry",
  "Measurement",
];

export function getMission(id: string) {
  return missions.find((mission) => mission.id === id);
}
