
import React from 'react';
import { CaptionEntry } from '../types';

interface CaptionListProps {
  captions: CaptionEntry[];
  isProcessing: boolean;
}

const CaptionList: React.FC<CaptionListProps> = ({ captions, isProcessing }) => {
  const copyAllToClipboard = () => {
    const text = captions.map(c => `[${c.timestamp}] ${c.text}`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Captions copied to clipboard!');
  };

  const downloadTxt = () => {
    const text = captions.map(c => `[${c.timestamp}] ${c.text}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hinglish_shorts_captions_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isProcessing) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex justify-between items-center h-10 bg-slate-800/50 rounded-lg w-full mb-6"></div>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex gap-4 p-3 border border-slate-800 rounded-lg">
            <div className="w-12 h-4 bg-slate-800 rounded"></div>
            <div className="w-32 h-4 bg-slate-800 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (captions.length === 0) return null;

  return (
    <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 backdrop-blur-sm sticky top-24 shadow-2xl">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <i className="fa-solid fa-list-check text-indigo-400"></i>
            Short-Form Segments
          </h2>
          <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">~5 words per segment</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={copyAllToClipboard}
            className="text-[10px] font-bold uppercase tracking-wider bg-slate-800 hover:bg-slate-700 px-3 py-2 rounded-lg transition-colors border border-slate-700"
          >
            Copy All
          </button>
          <button 
            onClick={downloadTxt}
            className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition-colors shadow-lg shadow-indigo-600/20"
          >
            Download TXT
          </button>
        </div>
      </div>

      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {captions.map((caption, idx) => (
          <div 
            key={idx} 
            className="group flex gap-3 p-3 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-indigo-500/30 hover:bg-slate-800/40 transition-all items-center"
          >
            <div className="shrink-0 flex flex-col items-center">
              <span className="text-indigo-400 font-mono text-[10px] font-bold">
                {caption.timestamp}
              </span>
              <div className="w-[1px] h-2 bg-slate-800 mt-1"></div>
            </div>
            <p className="text-slate-200 text-base leading-tight flex-1 font-medium italic">
              "{caption.text}"
            </p>
            <div className="text-[10px] text-slate-600 font-mono">
              {caption.text.split(' ').length}w
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
        <p className="text-[10px] text-indigo-300 font-semibold uppercase tracking-wider">
          Optimized for Reels & TikTok speed
        </p>
      </div>
    </div>
  );
};

export default CaptionList;
