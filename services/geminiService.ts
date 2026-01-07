
import { GoogleGenAI, Type } from "@google/genai";
import { CaptionEntry, CaptionVibe, SegmentStyle } from "../types";

/**
 * Highly Optimized Chunked Base64 Converter
 * Handles large video buffers without crashing browser memory.
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const len = bytes.byteLength;
      
      // Smaller chunk size for better memory management on mobile/low-ram devices
      const chunk_size = 4096;
      
      try {
        for (let i = 0; i < len; i += chunk_size) {
          const chunk = bytes.subarray(i, i + chunk_size);
          // @ts-ignore
          binary += String.fromCharCode.apply(null, chunk);
        }
        const b64 = btoa(binary);
        resolve(b64);
      } catch (e) {
        reject(new Error("BROWSER MEMORY LIMIT: This video file is too large for the browser's current RAM. Please try a smaller file (<50MB)."));
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
  highPrecision: boolean = false,
  segmentStyle: SegmentStyle = 'standard'
): Promise<CaptionEntry[]> => {
  // Use the API KEY from the process environment
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use Gemini 3 Flash for speed on large files unless explicitly choosing Pro
  const modelName = highPrecision ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

  const isTripleMode = segmentStyle === 'triple';

  const systemInstruction = `
    You are a high-precision verbatim transcriptionist.
    
    CORE GOAL: 100% WORD-TO-WORD Hinglish transcription.
    
    DISPLAY STYLE: ${isTripleMode ? 'TRIPLE (3 Words per row)' : 'STANDARD (4-5 Words per row)'}
    
    CRITICAL INSTRUCTIONS:
    1. Transcribe EXACTLY what is spoken. No paraphrasing.
    2. Format: Hinglish (Hindi words in English/Roman script).
    3. SEGMENTATION RULES:
       ${isTripleMode 
         ? '- Group exactly 3 words per timestamp. Each entry in the JSON MUST contain 3 words where possible.' 
         : '- Group 4 to 5 words per timestamp. Never exceed 6 words per row.'}
    4. Sync: Timestamps must be very accurate to the exact moment the phrase starts.
    5. Mode: ${vibe}.
    
    ACCURACY MODES:
    - Exact: Capture every single word including repetition. 
    - Casual: Normal Hinglish speaking style.
    - Hype/Funny: Accurate but with emojis or slang emphasis.
    
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
            text: `Transcribe this video verbatim. Style: ${segmentStyle}. Vibe: ${vibe}. Ensure strict ${isTripleMode ? '3 words per segment' : '4-5 words per segment'} formatting.`
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
              timestamp: { type: Type.STRING, description: "MM:SS format" },
              text: { type: Type.STRING, description: isTripleMode ? "Exactly 3 spoken words" : "4-5 spoken words" },
            },
            required: ["timestamp", "text"],
          },
        },
      },
    });

    if (!response.text) return [];
    return JSON.parse(response.text.trim()) as CaptionEntry[];
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("413") || error.message?.includes("too large") || error.message?.includes("quota")) {
      throw new Error("VIDEO TOO BIG: The AI model has a size limit. Please try a shorter video or compress it.");
    }
    throw error;
  }
};
