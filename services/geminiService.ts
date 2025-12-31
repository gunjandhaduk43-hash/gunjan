
import { GoogleGenAI, Type } from "@google/genai";
import { CaptionEntry } from "../types";

const API_KEY = process.env.API_KEY || "";

export const generateVideoCaptions = async (
  videoBase64: string, 
  mimeType: string,
  vibe: string = 'casual',
  highPrecision: boolean = false
): Promise<CaptionEntry[]> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is configured.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const modelName = highPrecision ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

  const systemInstruction = `
    You are a professional video subtitler specializing in short-form content (Reels/Shorts).
    Your goal is to generate extremely accurate, small-chunk captions in Hinglish (WhatsApp style).
    
    CRITICAL CONSTRAINTS:
    1. WORD LIMIT: Each caption MUST be between 4 to 6 words maximum.
    2. FREQUENCY: Provide a new timestamp for every 2-4 seconds of video.
    3. LANGUAGE: Use Romanized Hindi (Hinglish) with WhatsApp-style shortcuts (u, r, k, bcz).
    4. ACCURACY: Timestamps must perfectly align with when the words are spoken or the action happens.
    
    TONE: ${vibe === 'hype' ? 'High energy, viral, fire emojis.' : vibe === 'funny' ? 'Sarcastic, meme-style, laughing emojis.' : 'Casual, relatable.'}
    
    EXAMPLE FORMAT:
    00:01 - "Bhai aaj scene kuch"
    00:03 - "alag hi hone wala hai"
    00:05 - "Check karo ye view 😍"
    
    Output MUST be a JSON array of objects with 'timestamp' (MM:SS) and 'text'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: videoBase64,
              mimeType: mimeType
            }
          },
          {
            text: `Break this video into 5-6 word segments with accurate timestamps. Style: Hinglish ${vibe}.`
          }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        ...(highPrecision ? { thinkingConfig: { thinkingBudget: 4000 } } : {}),
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              timestamp: {
                type: Type.STRING,
                description: "Format MM:SS",
              },
              text: {
                type: Type.STRING,
                description: "The 5-6 word Hinglish caption",
              },
            },
            required: ["timestamp", "text"],
          },
        },
      },
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("No response from AI model.");
    }

    return JSON.parse(resultText) as CaptionEntry[];
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};
