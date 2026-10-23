import { VideoAspectRatio, VideoProject, VideoScene } from '../types';

class VideoService {
  /**
   * Request AI Script & Scenes Generation from backend Gemini endpoint
   */
  public async generateScript(
    prompt: string,
    language: string = 'en-IN',
    aspectRatio: VideoAspectRatio = '16:9'
  ): Promise<Partial<VideoProject>> {
    try {
      const res = await fetch('/api/video/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language, aspectRatio }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.project) {
          return data.project;
        }
      }
    } catch (e) {
      console.warn('Script generation server call fallback:', e);
    }

    // Local resilient script synthesis if network or backend timeout
    return this.createFallbackScript(prompt, language, aspectRatio);
  }

  public createFallbackScript(
    prompt: string,
    language: string = 'en-IN',
    aspectRatio: VideoAspectRatio = '16:9'
  ): Partial<VideoProject> {
    const isHindi = language === 'hi-IN' || /[\u0900-\u097F]/.test(prompt);
    const isShort = aspectRatio === '9:16';
    const cleanTopic = prompt.replace(/create|video|make|banao|about|par|short/gi, '').trim() || (isHindi ? 'भविष्य की तकनीक' : 'Future Technology & AI');

    const scenes: VideoScene[] = isHindi
      ? [
          {
            id: 's-1',
            title: cleanTopic,
            subtitle: 'ब्रेन मेट एआई विशेष प्रस्तुति',
            narration: `नमस्ते दोस्तों! आज हम जानेंगे ${cleanTopic} के बारे में कुछ हैरान कर देने वाले तथ्य।`,
            visualPrompt: 'High tech futuristic grid and neon hologram lights',
            bgGradient: ['#0f172a', '#312e81'],
            durationSec: 4,
            transition: 'fade',
            iconName: 'Cpu',
          },
          {
            id: 's-2',
            title: 'मुख्य नवाचार और शक्ति',
            subtitle: 'तेजी से बदलती डिजिटल दुनिया',
            narration: 'तकनीकी क्रांति हमारे काम करने और सोचने के तरीके को पूरी तरह से बदल रही है।',
            visualPrompt: 'Glowing neural network nodes connecting in 3D space',
            bgGradient: ['#1e1b4b', '#065f46'],
            durationSec: 4,
            transition: 'slide',
            iconName: 'Zap',
          },
          {
            id: 's-3',
            title: 'भविष्य का प्रभाव',
            subtitle: 'स्मार्ट स्वचालन और उत्पादकता',
            narration: 'आने वाले समय में यह तकनीक मानव जीवन को और भी अधिक सुलभ और उत्पादक बनाएगी।',
            visualPrompt: 'Futuristic smart city with autonomous systems',
            bgGradient: ['#111827', '#1e3a8a'],
            durationSec: 4,
            transition: 'zoom',
            iconName: 'Sparkles',
          },
          {
            id: 's-4',
            title: 'निष्कर्ष एवं संदेश',
            subtitle: 'लाइक और सब्सक्राइब करें',
            narration: 'यदि आपको यह जानकारी रोचक लगी तो वीडियो को लाइक करें और चैनल को सब्सक्राइब करें। धन्यवाद!',
            visualPrompt: 'YouTube subscribe badge and digital thumbs up animation',
            bgGradient: ['#1e1b4b', '#831843'],
            durationSec: 4,
            transition: 'fade',
            iconName: 'CheckCircle2',
          },
        ]
      : [
          {
            id: 's-1',
            title: cleanTopic.toUpperCase(),
            subtitle: 'Brain Mate AI Showcase',
            narration: `Welcome! Today we are exploring ${cleanTopic} and the breakthrough innovations shaping our future.`,
            visualPrompt: 'High tech futuristic grid and neon hologram lights',
            bgGradient: ['#0f172a', '#312e81'],
            durationSec: 4,
            transition: 'fade',
            iconName: 'Cpu',
          },
          {
            id: 's-2',
            title: 'Core Innovation',
            subtitle: 'Next-Gen Transformation',
            narration: 'Cutting-edge algorithms and intelligence systems are transforming how we communicate and build.',
            visualPrompt: 'Glowing neural network nodes connecting in 3D space',
            bgGradient: ['#1e1b4b', '#065f46'],
            durationSec: 4,
            transition: 'slide',
            iconName: 'Zap',
          },
          {
            id: 's-3',
            title: 'Real-World Impact',
            subtitle: 'Speed, Scale & Accuracy',
            narration: 'From automated task execution to smart workflow assistants, productivity is reaching unprecedented levels.',
            visualPrompt: 'Futuristic holographic dashboard and real-time analytics',
            bgGradient: ['#111827', '#1e3a8a'],
            durationSec: 4,
            transition: 'zoom',
            iconName: 'Sparkles',
          },
          {
            id: 's-4',
            title: 'Subscribe For More',
            subtitle: 'Like & Share',
            narration: 'If you enjoyed this breakdown, make sure to like, share, and subscribe to the channel for daily updates!',
            visualPrompt: 'YouTube notification bell icon and like animation',
            bgGradient: ['#1e1b4b', '#831843'],
            durationSec: 4,
            transition: 'fade',
            iconName: 'CheckCircle2',
          },
        ];

    return {
      title: `${cleanTopic} — ${isShort ? '#Shorts' : 'Complete Breakdown'}`,
      description: `${cleanTopic} explained simply by Brain Mate AI. Watch till the end for key insights and future trends.\n\n#Technology #AI #BrainMate #${isShort ? 'Shorts' : 'YouTubeVideo'}`,
      tags: ['BrainMateAI', 'Technology', 'AI', cleanTopic.replace(/\s+/g, ''), isShort ? 'Shorts' : 'Video'],
      aspectRatio,
      scenes,
      bgmStyle: 'tech_ambient',
      status: 'ready',
      progress: 100,
    };
  }

  /**
   * Render real playable video using HTML5 Canvas, Web Audio API, and MediaRecorder
   */
  public async renderVideo(
    project: VideoProject,
    onProgress: (percent: number, stepMsg: string) => void
  ): Promise<Blob> {
    const isVertical = project.aspectRatio === '9:16';
    const width = isVertical ? 720 : 1280;
    const height = isVertical ? 1280 : 720;
    const fps = 30;

    onProgress(10, 'Initializing video render engine...');

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D rendering context not available.');
    }

    // Audio Context for ambient synthesized soundtrack
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    const dest = audioCtx.createMediaStreamDestination();

    // Background synthesized soundtrack generator
    this.startSynthesizedBgm(audioCtx, dest, project.bgmStyle);

    // Combine video stream and audio stream
    const canvasStream = canvas.captureStream(fps);
    const audioTrack = dest.stream.getAudioTracks()[0];
    if (audioTrack) {
      canvasStream.addTrack(audioTrack);
    }

    // Check supported MIME type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }

    const mediaRecorder = new MediaRecorder(canvasStream, {
      mimeType,
      videoBitsPerSecond: 3_500_000,
    });

    const recordedChunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.start(100);

    const scenes = project.scenes && project.scenes.length > 0 ? project.scenes : [
      {
        id: '1',
        title: project.title,
        subtitle: 'Brain Mate AI Video',
        narration: project.description,
        visualPrompt: 'Tech grid',
        bgGradient: ['#090d16', '#312e81'] as [string, string],
        durationSec: 5,
        transition: 'fade' as const,
      },
    ];

    const totalDurationSec = scenes.reduce((acc, s) => acc + (s.durationSec || 4), 0);
    const totalFrames = Math.floor(totalDurationSec * fps);

    // Particle field simulation for aesthetic background
    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      radius: Math.random() * 3 + 1.5,
      color: Math.random() > 0.5 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(129, 140, 248, 0.4)',
    }));

    let currentFrame = 0;
    let accumulatedTime = 0;

    return new Promise((resolve, reject) => {
      const renderLoop = () => {
        if (currentFrame >= totalFrames) {
          mediaRecorder.onstop = () => {
            audioCtx.close();
            const finalBlob = new Blob(recordedChunks, { type: 'video/webm' });
            onProgress(100, 'Video generation complete!');
            resolve(finalBlob);
          };
          mediaRecorder.stop();
          return;
        }

        const currentTimeSec = currentFrame / fps;

        // Determine which scene is active
        let sceneIndex = 0;
        let sceneTimeOffset = 0;
        let cumulative = 0;
        for (let i = 0; i < scenes.length; i++) {
          const dur = scenes[i].durationSec || 4;
          if (currentTimeSec >= cumulative && currentTimeSec < cumulative + dur) {
            sceneIndex = i;
            sceneTimeOffset = currentTimeSec - cumulative;
            break;
          }
          cumulative += dur;
        }

        const scene = scenes[sceneIndex] || scenes[scenes.length - 1];
        const sceneDuration = scene.durationSec || 4;
        const sceneProgress = Math.min(1, sceneTimeOffset / sceneDuration);

        // Update progress
        const percent = Math.min(95, Math.round(15 + (currentFrame / totalFrames) * 80));
        onProgress(percent, `Rendering Scene ${sceneIndex + 1}/${scenes.length}: "${scene.title}"`);

        // 1. Draw animated gradient background
        const [c1, c2] = scene.bgGradient || ['#090d16', '#1e1b4b'];
        const grad = ctx.createLinearGradient(0, 0, width, height);
        grad.addColorStop(0, c1);
        grad.addColorStop(1, c2);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        // 2. Draw moving ambient particles
        for (const p of particles) {
          p.x = (p.x + p.vx + width) % width;
          p.y = (p.y + p.vy + height) % height;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
        }

        // 3. Draw tech geometric overlay lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        const gridStep = isVertical ? 60 : 80;
        for (let x = 0; x < width; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }

        // 4. Draw Header Branding Badge
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
        ctx.lineWidth = 1.5;
        const badgeW = isVertical ? 260 : 300;
        const badgeH = isVertical ? 42 : 46;
        const badgeX = (width - badgeW) / 2;
        const badgeY = isVertical ? 70 : 50;
        this.roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 12);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = `bold ${isVertical ? 15 : 17}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡ BRAIN MATE AI STUDIO', width / 2, badgeY + badgeH / 2);
        ctx.restore();

        // 5. Scene Number & Transition effect
        let alpha = 1;
        if (sceneTimeOffset < 0.4) {
          alpha = sceneTimeOffset / 0.4; // Fade in
        } else if (sceneTimeOffset > sceneDuration - 0.4) {
          alpha = (sceneDuration - sceneTimeOffset) / 0.4; // Fade out
        }
        ctx.save();
        ctx.globalAlpha = Math.max(0.1, Math.min(1, alpha));

        // Center card card glow
        const cardW = isVertical ? width * 0.88 : width * 0.75;
        const cardH = isVertical ? height * 0.45 : height * 0.5;
        const cardX = (width - cardW) / 2;
        const cardY = (height - cardH) / 2 - (isVertical ? 20 : 10);

        ctx.fillStyle = 'rgba(10, 15, 30, 0.75)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.lineWidth = 2;
        this.roundRect(ctx, cardX, cardY, cardW, cardH, 24);
        ctx.fill();
        ctx.stroke();

        // Scene Number indicator
        ctx.fillStyle = '#818cf8';
        ctx.font = `bold ${isVertical ? 14 : 16}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`SCENE ${sceneIndex + 1} OF ${scenes.length}`, width / 2, cardY + (isVertical ? 45 : 50));

        // Main Scene Title
        ctx.fillStyle = '#ffffff';
        ctx.font = `800 ${isVertical ? 28 : 36}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 10;
        this.wrapText(ctx, scene.title, width / 2, cardY + (isVertical ? 95 : 110), cardW - 40, isVertical ? 38 : 46);

        // Subtitle / Highlight text
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#38bdf8';
        ctx.font = `600 ${isVertical ? 18 : 22}px sans-serif`;
        this.wrapText(ctx, scene.subtitle, width / 2, cardY + (isVertical ? 180 : 190), cardW - 50, isVertical ? 26 : 30);

        // Visual Prompt Graphic Card
        ctx.fillStyle = 'rgba(30, 41, 59, 0.6)';
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
        const promptW = cardW - 40;
        const promptH = isVertical ? 70 : 60;
        const promptX = (width - promptW) / 2;
        const promptY = cardY + cardH - promptH - 25;
        this.roundRect(ctx, promptX, promptY, promptW, promptH, 14);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#94a3b8';
        ctx.font = `500 ${isVertical ? 12 : 14}px monospace`;
        this.wrapText(ctx, `[AI Visual: ${scene.visualPrompt}]`, width / 2, promptY + promptH / 2, promptW - 20, 18);

        ctx.restore();

        // 6. Subtitles & Live Narration Banner at Bottom
        const captionW = width * 0.92;
        const captionH = isVertical ? 120 : 90;
        const captionX = (width - captionW) / 2;
        const captionY = height - captionH - (isVertical ? 60 : 35);

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = 1.5;
        this.roundRect(ctx, captionX, captionY, captionW, captionH, 16);
        ctx.fill();
        ctx.stroke();

        // Animated narration text
        ctx.fillStyle = '#fef08a';
        ctx.font = `bold ${isVertical ? 16 : 19}px sans-serif`;
        ctx.textAlign = 'center';
        this.wrapText(ctx, `💬 "${scene.narration}"`, width / 2, captionY + (isVertical ? 40 : 35), captionW - 40, isVertical ? 24 : 28);
        ctx.restore();

        // 7. Timeline Progress Bar
        const barH = 6;
        ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
        ctx.fillRect(0, height - barH, width, barH);

        const progressW = (currentFrame / totalFrames) * width;
        const progGrad = ctx.createLinearGradient(0, 0, width, 0);
        progGrad.addColorStop(0, '#6366f1');
        progGrad.addColorStop(1, '#38bdf8');
        ctx.fillStyle = progGrad;
        ctx.fillRect(0, height - barH, progressW, barH);

        currentFrame++;
        requestAnimationFrame(renderLoop);
      };

      requestAnimationFrame(renderLoop);
    });
  }

  private startSynthesizedBgm(
    audioCtx: AudioContext,
    dest: MediaStreamAudioDestinationNode,
    style: string
  ) {
    try {
      const baseFreqs = style === 'energetic' ? [220, 277, 330, 440] : [130, 164, 196, 261];
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      masterGain.connect(dest);

      // Ambient warm chord pad
      baseFreqs.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        // Gentle LFO pulsation
        const lfo = audioCtx.createOscillator();
        lfo.frequency.setValueAtTime(0.25 + idx * 0.1, audioCtx.currentTime);
        const lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(0.015, audioCtx.currentTime);
        lfo.connect(lfoGain);
        lfoGain.connect(gain.gain);
        lfo.start();

        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
      });
    } catch (e) {
      console.warn('Audio synthesis note:', e);
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  private wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) {
    const words = text.split(' ');
    let line = '';
    const lines: string[] = [];

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line);
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    const startY = y - ((lines.length - 1) * lineHeight) / 2;
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i].trim(), x, startY + i * lineHeight);
    }
  }
}

export const videoService = new VideoService();
