
import React, { useState, useEffect } from 'react';
import VideoUploader from './components/VideoUploader';
import CaptionList from './components/CaptionList';
import { VideoState } from './types';
import { fileToBase64, generateVideoCaptions } from './services/geminiService';

const LOADING_MESSAGES = [
  "Uploading to cloud... 🚀",
  "Analyzing video content... 🎥",
  "Decoding the audio tracks... 🎧",
  "Thinking in Hinglish... 🤔",
  "Adding some Desi Tadka... 🔥",
  "Translating to WhatsApp slang... 💬",
  "Almost ready, bhai... ⌛"
];

const App: React.FC = () => {
  const [state, setState] = useState<VideoState>({
    file: null,
    previewUrl: null,
    isProcessing: false,
    captions: [],
    error: null
  });

  const [vibe, setVibe] = useState<'casual' | 'hype' | 'funny'>('casual');
  const [highPrecision, setHighPrecision] = useState(false);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  useEffect(() => {
    let interval: any;
    if (state.isProcessing) {
      interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [state.isProcessing]);

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setState(prev => ({
      ...prev,
      file,
      previewUrl: url,
      captions: [],
      error: null
    }));
  };

  const processVideo = async () => {
    if (!state.file) return;

    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    setLoadingMsgIdx(0);

    try {
      const base64 = await fileToBase64(state.file);
      const results = await generateVideoCaptions(base64, state.file.type, vibe, highPrecision);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        captions: results
      }));
    } catch (err: any) {
      console.error(err);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: err.message || "Something went wrong. Try a shorter video or switch to Fast Mode."
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }
    };
  }, [state.previewUrl]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-900">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="fa-solid fa-clapperboard text-white"></i>
            </div>
            <div>
              <h1 className="font-bold text-xl tracking-tight">Hinglish CapGen</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Precision Tool</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
            <span className="hidden sm:inline">Engine: {highPrecision ? 'Gemini 3 Pro' : 'Gemini 3 Flash'}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${highPrecision ? 'bg-violet-500' : 'bg-emerald-500'} animate-pulse`}></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 md:py-16">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-10">
            <div className="space-y-6">
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">
                Precision Enabled
              </span>
              <h2 className="text-5xl font-extrabold leading-[1.15] tracking-tight">
                High Accuracy <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-emerald-400">Video Intelligence.</span>
              </h2>
              <p className="text-slate-400 text-lg max-w-md">
                Get perfectly synced timestamps and ultra-natural Hinglish captions that actually match the video's context.
              </p>
            </div>

            <div className="bg-slate-900/40 p-1 rounded-[24px] border border-slate-800/50">
              <div className="bg-slate-900 rounded-[22px] p-6 md:p-8 space-y-6 shadow-2xl">
                <VideoUploader 
                  onFileSelect={handleFileSelect} 
                  previewUrl={state.previewUrl} 
                  isProcessing={state.isProcessing}
                />

                {state.file && (
                  <div className="space-y-5 pt-4 border-t border-slate-800">
                    {/* Controls Row */}
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Tone</label>
                        <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
                          {(['casual', 'hype', 'funny'] as const).map(v => (
                            <button
                              key={v}
                              onClick={() => setVibe(v)}
                              disabled={state.isProcessing}
                              className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                                vibe === v 
                                  ? 'bg-indigo-600 text-white shadow-lg' 
                                  : 'text-slate-400 hover:text-white'
                              }`}
                            >
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-800">
                        <div>
                          <p className="text-xs font-bold text-white uppercase tracking-wider">Deep Analysis</p>
                          <p className="text-[10px] text-slate-500">Slower but much more accurate</p>
                        </div>
                        <button
                          onClick={() => setHighPrecision(!highPrecision)}
                          disabled={state.isProcessing}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            highPrecision ? 'bg-indigo-600' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`${
                              highPrecision ? 'translate-x-6' : 'translate-x-1'
                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                          />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={processVideo}
                      disabled={state.isProcessing}
                      className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all ${
                        state.isProcessing 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 active:scale-95'
                      }`}
                    >
                      {state.isProcessing ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin"></i>
                          {LOADING_MESSAGES[loadingMsgIdx]}
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-magnifying-glass-chart"></i>
                          Generate Accurate Captions
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {state.error && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex gap-3 text-red-400 text-sm">
                <i className="fa-solid fa-triangle-exclamation mt-0.5"></i>
                <p>{state.error}</p>
              </div>
            )}
          </div>

          <div className="lg:pt-10">
            {state.isProcessing || state.captions.length > 0 ? (
              <CaptionList captions={state.captions} isProcessing={state.isProcessing} />
            ) : (
              <div className="h-full min-h-[500px] border border-slate-800 rounded-[24px] border-dashed flex flex-col items-center justify-center text-center p-12 bg-slate-900/10 transition-colors hover:bg-slate-900/20">
                <div className="bg-indigo-500/5 w-24 h-24 rounded-full flex items-center justify-center mb-8 border border-indigo-500/10">
                  <i className="fa-solid fa-brain text-slate-600 text-4xl"></i>
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-300 tracking-tight">Accuracy Engine Ready</h3>
                <p className="text-slate-500 max-w-[300px] leading-relaxed">
                  Turn on "Deep Analysis" for the best results on complex videos.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-900 bg-slate-950/50">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
             <i className="fa-solid fa-shield-halved text-indigo-500"></i>
             <span className="text-xs font-bold tracking-widest uppercase text-slate-400">Verified Precision Engine</span>
          </div>
          <p className="text-slate-500 text-xs font-medium">
            © 2024 Hinglish CapGen Tool.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
