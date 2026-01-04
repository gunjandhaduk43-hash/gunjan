
import { GoogleGenAI, Type } from "@google/genai";
import { CaptionEntry, CaptionVibe } from "../types";

/**
 * Optimized Chunked Base64 Converter
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const len = bytes.byteLength;
      const chunk_size = 8192;
      
      try {
        for (let i = 0; i < len; i += chunk_size) {
          const chunk = bytes.slice(i, i + chunk_size);
          // @ts-ignore
          binary += String.fromCharCode.apply(null, chunk);
        }
        const b64 = btoa(binary);
        resolve(b64);
      } catch (e) {
        reject(new Error("Memory Limit: Video too large for processing."));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read video file."));
    reader.readAsArrayBuffer(file);
  });
};

export const generateVideoCaptions = async (
  videoBase64: string, 
  mimeType: string,
  vibe: CaptionVibe = 'casual',
  highPrecision: boolean = false
): Promise<CaptionEntry[]> => {
  // Always initialize with the environment key directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // High Precision (Deep Analysis) uses the Pro model, otherwise Flash.
  const modelName = highPrecision ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

  const systemInstruction = `
    You are a high-precision video transcriptionist and editor.
    Your task: Create PERFECT Hinglish (Hindi words in English script) captions.
    
    CORE REQUIREMENT: WORD-TO-WORD ACCURACY.
    You must transcribe exactly what is spoken. Do not summarize. Do not skip fillers if they are significant.
    
    CRITICAL RULES:
    1. Language: Hinglish (WhatsApp style/Romanized Hindi).
    2. Sync: Create a new segment every 2-4 seconds matching the audio timing.
    3. Length: Max 5-7 words per chunk to keep it readable.
    4. Mode: ${vibe}.
    
    TONE & ACCURACY MODES:
    - Exact: VERBATIM TRANSCRIPTION. Capture every word exactly as spoken. No creative changes.
    - Casual: Natural Hinglish, captures the gist accurately but keeps it conversational.
    - Hype: Punchy, bold, emphasizes key words, use 🔥 ⚡ emojis.
    - Funny: Accurate transcription but uses witty Desi slang equivalents where appropriate.
    
    STRICT TRANSCRIPTION RULES:
    - If the speaker says "Bhai sahab", do not write "Brother". Write "Bhai sahab".
    - If the speaker says "Technical glitch hai", write exactly that.
    - Ensure timestamps are perfectly aligned with when the words are actually said.
    
    Output JSON format: [{"timestamp": "MM:SS", "text": "..."}]
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
            text: `Transcribe this video word-to-word in ${vibe} Hinglish. Priority: Maximum accuracy. Deep Analysis: ${highPrecision}.`
          }
        ]
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              timestamp: { type: Type.STRING },
              text: { type: Type.STRING },
            },
            required: ["timestamp", "text"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]") as CaptionEntry[];
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message?.includes("413") || error.message?.includes("too large")) {
      throw new Error("Video file is too large for the AI to process in one go.");
    }
    throw error;
  }
};
