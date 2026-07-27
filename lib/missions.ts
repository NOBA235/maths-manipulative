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

export type Mission = {
  id: string;
  title: string;
  grade: string;
  concept: Concept;
  promptMode: PromptMode;
  instruction: string;
  predictionLabel: string;
  targetSpec: TargetSpec;
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
      "Make one pile with 7 objects and another pile with 8 objects. Combine them into one group, then photograph the combined group.",
    predictionLabel: "How many objects will be in the combined group?",
    targetSpec: {
      kind: "count",
      operation: "addition",
      targetCount: 15,
      equation: "7 + 8 = 15",
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
      "Start with 15 objects. Remove some so that 9 remain. Photograph only what is left.",
    predictionLabel: "How many objects should be left?",
    targetSpec: {
      kind: "count",
      operation: "subtraction",
      targetCount: 9,
      equation: "15 - 6 = 9",
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
      "Arrange objects into 6 rows of 4. Keep the rows straight enough to count, then photograph the grid.",
    predictionLabel: "How many objects will the grid have?",
    targetSpec: {
      kind: "array",
      rows: 6,
      cols: 4,
      product: 24,
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
      "Split 20 objects into 4 equal groups or piles. Photograph all groups with space between them.",
    predictionLabel: "How many objects should be in each group?",
    targetSpec: {
      kind: "equalGroups",
      groups: 4,
      perGroup: 5,
      total: 20,
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
      "Cut or fold a piece of paper, roti, or fruit into 4 roughly equal parts. Photograph the pieces from above.",
    predictionLabel: "What fraction is one part of the whole?",
    targetSpec: {
      kind: "fraction",
      parts: 4,
      roughlyEqual: true,
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
      "Fold paper to create a right angle. Place it flat and photograph the fold so both sides of the angle are visible.",
    predictionLabel: "About how many degrees is a right angle?",
    targetSpec: {
      kind: "angle",
      targetDeg: 90,
      minDeg: 80,
      maxDeg: 100,
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
      "Estimate the length of a standard pencil, then place a ruler against it and photograph the ruler and pencil together.",
    predictionLabel: "Your estimate in centimeters",
    targetSpec: {
      kind: "measurement",
      objectName: "standard pencil",
      referenceLengthCm: 18,
      toleranceCm: 3,
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
      "Arrange objects into groups of 5 to make 25 in total. Photograph the separated groups.",
    predictionLabel: "How many groups of 5 will make 25?",
    targetSpec: {
      kind: "equalGroups",
      groups: 5,
      perGroup: 5,
      total: 25,
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
