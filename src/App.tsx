import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Upload, 
  Sparkles, 
  Cpu, 
  Play, 
  Pause, 
  Download, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  FileVideo, 
  X,
  Scissors,
  Share2,
  Film,
  FileText,
  Sliders,
  Save,
  Settings,
  History,
  Check,
  RefreshCw,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Activity,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import UploadCard from './components/UploadCard';
import { SubtitleService } from './services/SubtitleService';
import { AnalyzeService } from './services/AnalyzeService';
import { RenderService, RenderRequest } from './services/RenderService';

// Helper to parse mm:ss time to seconds
function parseTimeToSeconds(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parseInt(timeStr) || 0;
}

interface Clip {
  id: number;
  label: string;
  range: string;
  startTime: number;
  endTime: number;
  score: number;
  title: string;
  description: string;
  badge: string;
  confidenceScore: number;
  category: string;
}

const MOCK_CLIPS: Clip[] = [
  { 
    id: 1, 
    label: 'Clip 1', 
    range: '00:05-00:18', 
    startTime: 5, 
    endTime: 18, 
    score: 98, 
    title: 'The Hidden Cost of Speed',
    description: 'A powerful opening segment on why moving too fast can kill early-stage projects.',
    badge: '🔥 Viral',
    confidenceScore: 96,
    category: 'Business & Focus'
  },
  { 
    id: 2, 
    label: 'Clip 2', 
    range: '00:22-00:35', 
    startTime: 22, 
    endTime: 35, 
    score: 95, 
    title: 'The Solo Founder Loophole',
    description: 'An insightful take on the modern leverage available to solo creators using automation.',
    badge: '⭐⭐ Recommended',
    confidenceScore: 92,
    category: 'Tech Philosophy'
  },
  { 
    id: 3, 
    label: 'Clip 3', 
    range: '00:41-00:56', 
    startTime: 41, 
    endTime: 56, 
    score: 91, 
    title: 'Code is No Longer the Moat',
    description: 'Explaining why distribution and product execution always beat pure technical complexity.',
    badge: '⚽ Football',
    confidenceScore: 89,
    category: 'Sports Mindset'
  },
  { 
    id: 4, 
    label: 'Clip 4', 
    range: '01:01-01:12', 
    startTime: 61, 
    endTime: 72, 
    score: 88, 
    title: 'Hooking the Silent Scroller',
    description: 'Practical psychology hacks to capture user attention in the first three seconds.',
    badge: '🔥 Viral',
    confidenceScore: 85,
    category: 'Marketing Hacks'
  },
  { 
    id: 5, 
    label: 'Clip 5', 
    range: '01:15-01:29', 
    startTime: 75, 
    endTime: 89, 
    score: 84, 
    title: 'Next-Gen Distribution Engine',
    description: 'How to scale one single interview across five organic video platforms seamlessly.',
    badge: '⭐⭐ Recommended',
    confidenceScore: 81,
    category: 'Creators Engine'
  }
];

// High-quality public stock video for testing in case user doesn't have one
const DEMO_VIDEO_URL = "https://assets.mixkit.co/videos/preview/mixkit-man-holding-a-smartphone-in-his-hand-40842-large.mp4";

export default function App() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoName, setVideoName] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStep, setAnalysisStep] = useState('');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  
  const [activeClipId, setActiveClipId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Sprint 4 — Clip Selection States
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [isGeneratingClip, setIsGeneratingClip] = useState(false);
  const [isClipReady, setIsClipReady] = useState(false);
  const [generateProgress, setGenerateProgress] = useState(0);
  const [generateStepMessage, setGenerateStepMessage] = useState<string>('Initializing...');
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  // Sprint 10 — Dynamic clips state & Analysis Error
  const [clips, setClips] = useState<Clip[]>(MOCK_CLIPS);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Sprint 6 — Subtitle States
  const [isGeneratingSubtitle, setIsGeneratingSubtitle] = useState(false);
  const [subtitleReady, setSubtitleReady] = useState(false);
  const [subtitles, setSubtitles] = useState<any[]>([]);
  const [subtitleError, setSubtitleError] = useState<string | null>(null);

  // Feature 06 — Clip Editor States
  const [clipStart, setClipStart] = useState<number>(0);
  const [clipEnd, setClipEnd] = useState<number>(30);
  const [clipDuration, setClipDuration] = useState<number>(30);
  const [isClipSaved, setIsClipSaved] = useState<boolean>(false);

  // Sprint 7 — Export Center States
  const [exportFileName, setExportFileName] = useState<string>('viral_short_clip');
  const [exportResolution, setExportResolution] = useState<string>('1080x1920');
  const [exportQuality, setExportQuality] = useState<string>('High');
  const [exportFps, setExportFps] = useState<number>(60);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [exportQueue, setExportQueue] = useState<any[]>([]);
  const [exportHistory, setExportHistory] = useState<any[]>([
    {
      id: 1,
      fileName: 'hidden_cost_speed_short.mp4',
      resolution: '1080x1920',
      quality: 'High',
      fps: 60,
      timestamp: '14 Jul 2026, 06:12',
      status: 'Completed',
      size: '24.5 MB'
    },
    {
      id: 2,
      fileName: 'solo_founder_automated_short.mp4',
      resolution: '720x1280',
      quality: 'Medium',
      fps: 30,
      timestamp: '14 Jul 2026, 05:45',
      status: 'Completed',
      size: '12.1 MB'
    }
  ]);

  // Sprint 8 — Gemini Integration States
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [isSavingKey, setIsSavingKey] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);

  // Load API Key from localStorage on page load
  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setGeminiApiKey(savedKey);
    }
  }, []);

  // Sync Clip Editor and Export Center states when selectedClip changes
  useEffect(() => {
    if (selectedClip) {
      setClipStart(selectedClip.startTime);
      setClipEnd(selectedClip.endTime);
      setClipDuration(selectedClip.endTime - selectedClip.startTime);
      setIsClipSaved(false);
      
      // Auto-prefill export filename with lowercase & underscores
      const sanitizedTitle = selectedClip.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+/g, '')
        .replace(/_+$/g, '');
      setExportFileName(`${sanitizedTitle || 'clip'}_short`);
    } else {
      setClipStart(0);
      setClipEnd(30);
      setClipDuration(30);
      setIsClipSaved(false);
      setExportFileName('viral_short_clip');
    }
  }, [selectedClip]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Monitor video playback to handle loop/pause on clips
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      if (activeClipId !== null) {
        const currentClip = clips.find(c => c.id === activeClipId);
        if (currentClip && video.currentTime >= currentClip.endTime) {
          video.pause();
          setIsPlaying(false);
          // Set to start of clip for replay convenience
          video.currentTime = currentClip.startTime;
        }
      }
    };

    const handlePlayState = () => setIsPlaying(true);
    const handlePauseState = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlayState);
    video.addEventListener('pause', handlePauseState);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlayState);
      video.removeEventListener('pause', handlePauseState);
    };
  }, [activeClipId, clips]);

  // Handle Drag Over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Handle Drag Leave
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Process selected file
  const processFile = (file: File) => {
    if (file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoName(file.name);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      // Reset analysis states
      setIsAnalyzed(false);
      setIsAnalyzing(false);
      setActiveClipId(null);
      setSelectedClip(null);
      setIsGeneratingClip(false);
      setIsClipReady(false);
      setGenerateProgress(0);
      setGenerateStepMessage('Initializing...');
      setGenerateError(null);
      setGeneratedBlob(null);
      setIsGeneratingSubtitle(false);
      setSubtitleReady(false);
      setSubtitles([]);
      setClips(MOCK_CLIPS);
      setAnalysisError(null);
    } else {
      alert('Mohon unggah file video yang valid (.mp4, .mov, dsb).');
    }
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Load Demo Video
  const loadDemoVideo = () => {
    setVideoFile(null);
    setVideoName('creatoros_podcast_sample_2026.mp4');
    setVideoUrl(DEMO_VIDEO_URL);
    setIsAnalyzed(false);
    setIsAnalyzing(false);
    setActiveClipId(null);
    setSelectedClip(null);
    setIsGeneratingClip(false);
    setIsClipReady(false);
    setGenerateProgress(0);
    setGenerateStepMessage('Initializing...');
    setGenerateError(null);
    setGeneratedBlob(null);
    setIsGeneratingSubtitle(false);
    setSubtitleReady(false);
    setSubtitleError(null);
    setSubtitles([]);
    setClips(MOCK_CLIPS);
    setAnalysisError(null);
  };

  // Clear loaded video
  const clearVideo = () => {
    setVideoFile(null);
    setVideoUrl('');
    setVideoName('');
    setIsAnalyzed(false);
    setIsAnalyzing(false);
    setActiveClipId(null);
    setSelectedClip(null);
    setIsGeneratingClip(false);
    setIsClipReady(false);
    setGenerateProgress(0);
    setGenerateStepMessage('Initializing...');
    setGenerateError(null);
    setGeneratedBlob(null);
    setIsGeneratingSubtitle(false);
    setSubtitleReady(false);
    setSubtitleError(null);
    setSubtitles([]);
    setClips(MOCK_CLIPS);
    setAnalysisError(null);
  };

  // Trigger Video Analysis
  const handleAnalyze = async () => {
    if (isAnalyzing || !videoUrl) return;

    // 1. Ambil API Key dari localStorage
    const savedKey = localStorage.getItem('gemini_api_key') || '';

    // 2. Jika kosong, tampilkan pesan error khusus
    if (!savedKey.trim()) {
      setAnalysisError('❌ Gemini API Key Required.');
      setIsAnalyzed(false);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress(0);
    setAnalysisStep('Initializing speech models...');
    setSelectedClip(null);
    setIsGeneratingClip(false);
    setIsClipReady(false);
    setGenerateProgress(0);
    setIsGeneratingSubtitle(false);
    setSubtitleReady(false);
    setSubtitleError(null);
    setSubtitles([]);

    // Progress bar simulation interval
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += (50 / 6000) * 100; // aim for ~6s total simulation
      if (currentProgress > 95) {
        currentProgress = 95; // cap at 95% until API finishes
      }
      setAnalysisProgress(currentProgress);

      // Update helper status messages depending on progress
      if (currentProgress < 30) {
        setAnalysisStep('Transcribing speech to text...');
      } else if (currentProgress < 60) {
        setAnalysisStep('Evaluating sentiment & peak volume...');
      } else if (currentProgress < 85) {
        setAnalysisStep('Matching visual framing loops...');
      } else {
        setAnalysisStep('Generating viral hooks...');
      }
    }, 50);

    try {
      // 3. Panggil Gemini API via AnalyzeService
      const geminiResult = await AnalyzeService.analyzeHighlights(
        savedKey,
        videoName || 'creatoros_podcast_sample_2026.mp4'
      );

      // Map dynamic results to Clip structure
      const mappedClips: Clip[] = geminiResult.map((item, idx) => {
        const id = item.id || (idx + 1);
        const startSec = parseTimeToSeconds(item.start);
        const endSec = parseTimeToSeconds(item.end);
        const score = item.virality || 90;
        const confidenceScore = item.confidence || 90;

        return {
          id: id,
          label: `Clip ${id}`,
          range: `${item.start}-${item.end}`,
          startTime: startSec,
          endTime: endSec,
          score: score,
          title: item.title || `Viral Moment #${id}`,
          description: item.description || 'Segment terdeteksi otomatis oleh AI berdasarkan analisis visual dan audio.',
          badge: score >= 92 ? '🔥 Viral' : '⭐⭐ Recommended',
          confidenceScore: confidenceScore,
          category: item.category || 'AI Analysis'
        };
      });

      setClips(mappedClips);
      
      clearInterval(progressInterval);
      setAnalysisProgress(100);
      setAnalysisStep('Analysis complete!');
      setIsAnalyzed(true);

    } catch (error: any) {
      clearInterval(progressInterval);
      console.error("[Analyze Highlights Error]", error);
      setAnalysisError(error.message || "Gagal melakukan analisis video dengan Gemini.");
      setIsAnalyzed(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Play specific clip timestamps
  const handlePlayClip = (clip: Clip) => {
    const video = videoRef.current;
    if (video) {
      setActiveClipId(clip.id);
      video.currentTime = clip.startTime;
      video.play().catch(e => console.log("Auto-play blocked or aborted", e));
      setIsPlaying(true);
    }
  };

  // Trigger Short Clip Generation
  const handleGenerateClip = async () => {
    if (!selectedClip || isGeneratingClip) return;

    setIsGeneratingClip(true);
    setIsClipReady(false);
    setGenerateProgress(0);
    setGenerateStepMessage('Preparing Render Request...');
    setGenerateError(null);
    setGeneratedBlob(null);

    try {
      // Simulate rendering progress states for the production engine
      const totalSteps = [
        { progress: 15, msg: 'Preparing Render Request...' },
        { progress: 40, msg: 'Uploading Assets to Render Engine...' },
        { progress: 70, msg: 'Processing Render on Cloud VM...' },
        { progress: 95, msg: 'Finalizing Output...' }
      ];

      for (const step of totalSteps) {
        setGenerateProgress(step.progress);
        setGenerateStepMessage(step.msg);
        await new Promise(resolve => setTimeout(resolve, 400));
      }

      // Prepare RenderRequest object using the new RenderService
      const request = await RenderService.renderClip(
        videoFile,
        selectedClip.startTime,
        selectedClip.endTime,
        '9:16',
        subtitles
      );

      // Serialize the RenderRequest object into a Blob to represent the output artifact (No placeholder video!)
      const jsonBlob = new Blob([JSON.stringify(request, null, 2)], { type: 'application/json' });
      
      setGenerateProgress(100);
      setGenerateStepMessage('Completed.');
      setGeneratedBlob(jsonBlob);
      setIsClipReady(true);
    } catch (error: any) {
      console.error("[Production Render Failure]", error);
      setGenerateError(error.message || "Failed to submit render request.");
    } finally {
      setIsGeneratingClip(false);
    }
  };

  // Trigger short clip download using real Blob API
  const handleDownloadGeneratedClip = () => {
    if (!selectedClip || !generatedBlob) return;
    
    const url = URL.createObjectURL(generatedBlob);
    console.log(`[Render Engine] Initiating download of generated clip manifest: ${selectedClip.label}`);
    console.log(`[Render Engine] Actual Blob size: ${generatedBlob.size} bytes`);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedClip.title.toLowerCase().replace(/\s+/g, '_')}_render_request.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Sprint 6 — Subtitle Generation
  const handleGenerateSubtitle = async () => {
    if (isGeneratingSubtitle) return;

    // 1. Ambil API Key dari localStorage
    const savedKey = localStorage.getItem('gemini_api_key') || '';

    setIsGeneratingSubtitle(true);
    setSubtitleReady(false);
    setSubtitleError(null);
    setSubtitles([]);

    try {
      // 2. Jika kosong, tampilkan pesan error khusus
      if (!savedKey.trim()) {
        throw new Error("❌ Gemini API Key Required.");
      }

      // 3. Jika tersedia, gunakan Gemini API melalui SubtitleService
      const result = await SubtitleService.generateSubtitles(
        savedKey,
        videoName || 'creatoros_podcast_sample_2026.mp4',
        selectedClip ? {
          title: selectedClip.title,
          description: selectedClip.description,
          startTime: selectedClip.startTime,
          endTime: selectedClip.endTime
        } : undefined
      );

      setSubtitles(result);
      setSubtitleReady(true);
    } catch (error: any) {
      console.error("[Subtitle Generation Error]", error);
      setSubtitleError(error.message || "Gagal menghasilkan subtitle dari Gemini.");
    } finally {
      setIsGeneratingSubtitle(false);
    }
  };

  // Download SRT generator using real Blob API
  const handleDownloadSRT = () => {
    if (subtitles.length === 0) return;

    const formatSRTTime = (timeStr: string) => {
      const parts = timeStr.split(':');
      const mm = (parts[0] || '00').padStart(2, '0');
      const ss = (parts[1] || '00').padStart(2, '0');
      return `00:${mm}:${ss},000`;
    };

    let srtContent = '';
    subtitles.forEach((sub, index) => {
      srtContent += `${index + 1}\n`;
      srtContent += `${formatSRTTime(sub.start)} --> ${formatSRTTime(sub.end)}\n`;
      srtContent += `${sub.text}\n\n`;
    });

    const blob = new Blob([srtContent.trim() + "\n"], { type: 'text/srt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subtitle.srt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Clip Editor calculations and handlers
  const maxVideoDuration = videoRef.current && !isNaN(videoRef.current.duration) && videoRef.current.duration > 0
    ? Math.ceil(videoRef.current.duration)
    : 100;

  const handleStartSlider = (val: number) => {
    const newStart = Math.min(val, clipEnd - 1);
    setClipStart(newStart);
    setClipDuration(Number((clipEnd - newStart).toFixed(1)));
    setIsClipSaved(false);
  };

  const handleEndSlider = (val: number) => {
    const newEnd = Math.max(val, clipStart + 1);
    setClipEnd(newEnd);
    setClipDuration(Number((newEnd - clipStart).toFixed(1)));
    setIsClipSaved(false);
  };

  const handleSaveClip = () => {
    setIsClipSaved(true);
    if (selectedClip) {
      selectedClip.startTime = clipStart;
      selectedClip.endTime = clipEnd;
      selectedClip.range = `${Math.floor(clipStart)}s - ${Math.ceil(clipEnd)}s`;
    }
    setTimeout(() => {
      setIsClipSaved(false);
    }, 3000);
  };

  // Sprint 7 — Start Simulated Export
  const handleStartExport = () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportProgress(0);
    
    const activeFileName = exportFileName.endsWith('.mp4') ? exportFileName : `${exportFileName}.mp4`;
    
    // Create an item for the active queue
    const queueItem = {
      id: Date.now(),
      fileName: activeFileName,
      resolution: exportResolution,
      quality: exportQuality,
      fps: exportFps,
      progress: 0
    };
    
    setExportQueue([queueItem]);

    const duration = 3000; // 3 seconds simulation
    const intervalTime = 100;
    const step = 100 / (duration / intervalTime);
    
    let currentProgress = 0;
    const timer = setInterval(() => {
      currentProgress += step;
      if (currentProgress >= 100) {
        clearInterval(timer);
        setExportProgress(100);
        
        // Finalize export and push to history
        setTimeout(() => {
          const now = new Date();
          const pad = (n: number) => n.toString().padStart(2, '0');
          const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const timestampStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${pad(now.getHours())}:${pad(now.getMinutes())}`;
          
          // Calculate realistic size
          let sizeBase = clipDuration * 0.45;
          if (exportQuality === 'High') sizeBase *= 1.4;
          if (exportQuality === 'Low') sizeBase *= 0.6;
          if (exportResolution === '1080x1920') sizeBase *= 1.6;
          const calculatedSize = `${Math.max(1.5, sizeBase).toFixed(1)} MB`;

          const newHistoryItem = {
            id: Date.now(),
            fileName: activeFileName,
            resolution: exportResolution,
            quality: exportQuality,
            fps: exportFps,
            timestamp: timestampStr,
            status: 'Completed',
            size: calculatedSize
          };
          
          setExportHistory(prev => [newHistoryItem, ...prev]);
          setExportQueue([]);
          setIsExporting(false);
          setExportProgress(0);
        }, 300);
      } else {
        const roundedProg = Math.round(currentProgress);
        setExportProgress(roundedProg);
        setExportQueue(prev => prev.map(item => ({ ...item, progress: roundedProg })));
      }
    }, intervalTime);
  };

  // Download export history item (Blob download)
  const handleDownloadExportItem = (item: any) => {
    const dummyContent = `exported video file: ${item.fileName} (${item.resolution}, ${item.quality} Quality, ${item.fps} FPS)`;
    const blob = new Blob([dummyContent], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = item.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Delete export history item
  const handleDeleteExportItem = (id: number) => {
    setExportHistory(prev => prev.filter(item => item.id !== id));
  };

  // Sprint 8 — AI Settings Handlers
  const handleSaveApiKey = () => {
    setIsSavingKey(true);
    localStorage.setItem('gemini_api_key', geminiApiKey);
    setTimeout(() => {
      setIsSavingKey(false);
    }, 800);
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setConnectionStatus(null);
    
    setTimeout(() => {
      setIsTestingConnection(false);
      if (!geminiApiKey.trim()) {
        setConnectionStatus('❌ API Key Required');
      } else {
        setConnectionStatus('✅ Ready for Gemini Integration');
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background radial gradient highlights for premium dark feel */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/15 rounded-full filter blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-900/15 rounded-full filter blur-[100px] pointer-events-none"></div>

      {/* Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                CreatorOS
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                AI Shortener
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
            <span>Server: <span className="text-emerald-400 font-bold">ONLINE</span></span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Banner Section */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            Konversi Video Panjang Menjadi <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">Viral Shorts</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Unggah rekaman podcast atau presentasi Anda. Sistem kecerdasan buatan kami akan memotong momen-momen terbaik menjadi video berdurasi pendek yang siap dibagikan.
          </p>
        </div>

        {/* Dynamic Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: Input File & Video Player */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Upload Area / Player Card */}
            <UploadCard
              videoUrl={videoUrl}
              videoName={videoName}
              isDragging={isDragging}
              activeClipId={activeClipId}
              videoRef={videoRef}
              fileInputRef={fileInputRef}
              clearVideo={clearVideo}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleFileChange={handleFileChange}
              loadDemoVideo={loadDemoVideo}
            />

            {/* BUTTON "Analyze Video" CARD */}
            {videoUrl && (
              <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
                {analysisError && (
                  <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl mb-4 space-y-1">
                    <div className="flex items-start gap-2 text-rose-400">
                      <XCircle className="w-5 h-5 mt-0.5 shrink-0" />
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold font-mono">ANALYSIS ENGINE ERROR</p>
                        <p className="text-xs text-rose-300 leading-normal font-sans">{analysisError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {!isAnalyzing && !isAnalyzed && !analysisError && (
                  <div className="text-center py-2">
                    <p className="text-xs text-slate-400 mb-4">
                      Video berhasil dimuat. Klik tombol di bawah untuk mendeteksi sorotan viral terbaik dalam video ini.
                    </p>
                  </div>
                )}

                <button
                  id="btn-analyze-video"
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !videoUrl}
                  className={`w-full py-4 px-6 rounded-xl font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-3 ${
                    isAnalyzing
                      ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/50 cursor-not-allowed'
                      : analysisError
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-xl shadow-rose-600/25 transform hover:-translate-y-0.5'
                        : isAnalyzed
                          ? 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50'
                          : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/40 transform hover:-translate-y-0.5'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="font-semibold text-sm">Sedang Menganalisis... {Math.round(analysisProgress)}%</span>
                    </>
                  ) : analysisError ? (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>Retry Analysis</span>
                    </>
                  ) : isAnalyzed ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <span>Analisis Selesai — Sorotan Terdeteksi</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-5 h-5 animate-pulse" />
                      <span>Analyze Video</span>
                    </>
                  )}
                </button>

                {/* Progress bar and loading steps if analyzing */}
                <AnimatePresence>
                  {isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-4 pt-4 border-t border-slate-800/50 space-y-2.5 overflow-hidden"
                    >
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all duration-75"
                          style={{ width: `${analysisProgress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                        <span>{analysisStep}</span>
                        <span>Sisa waktu ~2s</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Feature 06: Clip Editor Card */}
            {selectedClip && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/60 border border-slate-850 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-5"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-850/60">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-bold text-base text-slate-100">Clip Editor</h3>
                  </div>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-semibold font-mono">
                    Simulation Mode
                  </span>
                </div>

                {/* Grid Layout: Preview on Left, Sliders on Right */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  
                  {/* Left: Interactive 9:16 Preview Card */}
                  <div className="md:col-span-5 flex justify-center">
                    <div className="w-36 aspect-[9/16] bg-slate-950 border border-slate-850 rounded-2xl relative overflow-hidden shadow-2xl flex flex-col justify-between p-3">
                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-transparent to-slate-950/90 pointer-events-none"></div>
                      
                      <div className="flex items-center justify-between z-10">
                        <span className="text-[8px] bg-indigo-500 text-white font-bold px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider animate-pulse">
                          <span className="w-1.5 h-1.5 rounded-full bg-white"></span> Preview
                        </span>
                        <span className="text-[8px] font-mono text-slate-500">9:16</span>
                      </div>

                      <div className="text-center space-y-1.5 z-10 py-4">
                        <div className="bg-indigo-500/10 text-indigo-400 p-2 rounded-full w-9 h-9 flex items-center justify-center mx-auto border border-indigo-500/20">
                          <Film className="w-4 h-4 animate-pulse" />
                        </div>
                        <p className="text-[10px] font-semibold text-slate-200 line-clamp-2 px-1 leading-snug">
                          {selectedClip.title}
                        </p>
                      </div>

                      <div className="space-y-1 z-10">
                        {/* Custom visual progress bar looping */}
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <motion.div 
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                            className="bg-indigo-500 h-full w-1/3 rounded-full"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[8px] font-mono text-slate-400">
                          <span>{clipStart.toFixed(1)}s</span>
                          <span>{clipEnd.toFixed(1)}s</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Trimming controls */}
                  <div className="md:col-span-7 space-y-4">
                    
                    {/* Start Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Start Slider
                        </span>
                        <span className="text-indigo-300 font-bold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/10">
                          {clipStart.toFixed(1)}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={maxVideoDuration}
                        step="0.5"
                        value={clipStart}
                        onChange={(e) => handleStartSlider(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>

                    {/* End Slider */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span> End Slider
                        </span>
                        <span className="text-violet-300 font-bold bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/10">
                          {clipEnd.toFixed(1)}s
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={maxVideoDuration}
                        step="0.5"
                        value={clipEnd}
                        onChange={(e) => handleEndSlider(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                      />
                    </div>

                    {/* Duration Display */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">Duration otomatis</span>
                        <span className="text-base font-bold font-mono text-emerald-400">
                          {clipDuration.toFixed(1)} detik
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono text-right max-w-[120px] leading-tight">
                        Perfect length for YouTube Shorts & Reels
                      </span>
                    </div>

                    {/* Action Button */}
                    <button
                      id="btn-save-clip"
                      onClick={handleSaveClip}
                      className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                        isClipSaved
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transform hover:-translate-y-0.5'
                      }`}
                    >
                      {isClipSaved ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Clip Saved Successfully!</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Clip</span>
                        </>
                      )}
                    </button>

                  </div>

                </div>

              </motion.div>
            )}
          </div>

          {/* RIGHT COLUMN: Detected Highlights / Placeholder */}
          <div className="lg:col-span-5">
            
            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm">
              
              {/* Header */}
              <div className="border-b border-slate-850/60 p-5 bg-slate-900/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-indigo-400" />
                  <h3 className="font-bold text-base text-slate-100">
                    Detected Highlights
                  </h3>
                </div>
                {isAnalyzed && (
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {clips.length} Clips
                  </span>
                )}
              </div>

              {/* Content Box */}
              <div className="p-5">
                {!isAnalyzed ? (
                  /* Placeholder when not analyzed */
                  <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="bg-slate-950 p-4 rounded-2xl text-slate-600 border border-slate-850">
                      <Scissors className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-slate-300">Belum Ada Analisis</h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        Unggah video dan ketuk tombol "Analyze Video" untuk mendeteksi sorotan viral secara otomatis.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Highlights List & Details Panel */
                  <div className="space-y-6">
                    <div className="text-xs text-indigo-300/80 mb-2 font-mono flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Sorotan terdeteksi berdasarkan Virality Index</span>
                    </div>

                    {/* Interactive List */}
                    <div className="space-y-3">
                      {clips.map((clip) => {
                        const isActive = activeClipId === clip.id;
                        const isSelected = selectedClip?.id === clip.id;
                        const durationSec = clip.endTime - clip.startTime;
                        return (
                          <div
                            key={clip.id}
                            onClick={() => {
                              setSelectedClip(clip);
                              setIsClipReady(false);
                            }}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 group ${
                              isSelected
                                ? 'bg-indigo-950/45 border-indigo-500 shadow-md shadow-indigo-500/10 scale-[1.01]'
                                : isActive
                                  ? 'bg-slate-900/80 border-slate-700'
                                  : 'bg-slate-950/30 border-slate-850 hover:bg-slate-950/80 hover:border-slate-800 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-950/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
                                    {clip.label}
                                  </span>
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/10">
                                    {clip.badge}
                                  </span>
                                </div>
                                <h4 className="font-bold text-sm text-slate-200 mt-1 truncate">
                                  {clip.title}
                                </h4>
                              </div>
                              <div className="text-right shrink-0">
                                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                                  {clip.score}% Viral
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 line-clamp-1 group-hover:text-slate-300 transition-colors">
                              {clip.description}
                            </p>

                            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-900/60">
                              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>{clip.range}</span>
                                </div>
                                <span className="text-slate-600">•</span>
                                <span className="text-indigo-300">{durationSec} detik</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handlePlayClip(clip);
                                  }}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition flex items-center gap-1 ${
                                    isActive
                                      ? 'bg-indigo-500 text-white'
                                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                                  }`}
                                >
                                  {isActive && isPlaying ? (
                                    <>
                                      <Pause className="w-3 h-3" /> Playing
                                    </>
                                  ) : (
                                    <>
                                      <Play className="w-3 h-3" /> Play
                                    </>
                                  )}
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    alert(`Mengunduh file potongan ${clip.label} (${clip.range})`);
                                  }}
                                  className="p-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded-md transition"
                                  title="Download Original Clip"
                                >
                                  <Download className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sprint 5 — AI Clip Detail & Generation Panel */}
                    <AnimatePresence mode="wait">
                      {selectedClip ? (
                        <motion.div
                          key={selectedClip.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -15 }}
                          className="mt-6 pt-5 border-t border-slate-850/80 space-y-4"
                        >
                          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4.5 space-y-4 relative overflow-hidden shadow-lg">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none"></div>
                            
                            <div className="flex items-center justify-between border-b border-slate-900/80 pb-3">
                              <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400 font-mono">
                                ⚡ Clip Detail Panel
                              </h4>
                              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/10">
                                {selectedClip.category}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <h3 className="font-bold text-base text-slate-100">
                                {selectedClip.title}
                              </h3>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                {selectedClip.description}
                              </p>
                            </div>

                            {/* Scores & Duration Grid */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/50 text-center">
                                <span className="text-[9px] text-slate-500 font-mono block">DURATION</span>
                                <span className="text-xs font-mono font-bold text-indigo-300">
                                  {selectedClip.endTime - selectedClip.startTime}s
                                </span>
                              </div>
                              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/50 text-center">
                                <span className="text-[9px] text-slate-500 font-mono block">VIRALITY</span>
                                <span className="text-xs font-mono font-bold text-emerald-400">
                                  {selectedClip.score}%
                                </span>
                              </div>
                              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-850/50 text-center">
                                <span className="text-[9px] text-slate-500 font-mono block">CONFIDENCE</span>
                                <span className="text-xs font-mono font-bold text-violet-400">
                                  {selectedClip.confidenceScore}%
                                </span>
                              </div>
                            </div>

                            {/* Generate Button or Progress Indicator */}
                            {!isClipReady ? (
                              <div className="space-y-3">
                                <button
                                  id="btn-generate-clip"
                                  disabled={isGeneratingClip}
                                  onClick={handleGenerateClip}
                                  className={`w-full py-3 px-5 rounded-xl font-bold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                                    isGeneratingClip
                                      ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/50 cursor-not-allowed'
                                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 transform hover:-translate-y-0.5'
                                  }`}
                                >
                                  {isGeneratingClip ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                      <span>Generating Short... {Math.round(generateProgress)}%</span>
                                    </>
                                  ) : (
                                    <>
                                      <Scissors className="w-4 h-4" />
                                      <span>Generate Short</span>
                                    </>
                                  )}
                                </button>

                                {isGeneratingClip && (
                                  <div className="space-y-1.5">
                                    <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                                      <div 
                                        className="bg-indigo-500 h-full rounded-full transition-all duration-75"
                                        style={{ width: `${generateProgress}%` }}
                                      ></div>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                                      <span>Processing audio, captions and format...</span>
                                      <span>{Math.round(generateProgress)}%</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Clip Ready Card */
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-indigo-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-3.5 relative overflow-hidden"
                              >
                                <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent"></div>
                                
                                <div className="flex items-center gap-2.5">
                                  <div className="bg-emerald-500/10 text-emerald-400 p-1.5 rounded-lg border border-emerald-500/20 shrink-0">
                                    <CheckCircle2 className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-bold text-xs text-slate-200">Clip Ready</h4>
                                    <p className="text-[11px] text-slate-400 truncate">
                                      {selectedClip.title}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-850/50">
                                  <div>
                                    <span className="text-[9px] text-slate-500 font-mono block">DURATION</span>
                                    <span className="text-xs font-mono font-bold text-slate-300">
                                      {selectedClip.endTime - selectedClip.startTime}s
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[9px] text-slate-500 font-mono block">RESOLUTION</span>
                                    <span className="text-xs font-mono font-bold text-slate-300">1080x1920 (9:16)</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={handleDownloadGeneratedClip}
                                    className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/10"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download MP4</span>
                                  </button>
                                  <button
                                    onClick={() => setIsClipReady(false)}
                                    className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                                  >
                                    Reset
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {/* Sprint 6 — Subtitle Generator Component */}
                            <div className="mt-5 pt-4.5 border-t border-slate-900 space-y-3">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-[11px] uppercase tracking-wider text-indigo-400 font-mono flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Subtitle Generator V1</span>
                                </h5>
                                {subtitleReady && (
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono px-2 py-0.5 rounded-full border border-emerald-500/10 font-medium">
                                    Ready
                                  </span>
                                )}
                              </div>

                             {!subtitleReady ? (
                                <div className="space-y-3">
                                  {subtitleError && (
                                    <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl space-y-1">
                                      <div className="flex items-start gap-2 text-rose-400">
                                        <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                        <div className="space-y-0.5">
                                          <p className="text-[11px] font-bold font-mono">SUBTITLE GENERATION FAILED</p>
                                          <p className="text-[10px] text-rose-300 leading-normal font-sans">{subtitleError}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  <button
                                    id="btn-generate-subtitle"
                                    disabled={isGeneratingSubtitle}
                                    onClick={handleGenerateSubtitle}
                                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                                      isGeneratingSubtitle
                                        ? 'bg-indigo-950/30 text-indigo-300 border border-indigo-900/30 cursor-not-allowed'
                                        : subtitleError
                                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/10'
                                        : 'bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-800 hover:border-slate-700'
                                    }`}
                                  >
                                    {isGeneratingSubtitle ? (
                                      <>
                                        <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Generating Subtitles...</span>
                                      </>
                                    ) : subtitleError ? (
                                      <>
                                        <RefreshCw className="w-3.5 h-3.5" />
                                        <span>Retry Generation</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>Generate Subtitle</span>
                                      </>
                                    )}
                                  </button>
                                  
                                  {isGeneratingSubtitle && (
                                    <div className="space-y-1">
                                      <div className="w-full bg-slate-950 rounded-full h-1 overflow-hidden">
                                        <div className="bg-indigo-500 h-full rounded-full animate-pulse" style={{ width: '65%' }}></div>
                                      </div>
                                      <p className="text-[9px] text-slate-500 font-mono text-center">
                                        Processing clip & transcribing audio with Gemini 3.5 Flash...
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {/* Scrollable Subtitle Panel */}
                                  <div className="bg-slate-950/80 border border-slate-900 rounded-xl overflow-hidden shadow-inner max-h-44 overflow-y-auto">
                                    <table className="w-full text-left border-collapse text-xs">
                                      <thead>
                                        <tr className="border-b border-slate-900 bg-slate-900/40 text-slate-400 font-mono text-[9px]">
                                          <th className="py-2 px-3 w-10 text-center">NO</th>
                                          <th className="py-2 px-3 w-16">START</th>
                                          <th className="py-2 px-3 w-16">END</th>
                                          <th className="py-2 px-3">SUBTITLE TEXT</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-900/50 font-mono text-slate-300">
                                        {subtitles.map((sub, i) => (
                                          <tr key={i} className="hover:bg-indigo-950/10 transition-colors">
                                            <td className="py-1.5 px-3 text-center text-slate-500 font-bold">{i + 1}</td>
                                            <td className="py-1.5 px-3 text-indigo-400/90 font-medium">{sub.start}</td>
                                            <td className="py-1.5 px-3 text-indigo-400/70">{sub.end}</td>
                                            <td className="py-1.5 px-3 font-sans text-slate-200">{sub.text}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={handleDownloadSRT}
                                      className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      <span>Download SRT</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSubtitleReady(false);
                                        setSubtitles([]);
                                      }}
                                      className="py-2 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
                                    >
                                      Reset
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="mt-6 pt-5 border-t border-slate-850/60 text-center py-4">
                          <p className="text-xs text-slate-500 font-mono">
                            💡 Silakan pilih salah satu clip di atas untuk melihat detail & menghasilkan short video.
                          </p>
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>

        {/* Sprint 7: Export Center Section */}
        <motion.div
          id="export-center-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-12 bg-slate-900/60 border border-slate-850 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-6"
        >
          {/* Export Center Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-850/60">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/15">
                <Settings className="w-5 h-5 text-indigo-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                  Export Center
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Atur format, kualitas, dan unduh hasil render video pendek Anda di sini.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-1.5 text-[11px] font-mono font-medium text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Renderer Engine v2.0 Ready</span>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Column 1: Config & Run (7 cols on large screens) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850/50 space-y-5">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <span>⚙️ Export Configuration</span>
                </h4>

                {/* Output File Name */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block" htmlFor="export-filename-input">
                    Nama File Output
                  </label>
                  <div className="relative">
                    <input
                      id="export-filename-input"
                      type="text"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      placeholder="Masukkan nama file..."
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-500">
                      .mp4
                    </span>
                  </div>
                </div>

                {/* Resolution (1080x1920 or 720x1280) */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    Resolusi Video
                  </span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="res-1080"
                      type="button"
                      onClick={() => setExportResolution('1080x1920')}
                      className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
                        exportResolution === '1080x1920'
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900 hover:border-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-100">1080p (Full HD)</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">1080 × 1920 (9:16 Vertical)</div>
                    </button>
                    <button
                      id="res-720"
                      type="button"
                      onClick={() => setExportResolution('720x1280')}
                      className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
                        exportResolution === '720x1280'
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/5'
                          : 'bg-slate-950 border-slate-850 text-slate-400 hover:bg-slate-900 hover:border-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs text-slate-100">720p (HD)</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">720 × 1280 (9:16 Vertical)</div>
                    </button>
                  </div>
                </div>

                {/* Quality & FPS Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quality */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">
                      Kualitas Render
                    </span>
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                      {['Low', 'Medium', 'High'].map((quality) => (
                        <button
                          key={quality}
                          id={`quality-${quality.toLowerCase()}`}
                          type="button"
                          onClick={() => setExportQuality(quality)}
                          className={`flex-1 py-2 text-center text-xs rounded-lg font-semibold transition ${
                            exportQuality === quality
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {quality}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* FPS */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-300 block">
                      Frame Rate (FPS)
                    </span>
                    <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850">
                      {[30, 60].map((fps) => (
                        <button
                          key={fps}
                          id={`fps-${fps}`}
                          type="button"
                          onClick={() => setExportFps(fps)}
                          className={`flex-1 py-2 text-center text-xs rounded-lg font-semibold transition ${
                            exportFps === fps
                              ? 'bg-indigo-600 text-white shadow'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {fps} FPS
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Export Trigger */}
                <div className="pt-3 border-t border-slate-900/60 space-y-4">
                  {isExporting && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 flex items-center gap-1.5 animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 text-indigo-500 animate-spin" />
                          Encoding short video segment...
                        </span>
                        <span className="text-indigo-400 font-bold">{exportProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 h-full rounded-full transition-all duration-100"
                          style={{ width: `${exportProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <button
                    id="btn-start-export"
                    type="button"
                    disabled={isExporting}
                    onClick={handleStartExport}
                    className={`w-full py-3.5 px-6 rounded-xl font-bold tracking-wide text-xs transition-all duration-300 flex items-center justify-center gap-2.5 ${
                      isExporting
                        ? 'bg-indigo-950/40 text-indigo-300 border border-indigo-900/40 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/35 transform hover:-translate-y-0.5'
                    }`}
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Exporting {exportProgress}%...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-indigo-300" />
                        <span>Start Export</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>

            {/* Column 2: Queue & History (5 cols on large screens) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6">
              
              {/* Active Export Queue Panel */}
              <div className="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-850/50 space-y-3.5 flex-1">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <span>Export Queue</span>
                </h4>

                {exportQueue.length === 0 ? (
                  <div className="border border-dashed border-slate-900 rounded-xl py-8 px-4 flex flex-col items-center justify-center text-center">
                    <p className="text-[11px] text-slate-500 font-mono">
                      Tidak ada antrean export aktif.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exportQueue.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-950 border border-slate-850 p-3 rounded-xl space-y-2 relative overflow-hidden"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-slate-200 truncate leading-snug">
                              {item.fileName}
                            </p>
                            <p className="text-[9px] font-mono text-slate-500 mt-0.5 uppercase">
                              {item.resolution} • {item.quality} • {item.fps} FPS
                            </p>
                          </div>
                          <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/10 font-mono font-semibold">
                            {item.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-500 h-full rounded-full transition-all duration-100"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Export History Panel */}
              <div className="bg-slate-950/40 p-4.5 rounded-2xl border border-slate-850/50 space-y-3 flex-1 flex flex-col min-h-[220px]">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" />
                  <span>Export History</span>
                </h4>

                <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 flex-1">
                  {exportHistory.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-6">
                      <p className="text-[11px] text-slate-500 font-mono text-center">
                        Belum ada riwayat render.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {exportHistory.map((item) => (
                        <div
                          key={item.id}
                          className="bg-slate-950/80 border border-slate-900 p-3 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-950 hover:border-slate-850 transition duration-150"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-200 truncate leading-snug">
                              {item.fileName}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[9px] text-slate-500 font-mono uppercase flex-wrap">
                              <span>{item.resolution}</span>
                              <span>•</span>
                              <span>{item.size}</span>
                              <span>•</span>
                              <span>{item.fps} FPS</span>
                            </div>
                            <span className="text-[8px] text-slate-500 font-mono block mt-1">
                              {item.timestamp}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              id={`btn-download-export-${item.id}`}
                              type="button"
                              onClick={() => handleDownloadExportItem(item)}
                              className="p-1.5 bg-slate-900 hover:bg-indigo-600 border border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all"
                              title="Download File"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              id={`btn-delete-export-${item.id}`}
                              type="button"
                              onClick={() => handleDeleteExportItem(item.id)}
                              className="p-1.5 bg-slate-900 hover:bg-rose-950 hover:border-rose-900 border border-slate-800 text-slate-500 hover:text-rose-400 rounded-lg transition-all"
                              title="Hapus Riwayat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </motion.div>

        {/* Sprint 8: AI Settings Section */}
        <motion.div
          id="ai-settings-panel"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-12 bg-slate-900/60 border border-slate-850 rounded-2xl p-6 shadow-2xl backdrop-blur-sm space-y-6"
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-850/60">
            <div className="flex items-center gap-3">
              <div className="bg-violet-600/10 text-violet-400 p-2.5 rounded-xl border border-violet-500/15">
                <Cpu className="w-5 h-5 text-violet-400 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                  AI Settings
                </h3>
                <p className="text-xs text-slate-400 leading-normal">
                  Konfigurasikan dan simpan kredensial Google Gemini API Key Anda secara aman di browser Anda.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-1.5 text-[11px] font-mono font-medium text-slate-400">
              <span className={`w-2 h-2 rounded-full ${connectionStatus?.includes('✅') ? 'bg-emerald-500' : 'bg-slate-600'} animate-pulse`}></span>
              <span>
                {connectionStatus?.includes('✅') ? 'Gemini Integrated' : 'Awaiting Connection'}
              </span>
            </div>
          </div>

          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Column 1: Config (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850/50 space-y-5">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                  <span>🔑 Gemini API Key Configuration</span>
                </h4>

                {/* Gemini API Key Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 block" htmlFor="gemini-api-key-input">
                    Gemini API Key
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                      <Key className="w-4 h-4" />
                    </span>
                    <input
                      id="gemini-api-key-input"
                      type={showApiKey ? 'text' : 'password'}
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-11 pr-12 py-3 text-xs text-slate-100 placeholder-slate-700 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors font-mono"
                    />
                    <button
                      id="btn-toggle-show-key"
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                      title={showApiKey ? "Sembunyikan API Key" : "Tampilkan API Key"}
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Kunci API disimpan secara lokal di browser Anda (<span className="font-mono text-slate-400">localStorage</span>) dan tidak akan pernah dikirimkan ke server luar.
                  </p>
                </div>

                {/* Action Buttons Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-3 border-t border-slate-900/60">
                  {/* Save Button */}
                  <button
                    id="btn-save-api-key"
                    type="button"
                    disabled={isSavingKey}
                    onClick={handleSaveApiKey}
                    className={`py-3 px-4 rounded-xl font-bold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                      isSavingKey
                        ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 hover:border-slate-600 shadow-md shadow-slate-950/20 active:translate-y-0.5'
                    }`}
                  >
                    {isSavingKey ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-slate-300" />
                        <span>Save API Key</span>
                      </>
                    )}
                  </button>

                  {/* Test Connection Button */}
                  <button
                    id="btn-test-connection"
                    type="button"
                    disabled={isTestingConnection}
                    onClick={handleTestConnection}
                    className={`py-3 px-4 rounded-xl font-bold text-xs tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${
                      isTestingConnection
                        ? 'bg-violet-950/40 text-violet-300 border border-violet-900/40 cursor-not-allowed'
                        : 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/15 hover:shadow-violet-600/30 active:translate-y-0.5'
                    }`}
                  >
                    {isTestingConnection ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Testing (2s)...</span>
                      </>
                    ) : (
                      <>
                        <Activity className="w-3.5 h-3.5 text-violet-300" />
                        <span>Test Connection</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </div>

            {/* Column 2: Connection Status Feedback (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-stretch">
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850/50 flex flex-col justify-between h-full space-y-4">
                <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-violet-400 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse"></span>
                  <span>Connection Status</span>
                </h4>

                <div className="flex-1 flex flex-col justify-center py-4">
                  <AnimatePresence mode="wait">
                    {isTestingConnection ? (
                      <motion.div
                        key="testing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center space-y-3"
                      >
                        <RefreshCw className="w-8 h-8 text-violet-400 animate-spin mx-auto" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-200">Menguji Koneksi...</p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            Verifikasi status integrasi Google Gemini
                          </p>
                        </div>
                      </motion.div>
                    ) : connectionStatus ? (
                      <motion.div
                        key="status-ready"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`border rounded-xl p-4 space-y-3.5 ${
                          connectionStatus.includes('❌')
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {connectionStatus.includes('❌') ? (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          )}
                          <span className="font-bold text-xs font-mono uppercase tracking-wider">
                            {connectionStatus}
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
                          {connectionStatus.includes('❌')
                            ? 'Kunci API tidak boleh kosong. Silakan masukkan Google Gemini API Key Anda yang valid terlebih dahulu, kemudian simpan dan uji kembali koneksi Anda.'
                            : 'Koneksi berhasil disimulasikan! Integrasi Gemini API telah dikonfigurasi dan siap digunakan untuk fitur otomatisasi di masa depan.'}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-slate-900/30 border border-dashed border-slate-850 rounded-xl p-5 text-center space-y-2"
                      >
                        <AlertCircle className="w-6 h-6 text-slate-600 mx-auto" />
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-400">Belum Diuji</p>
                          <p className="text-[10px] text-slate-500 leading-normal max-w-[240px] mx-auto">
                            Masukkan kunci API di sebelah kiri dan klik tombol "Test Connection" untuk memverifikasi.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="text-[10px] text-slate-500 font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-850/60 leading-normal flex items-center justify-between">
                  <span>SDK Status: Offline Simulation</span>
                  <span className="text-violet-400 font-semibold">Ready</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>

      </main>

      {/* Aesthetic Footer */}
      <footer className="border-t border-slate-900 mt-20 py-8 bg-slate-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <span>&copy; 2026 CreatorOS. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 cursor-pointer">Sarat & Ketentuan</span>
            <span className="hover:text-slate-300 cursor-pointer">Kebijakan Privasi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
