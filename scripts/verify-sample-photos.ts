import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { evaluateMission } from "../lib/evaluate";
import { missions } from "../lib/missions";
import { verifyImageWithGemini } from "../lib/geminiVision";

const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
const root = process.argv[2] ?? "sample-photos";
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

if (!apiKey) {
  console.error("Set GEMINI_API_KEY before running sample photo verification.");
  process.exit(1);
}

async function main() {
  const rootExists = await exists(root);

  if (!rootExists) {
    console.error(
      `Create ${root}/<mission-id>/ with 3-4 photos per mission, including one messy ambiguous photo.`,
    );
    process.exit(1);
  }

  for (const mission of missions) {
    const folder = path.join(root, mission.id);
    const photos = (await safeReadDir(folder))
      .filter((file) => imageExtensions.has(path.extname(file).toLowerCase()))
      .slice(0, 4);

    if (photos.length === 0) {
      console.log(`${mission.id}: no sample photos found`);
      continue;
    }

    for (const photo of photos) {
      const filePath = path.join(folder, photo);
      const image = await readFile(filePath);
      const vision = await verifyImageWithGemini({
        mission,
        imageBase64: image.toString("base64"),
        mimeType: mimeTypeFor(filePath),
        apiKey,
        modelName: process.env.GEMINI_MODEL,
      });
      const evaluation = evaluateMission(mission, vision);

      console.log(
        `${mission.id}/${photo}: ${evaluation.status} | actual=${evaluation.actual} | needed=${evaluation.needed}`,
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

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
