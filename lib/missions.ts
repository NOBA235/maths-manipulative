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
  action: string;
  photoTip: string;
};

export type EvidencePlan = Record<EvidenceStage, EvidenceCheckpoint>;

export type Mission = {
  id: string;
  title: string;
  grade: string;
  concept: Concept;
  promptMode: PromptMode;
  instruction: string;
  challenge: string;
  materials: string[];
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
    challenge: "Can you build 7 + 8 and find the total?",
    materials: ["15 small objects", "A clear table"],
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
        title: "Build two piles",
        instruction:
          "Make one pile of 7 objects and one pile of 8. Leave clear space between them and photograph both from above.",
        action: "Make one pile of 7 and another pile of 8.",
        photoTip: "Leave a gap between the piles and take your photo from above.",
      },
      result: {
        title: "Join the piles",
        instruction:
          "Combine both piles into one group. Keep every object visible and photograph the final group from above.",
        action: "Push both piles together to make one big group.",
        photoTip: "Make sure every object can be seen in the photo.",
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
    challenge: "Can you start with 15, take away 6, and leave 9?",
    materials: ["15 small objects", "A clear table"],
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
        title: "Build the starting group",
        instruction:
          "Place all 15 objects in one visible group and photograph the complete group from above.",
        action: "Count out 15 objects in one group.",
        photoTip: "Show all 15 objects and take your photo from above.",
      },
      result: {
        title: "Take 6 away",
        instruction:
          "Remove 6 objects so that 9 remain. Photograph only the remaining objects.",
        action: "Move 6 objects away so 9 stay on the table.",
        photoTip: "Keep the removed objects out of the photo.",
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
    challenge: "Can you turn 24 objects into 6 neat rows of 4?",
    materials: ["24 small objects", "A clear table"],
    predictionLabel: "How many objects will the grid have?",
    targetSpec: {
      kind: "array",
      rows: 6,
      cols: 4,
      product: 24,
    },
    evidence: {
      setup: {
        title: "Build a group of 24",
        instruction:
          "Place 24 objects in one loose, countable group and photograph all of them from above.",
        action: "Count out 24 objects in one loose group.",
        photoTip: "Spread them out so every object is easy to see.",
      },
      result: {
        title: "Make 6 rows of 4",
        instruction:
          "Arrange the same 24 objects into 6 straight rows of 4, then photograph the full array.",
        action: "Move the objects into 6 straight rows with 4 in each row.",
        photoTip: "Take your photo from above so all the rows are visible.",
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
    challenge: "Can you share 20 objects fairly between 4 groups?",
    materials: ["20 small objects", "A clear table"],
    predictionLabel: "How many objects should be in each group?",
    targetSpec: {
      kind: "equalGroups",
      groups: 4,
      perGroup: 5,
      total: 20,
    },
    evidence: {
      setup: {
        title: "Build a group of 20",
        instruction:
          "Place all 20 objects in one countable group and photograph the complete group.",
        action: "Count out 20 objects in one group.",
        photoTip: "Spread them out so all 20 can be seen.",
      },
      result: {
        title: "Share into 4 groups",
        instruction:
          "Split the same objects into 4 groups of 5. Leave space between groups and photograph all four.",
        action: "Share the objects into 4 groups with 5 in each group.",
        photoTip: "Leave a clear gap between every group.",
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
    challenge: "Can you turn one whole into 4 fair parts?",
    materials: ["1 sheet of paper", "A clear table"],
    predictionLabel: "What fraction is one part of the whole?",
    targetSpec: {
      kind: "fraction",
      parts: 4,
      roughlyEqual: true,
    },
    evidence: {
      setup: {
        title: "Show one whole",
        instruction:
          "Place one whole sheet of paper or soft food item flat and photograph it from above.",
        action: "Place one whole sheet of paper flat on the table.",
        photoTip: "Fit the whole sheet inside your photo.",
      },
      result: {
        title: "Make 4 fair parts",
        instruction:
          "Fold or tear the whole into 4 roughly equal parts and photograph all parts from above. Use adult help with food.",
        action: "Fold or carefully tear the paper into 4 nearly equal parts.",
        photoTip: "Lay all 4 parts flat where they can be counted.",
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
    challenge: "Can you fold a square corner that makes a right angle?",
    materials: ["1 sheet of paper", "A clear table"],
    predictionLabel: "About how many degrees is a right angle?",
    targetSpec: {
      kind: "angle",
      targetDeg: 90,
      minDeg: 80,
      maxDeg: 100,
    },
    evidence: {
      setup: {
        title: "Show the flat paper",
        instruction:
          "Place one flat sheet of paper where its edges and corners are clearly visible, then photograph it.",
        action: "Place one flat sheet of paper on the table.",
        photoTip: "Make sure its edges and corners are easy to see.",
      },
      result: {
        title: "Fold a square corner",
        instruction:
          "Fold the paper to create a right angle. Photograph the fold with both arms of the angle visible.",
        action: "Fold the paper so two straight edges make a square corner.",
        photoTip: "Show both sides of the angle clearly in your photo.",
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
    challenge: "Can you estimate a pencil, then measure it in centimeters?",
    materials: ["1 pencil", "1 centimeter ruler"],
    predictionLabel: "Your estimate in centimeters",
    targetSpec: {
      kind: "measurement",
      objectName: "standard pencil",
      referenceLengthCm: 18,
      toleranceCm: 3,
    },
    evidence: {
      setup: {
        title: "Make your estimate",
        instruction:
          "Place the pencil and ruler separately so both are visible. Enter your estimate before taking this photo.",
        action: "Place the pencil and ruler apart, then guess the pencil's length.",
        photoTip: "Show the whole pencil and ruler, but do not line them up yet.",
      },
      result: {
        title: "Measure the pencil",
        instruction:
          "Align the ruler's zero mark with one end of the pencil. Photograph both endpoints and readable ruler marks.",
        action: "Line up the ruler's zero mark with one end of the pencil.",
        photoTip: "Show both pencil ends and the ruler numbers clearly.",
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
    challenge: "Can you make 5 groups of 5 and count to 25?",
    materials: ["25 small objects", "A clear table"],
    predictionLabel: "How many groups of 5 will make 25?",
    targetSpec: {
      kind: "equalGroups",
      groups: 5,
      perGroup: 5,
      total: 25,
    },
    evidence: {
      setup: {
        title: "Build a group of 25",
        instruction:
          "Place all 25 objects in one loose, countable group and photograph the full set.",
        action: "Count out 25 objects in one loose group.",
        photoTip: "Spread them out so every object can be seen.",
      },
      result: {
        title: "Make 5 groups of 5",
        instruction:
          "Arrange the same objects into 5 separated groups of 5 and photograph all groups from above.",
        action: "Move the objects into 5 groups with 5 in each group.",
        photoTip: "Leave a clear gap between the groups and photograph from above.",
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
