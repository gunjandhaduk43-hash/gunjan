
import React, { useState, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import CaptionList from './components/CaptionList';
import { VideoState, CaptionVibe } from './types';
import { fileToBase64, generateVideoCaptions } from './services/geminiService';

const LOADING_MESSAGES = [
  "Analyzing audio waves... 🎧",
  "Capturing exact words... 🗣️",
  "Checking word-to-word match... ✅",
  "Syncing timestamps... ⏱️",
  "Finalizing Hinglish script... ✍️"
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
  const [highPrecision, setHighPrecision] = useState(true);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    let interval: any;
    if (state.isProcessing) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 4000);
    }
    return () => clearInterval(interval);
  }, [state.isProcessing]);

  const handleFileSelect = (file: File) => {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    setState({
      file,
      previewUrl: URL.createObjectURL(file),
      captions: [],
      isProcessing: false,
      error: null
    });
  };

  const processVideo = async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));

    setTimeout(async () => {
      let b64: string | null = null;
      try {
        b64 = await fileToBase64(state.file!);
        const results = await generateVideoCaptions(b64, state.file!.type, vibe, highPrecision);
        setState(prev => ({ ...prev, isProcessing: false, captions: results }));
      } catch (err: any) {
        console.error("Processing Error:", err);
        let errorMsg = err.message || "An unknown error occurred.";
        
        if (err.name === 'RangeError' || errorMsg.toLowerCase().includes('memory')) {
          errorMsg = "OUT OF MEMORY: Your browser's RAM limit was reached. Please compress your video to 720p or use a shorter clip.";
        }

        setState(prev => ({ ...prev, isProcessing: false, error: errorMsg }));
      } finally {
        b64 = null;
      }
    }, 200);
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
                Word-to-Word <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">Accuracy.</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-md leading-relaxed">
                Generate 100% accurate verbatim Hinglish captions. Perfect for tutorials, podcasts, and interviews.
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
                    <div className="grid sm:grid-cols-1 gap-6">
                      {/* Vibe Selector */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Transcription Style</label>
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
                        <p className="text-[10px] text-slate-500 italic">
                          {vibe === 'exact' ? "*Recommended: Captures every single word spoken." : "*Optimizes phrasing for better reading speed."}
                        </p>
                      </div>

                      {/* Deep Analysis Toggle */}
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
                          <div className="flex flex-col items-start">
                            <span className="text-xs font-bold">Deep Analysis (Gemini Pro)</span>
                            <span className="text-[9px] opacity-60">Uses more power for perfect word detection</span>
                          </div>
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${highPrecision ? 'bg-violet-500' : 'bg-slate-700'}`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${highPrecision ? 'left-6' : 'left-1'}`}></div>
                          </div>
                        </button>
                      </div>
                    </div>

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
                          <span className="animate-pulse">{LOADING_MESSAGES[loadingMsgIdx]}</span>
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-wand-magic-sparkles"></i>
                          Generate {vibe === 'exact' ? 'Exact' : ''} Captions
                        </>
                      )}
                    </button>
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
          AI Verbatim Engine &bull; Built with Gemini 3 Pro
        </p>
      </footer>
    </div>
  );
};

export default App;
