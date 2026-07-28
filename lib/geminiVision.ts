import { GoogleGenAI } from "@google/genai";
import type { EvidenceVisionResult } from "@/lib/evaluate";
import type { Mission, MissionActivity } from "@/lib/missions";
import { buildPrompt, schemaForMission } from "@/lib/prompts";

export type EvidenceImageInput = {
  imageBase64: string;
  mimeType: string;
};

export type GeminiVisionInput = {
  mission: Mission;
  activity: MissionActivity;
  setupImage: EvidenceImageInput;
  resultImage: EvidenceImageInput;
  apiKey: string;
  modelName?: string;
};

export async function verifyEvidenceWithGemini({
  mission,
  activity,
  setupImage,
  resultImage,
  apiKey,
  modelName = "gemini-2.5-flash",
}: GeminiVisionInput): Promise<EvidenceVisionResult> {
  const genAI = new GoogleGenAI({ apiKey });
  const result = await genAI.models.generateContent({
    model: modelName,
    contents: [
      buildPrompt(mission, activity),
      "SETUP PHOTO:",
      {
        inlineData: {
          data: setupImage.imageBase64,
          mimeType: setupImage.mimeType,
        },
      },
      "RESULT PHOTO:",
      {
        inlineData: {
          data: resultImage.imageBase64,
          mimeType: resultImage.mimeType,
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

  return JSON.parse(result.text) as EvidenceVisionResult;
}
