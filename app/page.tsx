'use client';

import { useState, useRef } from 'react';

export default function Studio() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [youtubeModalOpen, setYoutubeModalOpen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeLoading, setYoutubeLoading] = useState(false);
  const [youtubeMessage, setYoutubeMessage] = useState(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisDone, setAnalysisDone] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  
  const handleAnalyzeVideo = async () => {
    setIsAnalyzing(true);
    setAnalysisDone(false);
    setAnalysisProgress(0);

    for (let i = 0; i <= 100; i += 10) {
    await new Promise((r) => setTimeout(r, 200));
    setAnalysisProgress(i);
  }

  setIsAnalyzing(false);
  setAnalysisDone(true);
};
  
  const [recentClips] = useState([
    {
      id: 1,
      title: 'Sample Clip 1',
      duration: '2:45',
      size: '145 MB',
      thumbnail: 'bg-gradient-to-br from-purple-500 to-pink-500',
      date: 'Today',
    },
    {
      id: 2,
      title: 'Sample Clip 2',
      duration: '1:30',
      size: '89 MB',
      thumbnail: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      date: 'Yesterday',
    },
    {
      id: 3,
      title: 'Sample Clip 3',
      duration: '3:12',
      size: '234 MB',
      thumbnail: 'bg-gradient-to-br from-green-500 to-emerald-500',
      date: '2 days ago',
    },
  ]);

  const fileInputRef = useRef(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getVideoDuration = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const timeout = setTimeout(() => {
        reject(new Error('Video loading timeout'));
      }, 10000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        const duration = Math.floor(video.duration);
        const mins = Math.floor(duration / 60);
        const secs = duration % 60;
        URL.revokeObjectURL(video.src);
        resolve(`${mins}:${secs.toString().padStart(2, '0')}`);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load video'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const getVideoResolution = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const timeout = setTimeout(() => {
        resolve('Unknown');
      }, 5000);

      video.onloadedmetadata = () => {
        clearTimeout(timeout);
        const width = video.videoWidth;
        const height = video.videoHeight;
        
        let resolution = 'SD';
        if (height >= 2160) resolution = '4K';
        else if (height >= 1440) resolution = '2K';
        else if (height >= 1080) resolution = '1080p';
        else if (height >= 720) resolution = '720p';
        else if (height >= 480) resolution = '480p';
        
        URL.revokeObjectURL(video.src);
        resolve(resolution);
      };

      video.onerror = () => {
        clearTimeout(timeout);
        resolve('Unknown');
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const getVideoFormat = (fileName) => {
    const ext = fileName.split('.').pop()?.toUpperCase() || 'Unknown';
    return ext;
  };

  const generateThumbnail = (file) => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      const timeout = setTimeout(() => {
        reject(new Error('Thumbnail generation timeout'));
      }, 10000);

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        clearTimeout(timeout);
        try {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0);
            const thumbnail = canvas.toDataURL();
            URL.revokeObjectURL(video.src);
            resolve(thumbnail);
          } else {
            throw new Error('Failed to get canvas context');
          }
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load video for thumbnail'));
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;

    const supportedFormats = ['mp4', 'mov', 'mkv', 'webm'];

    for (let file of files) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isValidMimeType = file.type.startsWith('video/');
      const isValidExtension = supportedFormats.includes(fileExtension);

      if (!isValidExtension && !isValidMimeType) {
        alert(`File "${file.name}" is not supported. Please use: MP4, MOV, MKV, or WebM`);
        continue;
      }

      try {
        const duration = await getVideoDuration(file);
        const thumbnail = await generateThumbnail(file);
        const resolution = await getVideoResolution(file);
        const format = getVideoFormat(file.name);
        const videoUrl = URL.createObjectURL(file);

        setUploadedFiles((prev) => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            name: file.name,
            size: formatFileSize(file.size),
            duration: duration,
            thumbnail: thumbnail,
            resolution: resolution,
            format: format,
            file: file,
            videoUrl: videoUrl,
            uploadedAt: new Date(),
          },
        ]);
      } catch (error) {
        console.error(`Error processing file "${file.name}":`, error);
        alert(`Error processing file "${file.name}"`);
      }
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if leaving the drop zone entirely
    if (e.target === e.currentTarget) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  const handleFileInput = (e) => {
    const files = e.target.files;
    const replaceId = sessionStorage.getItem('replaceVideoId');
    
    if (replaceId) {
      // Remove the old file
      removeFile(parseInt(replaceId));
      sessionStorage.removeItem('replaceVideoId');
    }
    
    handleFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (id) => {
    setUploadedFiles((prev) => {
      const fileToRemove = prev.find((file) => file.id === id);
      if (fileToRemove && fileToRemove.videoUrl) {
        URL.revokeObjectURL(fileToRemove.videoUrl);
      }
      return prev.filter((file) => file.id !== id);
    });
  };

  const replaceVideo = (id) => {
    // Store the ID to replace and trigger file input
    sessionStorage.setItem('replaceVideoId', id);
    fileInputRef.current?.click();
  };

  const validateYoutubeUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const isYoutube = 
        urlObj.hostname === 'youtube.com' ||
        urlObj.hostname === 'www.youtube.com' ||
        urlObj.hostname === 'youtu.be' ||
        urlObj.hostname === 'www.youtu.be';
      const hasVideoId = urlObj.searchParams.get('v') || urlObj.pathname.length > 1;
      return isYoutube && hasVideoId;
    } catch {
      return false;
    }
  };

  const handleAnalyzeYoutube = async () => {
    const trimmedUrl = youtubeUrl.trim();
    
    if (!trimmedUrl) {
      setYoutubeMessage({ type: 'error', text: 'Please enter a YouTube URL' });
      return;
    }

    if (!validateYoutubeUrl(trimmedUrl)) {
      setYoutubeMessage({ type: 'error', text: 'Please enter a valid YouTube URL' });
      return;
    }

    // Clear previous message
    setYoutubeMessage(null);
    setYoutubeLoading(true);

    try {
      // Simulate analysis (1-3 seconds)
      await new Promise((resolve) => {
        setTimeout(resolve, 2000);
      });

      // Show success message
      setYoutubeMessage({ 
        type: 'success', 
        text: 'Video successfully analyzed.' 
      });
      
      // Reset form after 2 seconds
      setTimeout(() => {
        setYoutubeUrl('');
        setYoutubeMessage(null);
      }, 2000);
    } catch (error) {
      setYoutubeMessage({ type: 'error', text: 'Failed to analyze video' });
    } finally {
      setYoutubeLoading(false);
    }
  };

  const closeYoutubeModal = () => {
    setYoutubeUrl('');
    setYoutubeMessage(null);
    setYoutubeLoading(false);
    setYoutubeModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-black/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center font-bold text-sm sm:text-lg">
              C
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg sm:text-xl font-bold">CreatorOS Studio</h1>
              <p className="text-xs text-slate-400">One Upload. Multiple Viral Clips.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-slate-900 hover:bg-slate-800 transition text-xs sm:text-sm border border-slate-700">
              Projects
            </button>
            <button className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition text-xs sm:text-sm font-medium">
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        <div className="space-y-8 sm:space-y-10">
          {/* Hero Section */}
          <div className="text-center space-y-6 sm:space-y-8">
            <div className="space-y-2 sm:space-y-3">
              <h2 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                One Upload. Multiple Viral Clips.
              </h2>
              <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
                Upload your video and let AI transform it into viral-ready clips optimized for TikTok, YouTube Shorts, and Instagram Reels.
              </p>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 sm:pt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg transition font-semibold text-sm sm:text-base shadow-lg hover:shadow-cyan-500/50"
              >
                📤 Upload Video
              </button>
              <button 
                onClick={() => setYoutubeModalOpen(true)}
                className="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-slate-800 hover:bg-slate-700 rounded-lg transition font-semibold text-sm sm:text-base border border-slate-700 hover:border-slate-600"
              >
                🔗 Paste YouTube URL
              </button>
            </div>
          </div>

          {/* Upload Area */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`relative rounded-2xl border-2 border-dashed transition-all p-8 sm:p-12 ${
              isDragging
                ? 'border-cyan-400 bg-cyan-400/10'
                : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
            }`}
          >
            <div className="flex flex-col items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center border border-cyan-500/50">
                <span className="text-2xl sm:text-3xl">⬆️</span>
              </div>
              <div className="text-center">
                <h3 className="text-base sm:text-lg font-bold mb-1">Drag & drop your video here</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  or click the Upload button above
                </p>
              </div>

              {/* Supported Formats & File Size Info */}
              <div className="w-full grid grid-cols-2 gap-3 sm:gap-4 text-center pt-2">
                <div className="bg-slate-800/50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Supported Formats</p>
                  <p className="text-xs sm:text-sm font-semibold text-cyan-400">MP4 • MOV • MKV</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg px-3 py-2 sm:px-4 sm:py-3 border border-slate-700">
                  <p className="text-xs text-slate-400 mb-1">Max File Size</p>
                  <p className="text-xs sm:text-sm font-semibold text-cyan-400">2 GB</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,.mp4,video/quicktime,.mov,video/x-matroska,.mkv,video/webm,.webm"
                onChange={handleFileInput}
                multiple
                className="hidden"
              />
            </div>
          </div>

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Your Upload</h3>
                <p className="text-sm sm:text-base text-slate-400">
                  {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} ready to process
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {uploadedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="group bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all duration-300"
                  >
                    {/* Thumbnail */}
                    <div className="relative overflow-hidden h-32 sm:h-40 bg-slate-800">
                      {file.thumbnail && (
                        <img
                          src={file.thumbnail}
                          alt={file.name}
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
                        <button
                          onClick={() => window.open(URL.createObjectURL(file.file))}
                          className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-500/80 hover:bg-cyan-500 rounded-full flex items-center justify-center transition transform group-hover:scale-110"
                        >
                          ▶️
                        </button>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
                        {file.duration}
                      </div>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-600/80 hover:bg-red-600 rounded-full flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                        title="Remove"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="p-4 space-y-3">

                      <h4 className="font-bold text-white break-all">
                       {file.name}
                      </h4>

                    <div className="flex justify-between text-sm text-slate-400">
                        <span>{file.duration}</span>
                        <span>{file.size}</span>
                      </div>
                      <button
                        onClick={handleAnalyzeVideo}
                        disabled={isAnalyzing}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white py-2 rounded-lg font-semibold transition"
                      >
                        {isAnalyzing
                          ? `Analyzing... ${analysisProgress}%`
                          : analysisDone
                          ? "✅ Analysis Complete"
                          : "🎬 Analyze Video"}
                      </button>

                      {analysisDone && (
                        <div className="rounded-lg bg-slate-800 p-3 border border-cyan-500/30">

                          <h4 className="font-bold text-cyan-400 mb-3">
                            Detected Highlights
                          </h4>

                          <div className="space-y-2">

                            <div className="bg-slate-900 rounded p-2 flex justify-between">
                              <span>00:05 - 00:18</span>
                              <span className="text-green-400">98%</span>
                            </div>

                            <div className="bg-slate-900 rounded p-2 flex justify-between">
                              <span>00:22 - 00:35</span>
                              <span className="text-green-400">95%</span>
                            </div>

                            <div className="bg-slate-900 rounded p-2 flex justify-between">
                              <span>00:41 - 00:56</span>
                              <span className="text-yellow-400">91%</span>
                            </div>

                            <div className="bg-slate-900 rounded p-2 flex justify-between">
                              <span>01:01 - 01:12</span>
                              <span className="text-yellow-400">88%</span>
                            </div>

                            <div className="bg-slate-900 rounded p-2 flex justify-between">
                              <span>01:15 - 01:29</span>
                              <span className="text-orange-400">84%</span>
                            </div>

                          </div>

                        </div>
                      )}

                    </div>
                    {/* File Info */}
                    <div className="p-3 sm:p-4 space-y-2">
                      <h4 className="font-semibold text-sm sm:text-base group-hover:text-cyan-400 transition truncate">
                        {file.name}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                        <div>
                          <p className="text-slate-500">Duration</p>
                          <p className="text-white font-semibold">{file.duration}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Size</p>
                          <p className="text-white font-semibold">{file.size}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Clips */}
          {uploadedFiles.length === 0 && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold mb-2">Recent Clips</h3>
                <p className="text-sm sm:text-base text-slate-400">
                  {recentClips.length} sample video{recentClips.length !== 1 ? 's' : ''} available
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {recentClips.map((video) => (
                  <div
                    key={video.id}
                    className="group cursor-pointer bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all duration-300"
                  >
                    <div className="relative overflow-hidden h-32 sm:h-40">
                      <div className={`w-full h-full ${video.thumbnail} opacity-80 group-hover:opacity-100 transition-opacity`} />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition">
                        <button className="w-12 h-12 sm:w-14 sm:h-14 bg-cyan-500/80 hover:bg-cyan-500 rounded-full flex items-center justify-center transition transform group-hover:scale-110">
                          ▶️
                        </button>
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs font-semibold">
                        {video.duration}
                      </div>
                    </div>
                    <div className="p-3 sm:p-4">
                      <h4 className="font-semibold text-sm sm:text-base group-hover:text-cyan-400 transition truncate">
                        {video.title}
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mt-2">
                        <div>
                          <p className="text-slate-500">{video.date}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-500">{video.size}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features Highlight */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 bg-gradient-to-r from-slate-900/50 to-slate-800/50 border border-slate-800 rounded-xl p-4 sm:p-8">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl mb-2">✂️</p>
              <p className="text-xs sm:text-sm font-semibold">Auto Cut</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl mb-2">🎵</p>
              <p className="text-xs sm:text-sm font-semibold">Smart Audio</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl mb-2">📱</p>
              <p className="text-xs sm:text-sm font-semibold">Multi Format</p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl mb-2">⚡</p>
              <p className="text-xs sm:text-sm font-semibold">Fast Export</p>
            </div>
          </div>
        </div>
      </main>

      {/* YouTube URL Modal */}
      {youtubeModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeYoutubeModal}
          />
          <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-6 sm:p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Paste YouTube URL</h3>
              <button
                onClick={closeYoutubeModal}
                className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {!youtubeMessage && (
                <>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-300">
                      YouTube URL
                    </label>
                    <input
                      type="text"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      disabled={youtubeLoading}
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      onKeyPress={(e) => e.key === 'Enter' && !youtubeLoading && handleAnalyzeYoutube()}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleAnalyzeYoutube}
                      disabled={youtubeLoading}
                      className="flex-1 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition font-semibold text-sm flex items-center justify-center gap-2"
                    >
                      {youtubeLoading ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          Analyzing...
                        </>
                      ) : (
                        'Analyze'
                      )}
                    </button>
                    <button
                      onClick={closeYoutubeModal}
                      disabled={youtubeLoading}
                      className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition font-semibold text-sm border border-slate-700"
                    >
                      Close
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 mt-4">
                    Paste a YouTube link and we'll extract and process the video for you.
                  </p>
                </>
              )}

              {youtubeMessage && (
                <div className={`p-4 rounded-lg border ${youtubeMessage.type === 'error' ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-green-900/20 border-green-700 text-green-400'}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-lg">
                      {youtubeMessage.type === 'error' ? '✕' : '✓'}
                    </span>
                    <p className="text-sm font-medium">{youtubeMessage.text}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-black/50 mt-12 sm:mt-16 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs sm:text-sm text-slate-500">
          <p>© 2024 CreatorOS Studio. All rights reserved. | Privacy • Terms • Contact</p>
        </div>
      </footer>
    </div>
  );
}
