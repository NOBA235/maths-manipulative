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

export type ActivityMode = "draw" | "pencil-case" | "paper" | "measure";

export type MissionActivity = {
  id: ActivityMode;
  label: string;
  description: string;
  materials: string[];
  evidence: EvidencePlan;
  visionHint: string;
};

export type Mission = {
  id: string;
  title: string;
  grade: string;
  concept: Concept;
  promptMode: PromptMode;
  instruction: string;
  challenge: string;
  activityMode: ActivityMode;
  activityLabel: string;
  activityDescription: string;
  visionHint: string;
  activityOptions?: MissionActivity[];
  materials: string[];
  durationMinutes: number;
  predictionLabel: string;
  targetSpec: TargetSpec;
  evidence: EvidencePlan;
  xp: number;
  explainer: string;
};

export const missions: Mission[] = [
  {
    id: "add-7-8",
    title: "Sticker Sheet Surprise",
    grade: "G2",
    concept: "Addition",
    promptMode: "object-count",
    instruction:
      "Make two little collections, then join them into one surprise sticker sheet.",
    challenge: "Can you make 6 stars and 4 more stars to fill a sheet of 10?",
    activityMode: "draw",
    activityLabel: "Draw it",
    activityDescription: "Make big stars or dots in your notebook.",
    visionHint:
      "Treat each large, separate drawn star or dot as one counter. Ignore page lines and unrelated writing.",
    materials: ["Notebook or loose paper", "Pencil, pen, or marker"],
    durationMinutes: 3,
    predictionLabel: "How many stars will fill the sheet?",
    targetSpec: {
      kind: "count",
      operation: "addition",
      operands: [6, 4],
      targetCount: 10,
      equation: "6 + 4 = 10",
    },
    evidence: {
      setup: {
        title: "Draw 6 and 4 stars",
        instruction:
          "Draw 6 large stars on the left and 4 large stars on the right. Leave a clear gap and photograph the page from above.",
        action: "Draw 6 stars, then draw 4 more with a gap between them.",
        photoTip: "Make every star big and separate so they are easy to count.",
      },
      result: {
        title: "Fill one sticker sheet",
        instruction:
          "On a fresh space, draw one group of 10 large stars and photograph it from above.",
        action: "Draw one happy group of 10 stars.",
        photoTip: "Keep space between stars so none of them touch.",
      },
    },
    activityOptions: [
      {
        id: "pencil-case",
        label: "Use my pouch",
        description: "Make teams with little desk treasures.",
        materials: ["10 paper clips, mini erasers, coins, or caps", "A clear desk or notebook"],
        visionHint:
          "Count each individual, clearly separated desk item as one counter. Ignore hands, containers, and background patterns.",
        evidence: {
          setup: {
            title: "Make 6 and 4 teams",
            instruction:
              "Place 6 desk treasures on the left and 4 on the right. Leave a gap and photograph both teams from above.",
            action: "Make a team of 6 and a team of 4.",
            photoTip: "Leave a clear gap between the two teams.",
          },
          result: {
            title: "Pack 10 together",
            instruction:
              "Move the same treasures into one group of 10 and photograph the group from above.",
            action: "Pack all 10 desk treasures into one group.",
            photoTip: "Keep every treasure visible in the photo.",
          },
        },
      },
    ],
    xp: 30,
    explainer:
      "Addition joins two amounts into one total. Six stars and four stars make a full sheet of ten.",
  },
  {
    id: "sub-15-to-9",
    title: "Eraser Rescue",
    grade: "G2",
    concept: "Subtraction",
    promptMode: "object-count",
    instruction:
      "Start with a page full of doodles, then make a rescue page that shows what stayed.",
    challenge: "Can you start with 10 doodles, take away 3, and rescue 7?",
    activityMode: "draw",
    activityLabel: "Draw it",
    activityDescription: "Use little dots, stars, or smiley faces on paper.",
    visionHint:
      "Treat each large, separate drawn doodle as one counter. Ignore page lines and unrelated writing.",
    materials: ["Notebook or loose paper", "Pencil, pen, or marker"],
    durationMinutes: 3,
    predictionLabel: "How many doodles will be rescued?",
    targetSpec: {
      kind: "count",
      operation: "subtraction",
      operands: [10, 3],
      targetCount: 7,
      equation: "10 - 3 = 7",
    },
    evidence: {
      setup: {
        title: "Draw 10 doodles",
        instruction:
          "Draw 10 large, separate doodles in one group and photograph the page from above.",
        action: "Make one group of 10 dots, stars, or smiley faces.",
        photoTip: "Keep every doodle large and easy to count.",
      },
      result: {
        title: "Rescue 7 doodles",
        instruction:
          "On a fresh space, draw only the 7 doodles that were rescued and photograph them from above.",
        action: "Make a new group with only 7 doodles.",
        photoTip: "Do not include crossed-out or extra doodles in this photo.",
      },
    },
    activityOptions: [
      {
        id: "pencil-case",
        label: "Use my pouch",
        description: "Rescue tiny desk treasures from a group.",
        materials: ["10 paper clips, mini erasers, coins, or caps", "A clear desk or notebook"],
        visionHint:
          "Count each individual, clearly separated desk item as one counter. Ignore hands, containers, and background patterns.",
        evidence: {
          setup: {
            title: "Gather 10 treasures",
            instruction:
              "Place 10 desk treasures in one group and photograph them from above.",
            action: "Gather 10 tiny desk treasures.",
            photoTip: "Spread them out so all 10 are visible.",
          },
          result: {
            title: "Rescue 7 treasures",
            instruction:
              "Move 3 treasures away, leaving only 7 in the photo.",
            action: "Take 3 away and leave 7 behind.",
            photoTip: "Keep the 3 moved treasures out of the photo.",
          },
        },
      },
    ],
    xp: 30,
    explainer:
      "Subtraction tells what remains after part of a group is taken away. Ten doodles take away three leaves seven.",
  },
  {
    id: "multi-6-by-4",
    title: "Dot Grid Builder",
    grade: "G3",
    concept: "Multiplication",
    promptMode: "array",
    instruction:
      "Make a dot picture, then organize it into neat equal rows like a mini pixel picture.",
    challenge: "Can you turn 12 dots into 3 neat rows of 4?",
    activityMode: "draw",
    activityLabel: "Draw it",
    activityDescription: "Build a tiny dot picture in your notebook.",
    visionHint:
      "Treat each large, separate drawn dot as one counter. In the result, count straight rows and dots in each row.",
    materials: ["Notebook or loose paper", "Pencil, pen, or marker"],
    durationMinutes: 4,
    predictionLabel: "How many dots will your grid have?",
    targetSpec: {
      kind: "array",
      rows: 3,
      cols: 4,
      product: 12,
    },
    evidence: {
      setup: {
        title: "Draw 12 dots",
        instruction:
          "Draw 12 large, separate dots in a loose group and photograph the page from above.",
        action: "Make one loose group of 12 dots.",
        photoTip: "Leave lots of space so every dot is easy to see.",
      },
      result: {
        title: "Make 3 rows of 4",
        instruction:
          "On a fresh space, draw 3 straight rows with 4 dots in each row and photograph the full grid.",
        action: "Make 3 rows with 4 dots in every row.",
        photoTip: "Line up the dots so the rows are easy to spot.",
      },
    },
    activityOptions: [
      {
        id: "pencil-case",
        label: "Use my pouch",
        description: "Build a tiny grid with desk treasures.",
        materials: ["12 paper clips, mini erasers, coins, or caps", "A clear desk or notebook"],
        visionHint:
          "Count each individual, clearly separated desk item as one counter. In the result, count straight rows and items in each row.",
        evidence: {
          setup: {
            title: "Gather 12 treasures",
            instruction:
              "Place 12 desk treasures in a loose group and photograph them from above.",
            action: "Gather 12 tiny desk treasures.",
            photoTip: "Spread them out so every treasure is visible.",
          },
          result: {
            title: "Build 3 rows of 4",
            instruction:
              "Arrange the same treasures into 3 straight rows with 4 in each row, then photograph the grid.",
            action: "Make 3 straight rows with 4 treasures in each row.",
            photoTip: "Keep rows straight and leave small gaps between treasures.",
          },
        },
      },
    ],
    xp: 40,
    explainer:
      "A multiplication array uses equal rows. Three rows with four dots in each row makes twelve dots.",
  },
  {
    id: "divide-20-by-4",
    title: "Fair-Share Lunchbox",
    grade: "G3",
    concept: "Division",
    promptMode: "equal-groups",
    instruction:
      "Fill a pretend lunchbox, then share the snacks fairly so every friend gets the same amount.",
    challenge: "Can you share 12 snack dots fairly between 3 friends?",
    activityMode: "draw",
    activityLabel: "Draw it",
    activityDescription: "Draw snack dots and share them into friend groups.",
    visionHint:
      "Treat each large, separate drawn snack dot as one counter. In the result, count separated groups, dots per group, and the total.",
    materials: ["Notebook or loose paper", "Pencil, pen, or marker"],
    durationMinutes: 4,
    predictionLabel: "How many snack dots does each friend get?",
    targetSpec: {
      kind: "equalGroups",
      groups: 3,
      perGroup: 4,
      total: 12,
    },
    evidence: {
      setup: {
        title: "Draw 12 snack dots",
        instruction:
          "Draw 12 large, separate snack dots in one group and photograph the page from above.",
        action: "Make one lunchbox group with 12 snack dots.",
        photoTip: "Leave a little space around every dot.",
      },
      result: {
        title: "Share with 3 friends",
        instruction:
          "On a fresh space, draw 3 separated friend groups with 4 snack dots in each group.",
        action: "Make 3 fair groups with 4 snack dots each.",
        photoTip: "Leave a clear gap between the friend groups.",
      },
    },
    activityOptions: [
      {
        id: "pencil-case",
        label: "Use my pouch",
        description: "Share desk treasures fairly between friends.",
        materials: ["12 paper clips, mini erasers, coins, or caps", "A clear desk or notebook"],
        visionHint:
          "Count each individual, clearly separated desk item as one counter. In the result, count separated groups, items per group, and the total.",
        evidence: {
          setup: {
            title: "Gather 12 treasures",
            instruction:
              "Place 12 desk treasures in one group and photograph them from above.",
            action: "Gather 12 tiny desk treasures.",
            photoTip: "Spread them out so every treasure is visible.",
          },
          result: {
            title: "Share with 3 friends",
            instruction:
              "Split the treasures into 3 separated groups of 4 and photograph all the groups.",
            action: "Make 3 fair groups with 4 treasures each.",
            photoTip: "Leave a clear gap between each group.",
          },
        },
      },
    ],
    xp: 40,
    explainer:
      "Division shares a total into fair groups. Twelve snack dots split among three friends gives four each.",
  },
  {
    id: "fraction-fourths",
    title: "Secret Note Folds",
    grade: "G3",
    concept: "Fractions",
    promptMode: "fraction",
    instruction:
      "Turn one secret note into four fair parts that are ready to share.",
    challenge: "Can you fold one secret note into 4 fair parts?",
    activityMode: "paper",
    activityLabel: "Paper mission",
    activityDescription: "One sheet of paper is all you need.",
    visionHint:
      "The setup should show one undivided sheet. The result should show four roughly equal paper parts or folds clearly from above.",
    materials: ["1 sheet of paper", "A clear table"],
    durationMinutes: 5,
    predictionLabel: "What fraction is one part of the whole?",
    targetSpec: {
      kind: "fraction",
      parts: 4,
      roughlyEqual: true,
    },
    evidence: {
      setup: {
        title: "Show your secret note",
        instruction:
          "Place one whole sheet of paper flat on the table and photograph it from above.",
        action: "Lay one whole secret note flat on the table.",
        photoTip: "Fit the whole sheet inside your photo.",
      },
      result: {
        title: "Fold 4 fair parts",
        instruction:
          "Fold the paper to show 4 roughly equal parts, then photograph the whole paper from above.",
        action: "Fold your note so it shows 4 nearly equal parts.",
        photoTip: "Open the paper enough for all 4 parts to be easy to see.",
      },
    },
    xp: 45,
    explainer:
      "Four equal parts make fourths. Each part is one fourth of the whole.",
  },
  {
    id: "geometry-right-angle",
    title: "Corner Detective",
    grade: "G4",
    concept: "Geometry",
    promptMode: "angle",
    instruction:
      "Use paper to discover a perfect square corner, just like the corner of a book or notebook.",
    challenge: "Can you make a square corner that is a right angle?",
    activityMode: "paper",
    activityLabel: "Paper mission",
    activityDescription: "Use one sheet of paper like a corner detective.",
    visionHint:
      "The setup should show one flat sheet of paper. The result should show a clear folded corner with both straight angle arms visible.",
    materials: ["1 sheet of paper", "A clear table"],
    durationMinutes: 4,
    predictionLabel: "About how many degrees is a right angle?",
    targetSpec: {
      kind: "angle",
      targetDeg: 90,
      minDeg: 80,
      maxDeg: 100,
    },
    evidence: {
      setup: {
        title: "Find a flat sheet",
        instruction:
          "Place one flat sheet of paper where its edges and corners are clearly visible, then photograph it.",
        action: "Place one flat sheet of paper on the table.",
        photoTip: "Make sure its edges and corners are easy to see.",
      },
      result: {
        title: "Make a square corner",
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
    title: "Pencil Power Check",
    grade: "G4",
    concept: "Measurement",
    promptMode: "measurement",
    instruction:
      "Make a smart guess, then use your ruler powers to measure a favorite pencil.",
    challenge: "Can you guess your pencil's length, then measure it in centimeters?",
    activityMode: "measure",
    activityLabel: "Pencil mission",
    activityDescription: "Grab one pencil and a centimeter ruler.",
    visionHint:
      "The setup should show a pencil and ruler separately. The result must show the ruler zero aligned with one pencil end and readable centimeter marks.",
    materials: ["1 pencil", "1 centimeter ruler"],
    durationMinutes: 4,
    predictionLabel: "Your estimate in centimeters",
    targetSpec: {
      kind: "measurement",
      objectName: "standard pencil",
      referenceLengthCm: 18,
      toleranceCm: 3,
    },
    evidence: {
      setup: {
        title: "Make a pencil guess",
        instruction:
          "Place the pencil and ruler separately so both are visible. Enter your estimate before taking this photo.",
        action: "Place your favorite pencil and ruler apart, then make a smart guess.",
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
    title: "High-Five Dots",
    grade: "G2",
    concept: "Multiplication",
    promptMode: "skip-counting",
    instruction:
      "Make little high-five groups and count them like a skip-counting superhero.",
    challenge: "Can you make 3 high-five groups and count all the way to 15?",
    activityMode: "draw",
    activityLabel: "Draw it",
    activityDescription: "Draw high-five dots in your notebook.",
    visionHint:
      "Treat each large, separate drawn dot as one counter. In the result, count separated groups, dots per group, and the total.",
    materials: ["Notebook or loose paper", "Pencil, pen, or marker"],
    durationMinutes: 4,
    predictionLabel: "How many groups of 5 make 15?",
    targetSpec: {
      kind: "equalGroups",
      groups: 3,
      perGroup: 5,
      total: 15,
    },
    evidence: {
      setup: {
        title: "Draw 15 dots",
        instruction:
          "Draw 15 large, separate dots in one loose group and photograph the page from above.",
        action: "Make one loose group of 15 dots.",
        photoTip: "Leave space around every dot so they are easy to count.",
      },
      result: {
        title: "Make 3 high-five groups",
        instruction:
          "On a fresh space, draw 3 separated groups with 5 dots in each group and photograph all groups from above.",
        action: "Make 3 groups with 5 dots in every group.",
        photoTip: "Leave a clear gap between the high-five groups.",
      },
    },
    activityOptions: [
      {
        id: "pencil-case",
        label: "Use my pouch",
        description: "Make high-five groups with desk treasures.",
        materials: ["15 paper clips, mini erasers, coins, or caps", "A clear desk or notebook"],
        visionHint:
          "Count each individual, clearly separated desk item as one counter. In the result, count separated groups, items per group, and the total.",
        evidence: {
          setup: {
            title: "Gather 15 treasures",
            instruction:
              "Place 15 desk treasures in one loose group and photograph them from above.",
            action: "Gather 15 tiny desk treasures.",
            photoTip: "Spread them out so every treasure is visible.",
          },
          result: {
            title: "Make 3 high-five groups",
            instruction:
              "Arrange the treasures into 3 separated groups of 5 and photograph all groups from above.",
            action: "Make 3 groups with 5 treasures in each group.",
            photoTip: "Leave a clear gap between each group.",
          },
        },
      },
    ],
    xp: 35,
    explainer:
      "Skip counting by fives counts equal groups: 5, 10, 15.",
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

export function getMissionActivities(mission: Mission): MissionActivity[] {
  return [
    {
      id: mission.activityMode,
      label: mission.activityLabel,
      description: mission.activityDescription,
      materials: mission.materials,
      evidence: mission.evidence,
      visionHint: mission.visionHint,
    },
    ...(mission.activityOptions ?? []),
  ];
}

export function getMissionActivity(mission: Mission, mode?: string) {
  return (
    getMissionActivities(mission).find((activity) => activity.id === mode) ??
    getMissionActivities(mission)[0]
  );
}
