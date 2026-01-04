
import React, { useRef, useState } from 'react';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  previewUrl: string | null;
  isProcessing: boolean;
  onError: (msg: string) => void;
}

const MAX_FILE_SIZE_MB = 500; // Updated limit as requested
const MAX_DURATION_SEC = 600; // 10 minutes

const VideoUploader: React.FC<VideoUploaderProps> = ({ onFileSelect, previewUrl, isProcessing, onError }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; rawSize: number } | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fileSizeMB = file.size / (1024 * 1024);
      
      // 1. Check file size
      if (fileSizeMB > MAX_FILE_SIZE_MB) {
        onError(`File is too large (${fileSizeMB.toFixed(1)}MB). Maximum allowed is ${MAX_FILE_SIZE_MB}MB.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      // 2. Check duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > MAX_DURATION_SEC) {
          onError("Video is longer than 10 minutes. Please trim your video.");
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }
        setFileInfo({ name: file.name, size: formatSize(file.size), rawSize: file.size });
        onFileSelect(file);
      };
      video.onerror = () => {
        onError("Invalid video file or format not supported.");
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const triggerUpload = () => {
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full space-y-4">
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
          className={`border-2 border-dashed border-slate-700 rounded-2xl p-10 text-center cursor-pointer transition-all hover:border-indigo-500 hover:bg-slate-800/50 group ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="bg-indigo-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <i className="fa-solid fa-cloud-arrow-up text-indigo-400 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload Video</h3>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Max 10 minutes & 500MB.<br/>
            <span className="text-[10px] opacity-60">Large files (>30MB) require a device with high RAM.</span>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black aspect-video border border-slate-800">
            <video 
              src={previewUrl} 
              controls 
              className="w-full h-full"
            />
            <button 
              onClick={triggerUpload}
              disabled={isProcessing}
              className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md hover:bg-red-500 p-2 rounded-full transition-colors disabled:opacity-50 shadow-lg"
              title="Change Video"
            >
              <i className="fa-solid fa-xmark text-white px-1"></i>
            </button>
          </div>
          {fileInfo && (
            <div className={`flex justify-between items-center px-4 py-2 rounded-lg border text-[10px] font-mono transition-colors ${
              fileInfo.rawSize > 30 * 1024 * 1024 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : 'bg-slate-900/50 border-slate-800 text-slate-400'
            }`}>
              <span className="truncate max-w-[200px]">{fileInfo.name}</span>
              <div className="flex items-center gap-2">
                {fileInfo.rawSize > 30 * 1024 * 1024 && <i className="fa-solid fa-triangle-exclamation animate-pulse"></i>}
                <span>{fileInfo.size}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
