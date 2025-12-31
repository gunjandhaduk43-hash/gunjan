
import React, { useRef } from 'react';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  isProcessing: boolean;
}

const VideoUploader: React.FC<VideoUploaderProps> = ({ onFileSelect, previewUrl, isProcessing }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const triggerUpload = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />
      
      {!previewUrl ? (
        <div 
          onClick={triggerUpload}
          className={`border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center cursor-pointer transition-all hover:border-indigo-500 hover:bg-slate-800/50 group ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="bg-indigo-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-cloud-arrow-up text-indigo-400 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload Video</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Drag and drop or click to upload your video. We'll generate the perfect Hinglish captions for you!
          </p>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video">
          <video 
            src={previewUrl} 
            controls 
            className="w-full h-full"
          />
          <button 
            onClick={triggerUpload}
            disabled={isProcessing}
            className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md hover:bg-indigo-600 p-2 rounded-full transition-colors disabled:opacity-50"
          >
            <i className="fa-solid fa-rotate text-white px-1"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
