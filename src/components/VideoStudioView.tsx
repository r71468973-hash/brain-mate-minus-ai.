import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Sparkles,
  Play,
  Pause,
  Upload,
  Download,
  Share2,
  Sliders,
  Youtube,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Plus,
  Scissors,
  Layers,
  Subtitles,
  ExternalLink,
  Lock,
  Eye,
  Radio,
  Tv,
  Smartphone,
  ChevronRight,
  Mic,
} from 'lucide-react';
import { VideoProject, VideoScene, VideoAspectRatio, YouTubeChannelProfile, YouTubeUploadConfig } from '../types';
import { videoService } from '../services/videoService';
import { youtubeService } from '../services/youtubeService';

interface VideoStudioViewProps {
  language: string;
  onOpenVoice: (prompt?: string) => void;
  initialPrompt?: string;
  onShowToast: (msg: string) => void;
}

export const VideoStudioView: React.FC<VideoStudioViewProps> = ({
  language,
  onOpenVoice,
  initialPrompt,
  onShowToast,
}) => {
  const [topicInput, setTopicInput] = useState(initialPrompt || 'Artificial Intelligence & Future Tech');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isRenderingVideo, setIsRenderingVideo] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStepMsg, setRenderStepMsg] = useState('');
  
  // Active Project
  const [project, setProject] = useState<VideoProject | null>(null);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Video Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Active Scene Editing Tab
  const [activeTab, setActiveTab] = useState<'preview' | 'scenes' | 'youtube' | 'editor'>('preview');

  // YouTube OAuth state
  const [isYtConnected, setIsYtConnected] = useState(false);
  const [ytChannel, setYtChannel] = useState<YouTubeChannelProfile | null>(null);
  const [isConnectingYt, setIsConnectingYt] = useState(false);
  const [isUploadingYt, setIsUploadingYt] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusMsg, setUploadStatusMsg] = useState('');
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);

  // YouTube Upload Config
  const [ytConfig, setYtConfig] = useState<YouTubeUploadConfig>({
    title: '',
    description: '',
    tags: ['BrainMateAI', 'Technology', 'AI'],
    privacy: 'private', // Defaults to private for safety
    madeForKids: false,
  });

  // Check initial YouTube session
  useEffect(() => {
    if (youtubeService.isAuthenticated()) {
      setIsYtConnected(true);
      const cached = youtubeService.getCachedProfile();
      if (cached) {
        setYtChannel(cached);
      } else {
        youtubeService.fetchChannelProfile().then((p) => {
          if (p) setYtChannel(p);
        });
      }
    }
  }, []);

  // Handle Initial Prompt if passed from Voice
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      setTopicInput(initialPrompt);
      handleGenerateScript(initialPrompt);
    }
  }, [initialPrompt]);

  // Sync config when project updates
  useEffect(() => {
    if (project) {
      setYtConfig((prev) => ({
        ...prev,
        title: project.title,
        description: project.description,
        tags: project.tags,
      }));
    }
  }, [project]);

  const handleGenerateScript = async (customPrompt?: string) => {
    const promptToUse = (customPrompt || topicInput).trim();
    if (!promptToUse) return;

    setIsGeneratingScript(true);
    try {
      const generated = await videoService.generateScript(promptToUse, language, aspectRatio);
      const fullProject: VideoProject = {
        id: `vid-${Date.now()}`,
        title: generated.title || promptToUse,
        description: generated.description || `Overview of ${promptToUse}`,
        tags: generated.tags || ['BrainMateAI', 'AI', 'Technology'],
        aspectRatio,
        status: 'draft',
        progress: 0,
        scenes: generated.scenes || [],
        bgmStyle: generated.bgmStyle || 'tech_ambient',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setProject(fullProject);
      setGeneratedBlob(null);
      setVideoUrl(null);
      onShowToast('AI script & scenes generated! Ready to render.');
      // Auto-render video
      handleRenderVideo(fullProject);
    } catch (err: any) {
      onShowToast(`Script error: ${err.message || 'Failed'}`);
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleRenderVideo = async (targetProject?: VideoProject) => {
    const proj = targetProject || project;
    if (!proj) return;

    setIsRenderingVideo(true);
    setRenderProgress(5);
    setRenderStepMsg('Initializing scene renderer...');

    try {
      const blob = await videoService.renderVideo(proj, (p, msg) => {
        setRenderProgress(p);
        setRenderStepMsg(msg);
      });

      setGeneratedBlob(blob);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setProject({
        ...proj,
        status: 'ready',
        progress: 100,
        videoBlobUrl: url,
      });
      onShowToast('Video rendered successfully! Preview ready.');
    } catch (err: any) {
      console.error('Render error:', err);
      onShowToast(`Video render failed: ${err.message || 'Check browser permissions'}`);
    } finally {
      setIsRenderingVideo(false);
    }
  };

  const handleConnectYouTube = async () => {
    setIsConnectingYt(true);
    const result = await youtubeService.connectAccount();
    setIsConnectingYt(false);

    if (result.success) {
      setIsYtConnected(true);
      if (result.channel) {
        setYtChannel(result.channel);
      }
      onShowToast(`Connected to YouTube: ${result.channel?.title || 'Account Linked'}`);
    } else {
      onShowToast(`YouTube auth failed: ${result.error || 'User cancelled'}`);
    }
  };

  const handleDisconnectYouTube = () => {
    youtubeService.disconnect();
    setIsYtConnected(false);
    setYtChannel(null);
    onShowToast('Disconnected YouTube account.');
  };

  const handleUploadToYouTube = async () => {
    if (!generatedBlob) {
      onShowToast('Please render the video first before uploading.');
      return;
    }

    if (!isYtConnected) {
      onShowToast('Please connect your YouTube channel first.');
      await handleConnectYouTube();
      return;
    }

    setIsUploadingYt(true);
    setUploadProgress(5);
    setUploadStatusMsg('Preparing metadata and upload stream...');

    const res = await youtubeService.uploadVideo(generatedBlob, ytConfig, (pct, status) => {
      setUploadProgress(pct);
      setUploadStatusMsg(status);
    });

    setIsUploadingYt(false);

    if (res.success && res.videoUrl) {
      setUploadedVideoUrl(res.videoUrl);
      if (project) {
        setProject({
          ...project,
          status: 'published',
          youtubeUrl: res.videoUrl,
          youtubeVideoId: res.videoId,
        });
      }
      onShowToast('Video uploaded to YouTube! Link available.');
    } else {
      onShowToast(`Upload failed: ${res.error || 'Server rejected upload'}`);
    }
  };

  const handleDownloadVideo = () => {
    if (!generatedBlob || !project) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(generatedBlob);
    a.download = `${project.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.webm`;
    a.click();
    onShowToast('Video downloaded to your device!');
  };

  const handleShareVideo = async () => {
    if (uploadedVideoUrl) {
      if (navigator.share) {
        navigator.share({
          title: project?.title || 'Brain Mate AI Video',
          url: uploadedVideoUrl,
        });
      } else {
        navigator.clipboard.writeText(uploadedVideoUrl);
        onShowToast('YouTube link copied to clipboard!');
      }
    } else if (generatedBlob) {
      handleDownloadVideo();
    }
  };

  const updateScene = (idx: number, updated: Partial<VideoScene>) => {
    if (!project) return;
    const newScenes = [...project.scenes];
    newScenes[idx] = { ...newScenes[idx], ...updated };
    setProject({ ...project, scenes: newScenes });
  };

  const quickTopics = [
    'Artificial Intelligence Breakthroughs 2026',
    'Reliance & Indian Stock Market Outlook',
    'Top 5 Productivity Hacks for Boss',
    'Future of Android Robotics & Voice AI',
  ];

  return (
    <div className="space-y-5 pb-24 pt-2 max-w-4xl mx-auto px-4">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/90 via-[#0c1424] to-purple-950/60 border border-indigo-500/30 p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Voice-Controlled AI Video Studio</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>AI Video Creation & YouTube Publishing</span>
            </h2>
            <p className="text-xs text-slate-300">
              Generate scripts, automated scenes, captions, voiceover, and upload directly to YouTube via Google OAuth.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onOpenVoice('Create a video about ')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-all"
            >
              <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Voice Prompt</span>
            </button>
          </div>
        </div>

        {/* Prompt Input Box */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateScript()}
                placeholder="What topic should Brain Mate make a video about?"
                className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Aspect Ratio Selector */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
              <button
                onClick={() => setAspectRatio('16:9')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  aspectRatio === '16:9'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="16:9 Landscape YouTube Video"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>16:9 HD</span>
              </button>

              <button
                onClick={() => setAspectRatio('9:16')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  aspectRatio === '9:16'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="9:16 Vertical YouTube Shorts / Reels"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>9:16 Shorts</span>
              </button>
            </div>

            <button
              onClick={() => handleGenerateScript()}
              disabled={isGeneratingScript || isRenderingVideo}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 shrink-0"
            >
              {isGeneratingScript ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Planning Script...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  <span>Generate Video</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-slate-400 font-medium">Suggestions:</span>
            {quickTopics.map((top, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setTopicInput(top);
                  handleGenerateScript(top);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white transition-colors"
              >
                {top}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Studio Workspace: 4 Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2 overflow-x-auto">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'preview'
                ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Video Player & Preview</span>
          </button>

          <button
            onClick={() => setActiveTab('scenes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'scenes'
                ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Scenes & Captions ({project?.scenes?.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'youtube'
                ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 text-rose-400" />
            <span>YouTube Publishing</span>
            {isYtConnected && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
          </button>
        </div>

        {/* Re-render button */}
        {project && (
          <button
            onClick={() => handleRenderVideo()}
            disabled={isRenderingVideo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-indigo-500 text-xs font-medium text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRenderingVideo ? 'animate-spin' : ''}`} />
            <span>Re-Render</span>
          </button>
        )}
      </div>

      {/* Rendering Progress Banner */}
      {isRenderingVideo && (
        <div className="p-4 rounded-xl bg-indigo-950/60 border border-indigo-500/30 space-y-2.5 animate-pulse">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-indigo-200 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>{renderStepMsg || 'Rendering video frames...'}</span>
            </span>
            <span className="font-mono text-cyan-400">{renderProgress}%</span>
          </div>
          <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-150"
              style={{ width: `${renderProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* TAB 1: Video Player & Preview */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col items-center justify-center min-h-[320px] relative overflow-hidden">
            {videoUrl ? (
              <div className="w-full flex flex-col items-center">
                <div
                  className={`relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black ${
                    project?.aspectRatio === '9:16' ? 'max-w-[280px] aspect-[9/16]' : 'w-full max-w-xl aspect-video'
                  }`}
                >
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>

                {/* Actions below video */}
                <div className="mt-4 flex items-center justify-between w-full max-w-xl flex-wrap gap-2 text-xs">
                  <div>
                    <h3 className="font-bold text-white text-sm">{project?.title}</h3>
                    <p className="text-[11px] text-slate-400">
                      {project?.scenes.length} Scenes • {project?.aspectRatio === '9:16' ? 'YouTube Shorts' : '16:9 HD'} • WebM Video
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadVideo}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('youtube')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-200 font-semibold"
                    >
                      <Youtube className="w-3.5 h-3.5 text-rose-400" />
                      <span>Publish to YouTube</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center">
                  <Video className="w-8 h-8 text-cyan-400" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-white text-base">No Video Rendered Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Type a prompt above or ask Brain Mate: *"Create a video about technology"* to generate and preview your video.
                  </p>
                </div>
                <button
                  onClick={() => handleGenerateScript()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
                >
                  Generate First Video
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Multi-Scene Editor */}
      {activeTab === 'scenes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Scenes & Storyboard ({project?.scenes.length || 0})
            </h3>
            <span className="text-[11px] text-slate-400">
              Edit captions, headlines, or duration
            </span>
          </div>

          <div className="space-y-3">
            {project?.scenes?.map((scene, idx) => (
              <div
                key={scene.id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-600/30 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center border border-indigo-500/30">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-xs text-white">Scene {idx + 1}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 text-[11px]">Duration:</span>
                    <input
                      type="number"
                      min={2}
                      max={12}
                      value={scene.durationSec || 4}
                      onChange={(e) => updateScene(idx, { durationSec: Number(e.target.value) })}
                      className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-center text-xs text-cyan-400 font-mono"
                    />
                    <span className="text-[11px] text-slate-400">sec</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Headline Title</label>
                    <input
                      type="text"
                      value={scene.title}
                      onChange={(e) => updateScene(idx, { title: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Subtitle / Keynote</label>
                    <input
                      type="text"
                      value={scene.subtitle}
                      onChange={(e) => updateScene(idx, { subtitle: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Voiceover Narration (Spoken aloud)</label>
                  <textarea
                    rows={2}
                    value={scene.narration}
                    onChange={(e) => updateScene(idx, { narration: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-200 font-sans"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: YouTube Publishing Hub */}
      {activeTab === 'youtube' && (
        <div className="space-y-4">
          {/* YouTube Connection Status Card */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center">
                <Youtube className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-white">Google YouTube Account</h4>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                      isYtConnected
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {isYtConnected ? 'Connected via OAuth 2.0' : 'Not Connected'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {ytChannel ? `Channel: ${ytChannel.title} (${ytChannel.subscriberCount || 0} subs)` : 'Connect to upload generated videos with official YouTube Data API.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isYtConnected ? (
                <button
                  onClick={handleDisconnectYouTube}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnectYouTube}
                  disabled={isConnectingYt}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20"
                >
                  <Youtube className="w-4 h-4" />
                  <span>{isConnectingYt ? 'Connecting...' : 'Connect YouTube'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Upload Configuration Form */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-4">
            <h4 className="font-bold text-xs text-white uppercase tracking-wider">
              YouTube Video Metadata & Privacy
            </h4>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Video Title</label>
              <input
                type="text"
                value={ytConfig.title}
                onChange={(e) => setYtConfig({ ...ytConfig, title: e.target.value })}
                placeholder="Enter title (max 100 characters)"
                maxLength={100}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Description & Hashtags</label>
              <textarea
                rows={3}
                value={ytConfig.description}
                onChange={(e) => setYtConfig({ ...ytConfig, description: e.target.value })}
                placeholder="Video description, links, and hashtags..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Visibility (Privacy)</label>
                <select
                  value={ytConfig.privacy}
                  onChange={(e) => setYtConfig({ ...ytConfig, privacy: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option value="private">🔒 Private (Only you can view - Recommended)</option>
                  <option value="unlisted">🔗 Unlisted (Anyone with link can view)</option>
                  <option value="public">🌐 Public (Visible to everyone on YouTube)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Defaults to Private until you approve publishing.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={ytConfig.tags.join(', ')}
                  onChange={(e) => setYtConfig({ ...ytConfig, tags: e.target.value.split(',').map((t) => t.trim()) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Upload Progress Bar if active */}
            {isUploadingYt && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-rose-200">
                  <span>{uploadStatusMsg}</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Upload Link banner if finished */}
            {uploadedVideoUrl && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Published to YouTube: <strong>{uploadedVideoUrl}</strong></span>
                </div>
                <a
                  href={uploadedVideoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-emerald-300 underline font-semibold"
                >
                  Watch <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Upload Action Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={handleUploadToYouTube}
                disabled={isUploadingYt || !generatedBlob}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs shadow-lg shadow-rose-600/25 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>{isUploadingYt ? 'Uploading to YouTube...' : 'Upload Video to YouTube'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
