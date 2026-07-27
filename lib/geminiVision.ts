import { GoogleGenAI } from "@google/genai";
import type { VisionResult } from "@/lib/evaluate";
import type { Mission } from "@/lib/missions";
import { buildPrompt, schemaForMission } from "@/lib/prompts";

export type GeminiVisionInput = {
  mission: Mission;
  imageBase64: string;
  mimeType: string;
  apiKey: string;
  modelName?: string;
};

export async function verifyImageWithGemini({
  mission,
  imageBase64,
  mimeType,
  apiKey,
  modelName = "gemini-2.5-flash",
}: GeminiVisionInput): Promise<VisionResult> {
  const genAI = new GoogleGenAI({ apiKey });
  const result = await genAI.models.generateContent({
    model: modelName,
    contents: [
      buildPrompt(mission),
      {
        inlineData: {
          data: imageBase64,
          mimeType,
        },
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: schemaForMission(mission),
    },
  });

  if (!result.text) {
    throw new Error("Gemini returned no verification result.");
  }

  return JSON.parse(result.text) as VisionResult;
}
