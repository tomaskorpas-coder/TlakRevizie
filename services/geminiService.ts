import { GoogleGenAI, Type } from "@google/genai";
import { InspectionReport } from "../types";

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const extractDataFromImage = async (base64Image: string, mimeType: string): Promise<Partial<InspectionReport>> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Schema for extraction
  const schema = {
    type: Type.OBJECT,
    properties: {
      manufacturer: { type: Type.STRING },
      serialNumber: { type: Type.STRING },
      yearOfManufacture: { type: Type.STRING },
      volumeLiters: { type: Type.STRING },
      nominalPressure: { type: Type.STRING },
      nominalTemp: { type: Type.STRING },
      tnsType: { type: Type.STRING },
      operatorName: { type: Type.STRING },
    },
    required: ["manufacturer", "serialNumber"],
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mimeType
                }
            },
            {
                text: "Analyze this image of a pressure vessel nameplate or inspection report. Extract the technical details into JSON. If a value is missing, leave it empty."
            }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) return {};
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini analysis failed", error);
    throw error;
  }
};