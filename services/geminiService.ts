
import { GoogleGenAI, Type } from "@google/genai";

// Inisialisasi secara aman
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    console.warn("API_KEY is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeLetter = async (text: string) => {
  if (!text) return null;
  
  const ai = getAIInstance();
  if (!ai) return null;

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

    return JSON.parse(response.text.trim());
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return null;
  }
};
