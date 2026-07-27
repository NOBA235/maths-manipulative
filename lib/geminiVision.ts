import { GoogleGenerativeAI } from "@google/generative-ai";
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
  modelName = "gemini-1.5-flash",
}: GeminiVisionInput): Promise<VisionResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schemaForMission(mission) as never,
      temperature: 0.1,
    },
  });

  const result = await model.generateContent([
    buildPrompt(mission),
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
  ]);

  return JSON.parse(result.response.text()) as VisionResult;
}
