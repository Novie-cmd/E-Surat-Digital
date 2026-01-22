
import { GoogleGenAI, Type } from "@google/genai";

// Always use the direct process.env.API_KEY reference in the constructor as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLetter = async (text: string) => {
  if (!text || !process.env.API_KEY) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this letter text and extract key information in Indonesian: ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: "Ringkasan singkat surat" },
            category: { type: Type.STRING, description: "Kategori surat (e.g., Undangan, Pemberitahuan, Izin)" },
            priority: { type: Type.STRING, description: "Tingkat kepentingan (Tinggi, Sedang, Rendah)" }
          },
          required: ["summary", "category", "priority"]
        }
      }
    });

    // Extract text property directly as it is a getter.
    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
