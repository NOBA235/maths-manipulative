import { NextResponse } from "next/server";
import { evaluateMission } from "@/lib/evaluate";
import { getMission, getMissionActivity } from "@/lib/missions";
import { verifyEvidenceWithGemini } from "@/lib/geminiVision";

export const runtime = "nodejs";

const maxImageBytes = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const missionId = String(formData.get("missionId") ?? "");
  const activityMode = String(formData.get("activityMode") ?? "");
  const prediction = String(formData.get("prediction") ?? "");
  const setupImage = formData.get("setupImage");
  const resultImage = formData.get("resultImage");
  const mission = getMission(missionId);
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!mission) {
    return NextResponse.json({ error: "Unknown mission." }, { status: 400 });
  }

  const activity = getMissionActivity(mission, activityMode || undefined);

  if (activityMode && activity.id !== activityMode) {
    return NextResponse.json(
      { error: "That activity kit is not available for this mission." },
      { status: 400 },
    );
  }

  if (!(setupImage instanceof File) || !(resultImage instanceof File)) {
    return NextResponse.json(
      { error: "Setup and result photos are required." },
      { status: 400 },
    );
  }

  const imageError =
    validateImage(setupImage, "Setup") ??
    validateImage(resultImage, "Result");

  if (imageError) {
    return NextResponse.json({ error: imageError }, { status: 400 });
  }

  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Missing GEMINI_API_KEY. Add it to .env.local, then restart the dev server.",
      },
      { status: 500 },
    );
  }

  try {
    const [setupBuffer, resultBuffer] = await Promise.all([
      setupImage.arrayBuffer(),
      resultImage.arrayBuffer(),
    ]);
    const vision = await verifyEvidenceWithGemini({
      mission,
      activity,
      setupImage: {
        imageBase64: Buffer.from(setupBuffer).toString("base64"),
        mimeType: setupImage.type || "image/jpeg",
      },
      resultImage: {
        imageBase64: Buffer.from(resultBuffer).toString("base64"),
        mimeType: resultImage.type || "image/jpeg",
      },
      apiKey,
      modelName: process.env.GEMINI_MODEL,
    });
    const evaluation = evaluateMission(mission, vision, prediction, activity);

    return NextResponse.json({
      vision,
      evaluation,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          "Gemini could not verify this evidence. Try clearer images or check the API key.",
      },
      { status: 502 },
    );
  }
}

function validateImage(image: File, label: string) {
  if (image.size > maxImageBytes) {
    return `${label} photo must be smaller than 10 MB.`;
  }

  if (image.type && !image.type.startsWith("image/")) {
    return `${label} evidence must be an image.`;
  }

  return undefined;
}
