
import React, { useState, useEffect, useRef } from 'react';
import VideoUploader from './components/VideoUploader';
import CaptionList from './components/CaptionList';
import { VideoState, CaptionVibe, SegmentStyle } from './types';
import { fileToBase64, generateVideoCaptions } from './services/geminiService';

const LOADING_STEPS = [
  { message: "Reading high-capacity video buffer... 📂", threshold: 15 },
  { message: "Optimizing frames for AI analysis... 🖼️", threshold: 30 },
  { message: "Analyzing audio waveforms... 🎧", threshold: 50 },
  { message: "Capturing exact Hinglish phonetics... 🗣️", threshold: 75 },
  { message: "Syncing word-to-word timestamps... ⏱️", threshold: 90 },
  { message: "Finalizing verbatim script... ✍️", threshold: 98 }
];

const App: React.FC = () => {
  const [state, setState] = useState<VideoState>({
    file: null,
    previewUrl: null,
    isProcessing: false,
    captions: [],
    error: null
  });

  const [vibe, setVibe] = useState<CaptionVibe>('exact');
  const [segmentStyle, setSegmentStyle] = useState<SegmentStyle>('standard');
  const [highPrecision, setHighPrecision] = useState(true);
  const [progress, setProgress] = useState(0);
  const [currentStepMsg, setCurrentStepMsg] = useState(LOADING_STEPS[0].message);
  
  const progressInterval = useRef<any>(null);

  useEffect(() => {
    if (state.isProcessing) {
      let currentProgress = 0;
      progressInterval.current = setInterval(() => {
        currentProgress += (100 - currentProgress) * 0.05;
        const rounded = Math.floor(currentProgress);
        setProgress(rounded);
        const step = LOADING_STEPS.find(s => rounded <= s.threshold) || LOADING_STEPS[LOADING_STEPS.length - 1];
        setCurrentStepMsg(step.message);
      }, 800);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
      if (!state.error) setProgress(0);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [state.isProcessing, state.error]);

  const handleFileSelect = (file: File) => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    setState({
      file,
      previewUrl: URL.createObjectURL(file),
      captions: [],
      isProcessing: false,
      error: null
    });
    setProgress(0);
  };

  const processVideo = async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null, captions: [] }));
    setProgress(5);

    try {
      await new Promise(r => setTimeout(r, 500));
      const b64 = await fileToBase64(state.file!);
      setProgress(20);
      const results = await generateVideoCaptions(b64, state.file!.type, vibe, highPrecision, segmentStyle);
      setProgress(100);
      setState(prev => ({ ...prev, isProcessing: false, captions: results }));
    } catch (err: any) {
      console.error("Processing Error:", err);
      let errorMsg = err.message || "An unknown error occurred.";
      if (err.name === 'RangeError' || errorMsg.toLowerCase().includes('memory') || errorMsg.toLowerCase().includes('large')) {
        errorMsg = "MEMORY LIMIT REACHED: Large video file detected. Try a video under 50MB or 2 minutes for browser stability.";
      }
      setState(prev => ({ ...prev, isProcessing: false, error: errorMsg }));
    }
  };

  return (
    <div className="min-h-screen bg-[#050810] text-slate-50 font-sans selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 bg-[#050810]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="fa-solid fa-microphone-lines text-white text-lg"></i>
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight leading-none">CapGen Pro</h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Verbatim Hinglish AI</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-bold uppercase transition-all ${
              highPrecision ? 'border-violet-500/50 bg-violet-500/10 text-violet-400' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${highPrecision ? 'bg-violet-500' : 'bg-emerald-500'}`}></div>
              {highPrecision ? 'Deep Analysis (Pro)' : 'Standard Analysis'}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter">
                Word-to-Word <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">Precision.</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                Transcribe big videos into 100% accurate verbatim Hinglish captions.
              </p>
            </div>

            <div className="bg-white/[0.02] p-1 rounded-[2.5rem] border border-white/5">
              <div className="bg-[#0c101d] rounded-[2.2rem] p-6 md:p-8 shadow-2xl space-y-8">
                <VideoUploader 
                  onFileSelect={handleFileSelect} 
                  previewUrl={state.previewUrl} 
                  isProcessing={state.isProcessing}
                  onError={(msg) => setState(prev => ({ ...prev, error: msg }))}
                />

                {state.file && (
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="grid sm:grid-cols-1 gap-8">
                      {/* Vibe Selection */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Transcription Vibe</label>
                        <div className="flex p-1 bg-black/40 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
                          {(['exact', 'casual', 'hype', 'funny'] as const).map(v => (
                            <button
                              key={v}
                              onClick={() => setVibe(v)}
                              disabled={state.isProcessing}
                              className={`flex-1 min-w-[80px] py-2.5 rounded-lg text-xs font-bold capitalize transition-all ${
                                vibe === v ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Segment Style Selection */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Display Style (Words per row)</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => setSegmentStyle('standard')}
                            disabled={state.isProcessing}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                              segmentStyle === 'standard' 
                              ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-lg shadow-indigo-500/5' 
                              : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <i className="fa-solid fa-align-left mb-2"></i>
                            <span className="text-xs font-bold">Standard</span>
                            <span className="text-[9px] opacity-60">4-5 words per row</span>
                          </button>
                          <button
                            onClick={() => setSegmentStyle('triple')}
                            disabled={state.isProcessing}
                            className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                              segmentStyle === 'triple' 
                              ? 'bg-violet-500/10 border-violet-500/40 text-violet-400 shadow-lg shadow-violet-500/5' 
                              : 'bg-black/40 border-white/5 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            <i className="fa-solid fa-list-ol mb-2"></i>
                            <span className="text-xs font-bold">Triple</span>
                            <span className="text-[9px] opacity-60">3 words per row</span>
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Analysis Engine</label>
                        <button
                          onClick={() => setHighPrecision(!highPrecision)}
                          disabled={state.isProcessing}
                          className={`w-full flex items-center justify-between px-5 py-3 rounded-xl border transition-all ${
                            highPrecision 
                            ? 'bg-violet-500/10 border-violet-500/40 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.1)]' 
                            : 'bg-black/40 border-white/5 text-slate-400'
                          }`}
                        >
                          <div className="flex flex-col items-start text-left">
                            <span className="text-xs font-bold">Deep Analysis (Gemini Pro)</span>
                            <span className="text-[9px] opacity-60">Best for heavy audio with noise</span>
                          </div>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${highPrecision ? 'bg-violet-500' : 'bg-slate-700'}`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${highPrecision ? 'left-6' : 'left-1'}`}></div>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <button
                        onClick={processVideo}
                        disabled={state.isProcessing}
                        className={`w-full py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all relative overflow-hidden group ${
                          state.isProcessing 
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-2xl shadow-indigo-500/20 active:scale-95'
                        }`}
                      >
                        {state.isProcessing ? (
                          <>
                            <i className="fa-solid fa-circle-notch fa-spin"></i>
                            <span>Analyzing...</span>
                          </>
                        ) : (
                          <>
                            <i className="fa-solid fa-wand-magic-sparkles"></i>
                            Generate Verbatim Captions
                          </>
                        )}
                      </button>

                      {state.isProcessing && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                          <div className="flex justify-between items-end">
                            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider">{currentStepMsg}</span>
                            <span className="text-sm font-black text-white">{progress}%</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <p className="text-[10px] text-slate-500 text-center italic">Processing large videos can take 1-3 minutes. Please don't refresh.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {state.error && (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl flex gap-4 text-red-400 text-sm shadow-xl">
                <i className="fa-solid fa-circle-exclamation text-xl"></i>
                <div className="space-y-1">
                  <p className="font-bold">Error</p>
                  <p className="opacity-80 leading-relaxed">{state.error}</p>
                </div>
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-28">
            <CaptionList captions={state.captions} isProcessing={state.isProcessing} />
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-white/5 bg-black/20 text-center">
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
          AI Verbatim Engine &bull; Optimised for Big Videos
        </p>
      </footer>
    </div>
  );
};

export default App;
