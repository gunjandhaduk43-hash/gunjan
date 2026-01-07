
export interface CaptionEntry {
  timestamp: string;
  text: string;
}

export interface VideoState {
  file: File | null;
  previewUrl: string | null;
  isProcessing: boolean;
  captions: CaptionEntry[];
  error: string | null;
}

export type CaptionVibe = 'casual' | 'hype' | 'funny' | 'exact';
export type SegmentStyle = 'standard' | 'triple';
