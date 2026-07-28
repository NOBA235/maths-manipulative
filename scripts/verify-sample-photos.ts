import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { evaluateMission } from "../lib/evaluate";
import { getMissionActivity, missions } from "../lib/missions";
import { verifyEvidenceWithGemini } from "../lib/geminiVision";

const apiKey = getApiKey();
const root = process.argv[2] ?? "sample-photos";

async function main() {
  const rootExists = await exists(root);

  if (!rootExists) {
    console.error(
      `Create ${root}/<mission-id>/ with setup-1.jpg and result-1.jpg evidence pairs.`,
    );
    process.exit(1);
  }

  for (const mission of missions) {
    const activity = getMissionActivity(mission);
    const folder = path.join(root, mission.id);
    const pairs = findPhotoPairs(await safeReadDir(folder)).slice(0, 4);

    if (pairs.length === 0) {
      console.log(`${mission.id}: no complete evidence pairs found`);
      continue;
    }

    for (const pair of pairs) {
      const setupPath = path.join(folder, pair.setup);
      const resultPath = path.join(folder, pair.result);
      const [setupImage, resultImage] = await Promise.all([
        readFile(setupPath),
        readFile(resultPath),
      ]);
      const vision = await verifyEvidenceWithGemini({
        mission,
        activity,
        setupImage: {
          imageBase64: setupImage.toString("base64"),
          mimeType: mimeTypeFor(setupPath),
        },
        resultImage: {
          imageBase64: resultImage.toString("base64"),
          mimeType: mimeTypeFor(resultPath),
        },
        apiKey,
        modelName: process.env.GEMINI_MODEL,
      });
      const evaluation = evaluateMission(mission, vision, undefined, activity);

      console.log(
        `${mission.id}/${pair.id}: ${evaluation.status} | actual=${evaluation.actual} | needed=${evaluation.needed}`,
      );
    }
  }
}

async function exists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function safeReadDir(folder: string) {
  try {
    return await readdir(folder);
  } catch {
    return [];
  }
}

function findPhotoPairs(files: string[]) {
  const pairs = new Map<string, { setup?: string; result?: string }>();

  for (const file of files) {
    const match = file.match(
      /^(setup|result)(?:[-_]([^.]+))?\.(jpg|jpeg|png|webp)$/i,
    );

    if (!match) {
      continue;
    }

    const stage = match[1].toLowerCase() as "setup" | "result";
    const id = match[2] ?? "1";
    const pair = pairs.get(id) ?? {};
    pair[stage] = file;
    pairs.set(id, pair);
  }

  return [...pairs.entries()]
    .filter(
      (entry): entry is [string, { setup: string; result: string }] =>
        Boolean(entry[1].setup && entry[1].result),
    )
    .map(([id, pair]) => ({ id, ...pair }))
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

function mimeTypeFor(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".png") {
    return "image/png";
  }

  if (ext === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

function getApiKey() {
  const key = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!key) {
    console.error("Set GEMINI_API_KEY before running sample photo verification.");
    process.exit(1);
  }

  return key;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
