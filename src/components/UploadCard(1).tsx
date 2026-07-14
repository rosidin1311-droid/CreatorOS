import React, { RefObject } from 'react';
import { FileVideo, X, Upload, Sparkles, Scissors } from 'lucide-react';

interface UploadCardProps {
  videoUrl: string;
  videoName: string;
  isDragging: boolean;
  activeClipId: number | null;
  videoRef: RefObject<HTMLVideoElement | null>;
  fileInputRef: RefObject<HTMLInputElement | null>;
  clearVideo: () => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: () => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loadDemoVideo: () => void;
}

export default function UploadCard({
  videoUrl,
  videoName,
  isDragging,
  activeClipId,
  videoRef,
  fileInputRef,
  clearVideo,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  loadDemoVideo,
}: UploadCardProps) {
  return (
    <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 shadow-2xl backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-slate-800 p-1.5 rounded-lg text-indigo-400">
            <FileVideo className="w-4 h-4" />
          </div>
          <h3 className="font-semibold text-sm text-slate-200">
            {videoUrl ? 'Pratinjau Video Konten' : 'Sumber Video'}
          </h3>
        </div>
        {videoUrl && (
          <button 
            onClick={clearVideo}
            className="text-xs flex items-center gap-1.5 text-rose-400 hover:text-rose-300 transition px-2.5 py-1 rounded-lg hover:bg-rose-500/10"
          >
            <X className="w-3.5 h-3.5" /> Ganti Video
          </button>
        )}
      </div>

      {/* Upload Dropzone if no video loaded */}
      {!videoUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
            isDragging 
              ? 'border-indigo-500 bg-indigo-500/5 scale-[0.99]' 
              : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/80'
          }`}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="video/*"
            className="hidden" 
          />
          
          <div className="bg-indigo-500/10 text-indigo-400 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8" />
          </div>
          
          <h4 className="text-base font-medium text-slate-200 mb-1">
            Tarik dan lepaskan file video Anda di sini
          </h4>
          <p className="text-xs text-slate-500 mb-4">
            Mendukung format MP4, MOV, WEBM (Max 500MB)
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button 
              type="button"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition"
            >
              Pilih File Manual
            </button>
            
            <span className="text-slate-600 text-xs">atau</span>
            
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                loadDemoVideo();
              }}
              className="px-4 py-2 bg-indigo-950 hover:bg-indigo-900 border border-indigo-900 text-indigo-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Pakai Video Demo
            </button>
          </div>
        </div>
      ) : (
        /* Video Player Card */
        <div className="space-y-4">
          <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video group">
            <video 
              ref={videoRef}
              src={videoUrl}
              controls
              className="w-full h-full object-contain"
            />
            
            {activeClipId !== null && (
              <div className="absolute top-3 left-3 bg-indigo-600/90 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-indigo-400/20 font-medium">
                <Scissors className="w-3 h-3 animate-spin" /> Memutar Clip {activeClipId}
              </div>
            )}
          </div>
          
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-850 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2 truncate pr-4">
              <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
              <span className="font-mono truncate">{videoName}</span>
            </div>
            <span className="text-slate-500 shrink-0 font-mono">Dukungan Lokal</span>
          </div>
        </div>
      )}
    </div>
  );
}
