import { NextResponse } from "next/server";
import { evaluateMission } from "@/lib/evaluate";
import { getMission } from "@/lib/missions";
import { verifyImageWithGemini } from "@/lib/geminiVision";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const missionId = String(formData.get("missionId") ?? "");
  const prediction = String(formData.get("prediction") ?? "");
  const image = formData.get("image");
  const mission = getMission(missionId);
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!mission) {
    return NextResponse.json({ error: "Unknown mission." }, { status: 400 });
  }

  if (!(image instanceof File)) {
    return NextResponse.json({ error: "Photo is required." }, { status: 400 });
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
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const vision = await verifyImageWithGemini({
      mission,
      imageBase64: imageBuffer.toString("base64"),
      mimeType: image.type || "image/jpeg",
      apiKey,
      modelName: process.env.GEMINI_MODEL,
    });
    const evaluation = evaluateMission(mission, vision, prediction);

    return NextResponse.json({
      vision,
      evaluation,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          "Gemini could not verify this photo. Try a clearer image or check the API key.",
      },
      { status: 502 },
    );
  }
}
