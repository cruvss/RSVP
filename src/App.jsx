import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Type, Gauge, Target, Maximize2, Minimize2, Music, Volume2, VolumeX, Upload } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';
import myAudio from './assets/audio/ETUDE.mp3';

GlobalWorkerOptions.workerSrc = pdfWorker;

const DEFAULT_TEXT = "Rapid Serial Visual Presentation (RSVP) allows you to read much faster by keeping your eyes anchored on a single point. This prototype highlights the middle anchor point in red to minimize eye movement.";
const DEFAULT_WPM = 300;
const DEFAULT_FONT_SIZE = 64;
const MIN_WPM = 50;
const MAX_WPM = 1000;
const WPM_STEP = 50;

const useWords = (text) => {
  return text.split(/\s+/).filter(w => w.length > 0);
};

const useCanvas = (canvasRef, currentIndex, words, fontSize, isFullscreen) => {
  const getAnchorIndex = useCallback((word) => {
    const length = word.length;
    if (length === 1) return 0;
    if (length === 2) return 0;
    if (length === 3) return 1;
    if (length === 4) return 1;
    if (length === 5) return 1;
    if (length === 6) return 2;
    if (length === 7) return 2;
    if (length === 8) return 2;
    if (length === 9) return 3;
    if (length >= 10 && length <= 13) return 3;
    return 4;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const word = words[currentIndex] || "";

    const width = parseInt(canvas.style.width) || canvas.width;
    const height = parseInt(canvas.style.height) || canvas.height;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    if (!word) return;

    let currentFontSize = fontSize;
    ctx.font = `bold ${currentFontSize}px "Courier New", monospace`;
    let wordWidth = ctx.measureText(word).width;

    const maxWidth = width * 0.7;
    if (wordWidth > maxWidth) {
      currentFontSize = Math.floor((currentFontSize * maxWidth) / wordWidth);
      ctx.font = `bold ${currentFontSize}px "Courier New", monospace`;
    }

    ctx.textBaseline = 'middle';

    const anchorIdx = getAnchorIndex(word);
    const part1 = word.substring(0, anchorIdx);
    const anchorChar = word[anchorIdx];
    const part2 = word.substring(anchorIdx + 1);

    const w1 = ctx.measureText(part1).width;
    const wAnchor = ctx.measureText(anchorChar).width;

    const centerX = width / 2;
    const centerY = height / 2;

    const anchorStartX = centerX - (wAnchor / 2);
    const part1StartX = anchorStartX - w1;
    const part2StartX = anchorStartX + wAnchor;

    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - (currentFontSize * 0.8));
    ctx.lineTo(centerX, centerY - (currentFontSize * 0.5));
    ctx.moveTo(centerX, centerY + (currentFontSize * 0.5));
    ctx.lineTo(centerX, centerY + (currentFontSize * 0.8));
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(part1, part1StartX, centerY);

    ctx.fillStyle = '#ff4444';
    ctx.fillText(anchorChar, anchorStartX, centerY);

    ctx.fillStyle = '#ffffff';
    ctx.fillText(part2, part2StartX, centerY);
  }, [currentIndex, words, fontSize, getAnchorIndex, canvasRef]);

  return { draw };
};

const useCanvasResize = (canvasRef, draw, isFullscreen) => {
  useEffect(() => {
    const resize = () => {
      if (!canvasRef.current) return;
      
      const dpr = window.devicePixelRatio || 1;
      let displayWidth, displayHeight;

      if (isFullscreen) {
        displayWidth = Math.min(window.innerWidth * 0.9, 1200);
        displayHeight = Math.min(window.innerHeight * 0.6, 600);
      } else {
        const parent = canvasRef.current.parentElement;
        displayWidth = parent ? parent.clientWidth : window.innerWidth * 0.9;
        displayHeight = Math.min(displayWidth * 0.4, 400);
      }

      canvasRef.current.width = displayWidth * dpr;
      canvasRef.current.height = displayHeight * dpr;
      canvasRef.current.style.width = `${displayWidth}px`;
      canvasRef.current.style.height = `${displayHeight}px`;

      const ctx = canvasRef.current.getContext('2d');
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      draw();
    };

    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [draw, isFullscreen, canvasRef]);
};

const WPMControl = ({ wpm, setWpm, compact = false }) => (
  <div className={`flex ${compact ? 'flex-row' : 'flex-col'} items-center gap-${compact ? '3' : '1'} min-w-[120px]`}>
    {!compact && <span className="text-[10px] font-bold text-neutral-500 uppercase">WPM</span>}
    <div className="flex items-center gap-3">
      <button 
        onClick={() => setWpm(Math.max(MIN_WPM, wpm - WPM_STEP))} 
        className="text-neutral-500 hover:text-white transition-colors"
      >
        -
      </button>
      <span className="text-2xl font-mono font-bold text-red-500">{wpm}</span>
      <button 
        onClick={() => setWpm(Math.min(MAX_WPM, wpm + WPM_STEP))} 
        className="text-neutral-500 hover:text-white transition-colors"
      >
        +
      </button>
    </div>
  </div>
);

const SpeedControlPanel = ({ wpm, setWpm }) => (
  <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5 space-y-4">
    <div className="flex items-center gap-2 text-neutral-400">
      <Gauge size={16} />
      <span className="text-xs font-bold uppercase tracking-wider">Speed Control</span>
    </div>
    <input 
      type="range" 
      min={MIN_WPM} 
      max={MAX_WPM} 
      step={WPM_STEP} 
      value={wpm} 
      onChange={(e) => setWpm(parseInt(e.target.value))} 
      className="w-full accent-red-600" 
    />
    <div className="flex justify-between text-[10px] text-neutral-500">
      <span>{MIN_WPM} WPM</span>
      <span>{MAX_WPM} WPM</span>
    </div>
    <div className="flex items-center justify-center gap-3 rounded-xl bg-neutral-950/60 border border-white/5 py-2">
      <WPMControl wpm={wpm} setWpm={setWpm} compact />
    </div>
  </div>
);

const MusicControlPanel = ({ 
  isMusicPlaying, 
  setIsMusicPlaying, 
  musicVolume, 
  setMusicVolume, 
  musicName, 
  handleMusicUpload 
}) => (
  <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5 space-y-4">
    <div className="flex items-center gap-2 text-neutral-400">
      <Music size={16} />
      <span className="text-xs font-bold uppercase tracking-wider">Background Music</span>
    </div>
    <button
      onClick={() => setIsMusicPlaying(!isMusicPlaying)}
      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
        isMusicPlaying 
          ? 'bg-red-600 hover:bg-red-500 text-white' 
          : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-400'
      }`}
    >
      {isMusicPlaying ? 'Music Enabled' : 'Music Disabled'}
    </button>
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {musicVolume === 0 ? (
          <VolumeX size={16} className="text-neutral-500" />
        ) : (
          <Volume2 size={16} className="text-neutral-500" />
        )}
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={musicVolume}
          onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
          className="w-full accent-red-600"
        />
      </div>
      <div className="text-[10px] text-neutral-500 text-center">
        Volume: {Math.round(musicVolume * 100)}%
      </div>
    </div>
    <div className="space-y-2">
      <label className="flex items-center justify-between text-[10px] text-neutral-500">
        <span>Current file</span>
        <span className="truncate max-w-[160px] text-neutral-400">{musicName}</span>
      </label>
      <label className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer transition-colors">
        <Upload size={14} />
        <span className="text-sm font-medium">Upload Music</span>
        <input
          type="file"
          accept="audio/*"
          onChange={handleMusicUpload}
          className="hidden"
        />
      </label>
    </div>
  </div>
);

const TextImportPanel = ({ handleTextUpload, isTextLoading, textFileName }) => (
  <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5 space-y-4">
    <div className="flex items-center gap-2 text-neutral-400">
      <Type size={16} />
      <span className="text-xs font-bold uppercase tracking-wider">Import Text</span>
    </div>
    <label className="flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 cursor-pointer transition-colors">
      <Upload size={14} />
      <span className="text-sm font-medium">Upload File</span>
      <input
        type="file"
        accept=".txt,.pdf,text/*,application/pdf"
        onChange={handleTextUpload}
        className="hidden"
      />
    </label>
    <div className="flex items-center justify-between text-[10px] text-neutral-500">
      <span>{isTextLoading ? 'Loading...' : 'Supported: .txt, .pdf'}</span>
      <span className="truncate max-w-[160px] text-neutral-400">
        {textFileName || 'No file selected'}
      </span>
    </div>
  </div>
);

const PlaybackControls = ({ isPlaying, setIsPlaying, setCurrentIndex, wpm, setWpm }) => (
  <div className="flex flex-wrap items-center justify-center gap-6 bg-neutral-900 p-6 rounded-2xl border border-white/5">
    <button 
      onClick={() => { setIsPlaying(false); setCurrentIndex(0); }} 
      className="p-3 hover:bg-white/5 rounded-full text-neutral-400 transition-colors"
      title="Reset"
    >
      <RotateCcw size={24} />
    </button>
    
    <button 
      onClick={() => setIsPlaying(!isPlaying)} 
      className="w-16 h-16 bg-red-600 hover:bg-red-500 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-lg"
    >
      {isPlaying ? <Pause size={32} fill="white" /> : <Play size={32} fill="white" className="ml-1" />}
    </button>

    <WPMControl wpm={wpm} setWpm={setWpm} />
  </div>
);

const Header = ({ isFullscreen, setIsFullscreen }) => (
  <nav className="border-b border-white/10 p-4 flex items-center justify-between bg-neutral-900/50 backdrop-blur-md">
    <div className="flex items-center gap-2">
      <div className="bg-red-600 p-1.5 rounded-lg">
        <Target size={20} fill="white" />
      </div>
      <h1 className="font-bold text-xl tracking-tight">FocusReader</h1>
    </div>
    <button
      onClick={() => setIsFullscreen(!isFullscreen)}
      className="p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors"
      title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
    >
      {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
    </button>
  </nav>
);

const FullscreenView = ({ 
  canvasRef, 
  setIsFullscreen, 
  isPlaying, 
  setIsPlaying, 
  setCurrentIndex, 
  wpm, 
  setWpm 
}) => (
  <div className="fixed inset-0 w-screen h-screen m-0 p-0 bg-neutral-950 z-50 flex flex-col">
    <div className="border-b border-white/10 p-4 bg-neutral-900/50 backdrop-blur-xl flex-shrink-0 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-red-600 p-1.5 rounded-lg">
          <Target size={20} fill="white" />
        </div>
        <h1 className="font-bold text-xl tracking-tight">FocusReader</h1>
      </div>
      <button
        onClick={() => setIsFullscreen(false)}
        className="p-2 hover:bg-white/5 rounded-lg text-neutral-400 hover:text-white transition-colors"
        title="Exit fullscreen"
      >
        <Minimize2 size={24} />
      </button>
    </div>

    <div className="flex-1 flex items-center justify-center overflow-hidden bg-neutral-950 p-4">
      <canvas ref={canvasRef} className="max-w-full max-h-full" />
    </div>

    <div className="p-4 sm:p-8 bg-neutral-900/95 border-t border-white/10 flex-shrink-0">
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        <button 
          onClick={() => { setIsPlaying(false); setCurrentIndex(0); }} 
          className="p-3 hover:bg-white/5 rounded-full text-neutral-400"
          title="Reset"
        >
          <RotateCcw size={24} />
        </button>
        
        <button 
          onClick={() => setIsPlaying(!isPlaying)} 
          className="w-14 h-14 sm:w-16 sm:h-16 bg-red-600 hover:bg-red-500 flex items-center justify-center rounded-full transition-all active:scale-95 shadow-lg"
        >
          {isPlaying ? <Pause size={28} fill="white" /> : <Play size={28} fill="white" className="ml-1" />}
        </button>

        <WPMControl wpm={wpm} setWpm={setWpm} />
      </div>
    </div>
  </div>
);

const App = () => {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [wpm, setWpm] = useState(DEFAULT_WPM);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.9);
  const [musicSource, setMusicSource] = useState(myAudio);
  const [musicName, setMusicName] = useState('ETUDE.mp3');
  const [textFileName, setTextFileName] = useState('');
  const [isTextLoading, setIsTextLoading] = useState(false);
  
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  
  const words = useWords(text);
  const { draw } = useCanvas(canvasRef, currentIndex, words, fontSize, isFullscreen);
  
  useCanvasResize(canvasRef, draw, isFullscreen);

  const handleMusicUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    setMusicSource((prev) => {
      if (prev.startsWith('blob:')) {
        URL.revokeObjectURL(prev);
      }
      return nextUrl;
    });
    setMusicName(file.name);
    setIsMusicPlaying(true);
  };

  const handleTextUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsTextLoading(true);
    setTextFileName(file.name);

    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let combinedText = '';
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
          const page = await pdf.getPage(pageNum);
          const content = await page.getTextContent();
          const pageText = content.items.map((item) => item.str).join(' ');
          combinedText += `${pageText}\n`;
        }
        setText(combinedText.trim());
      } else {
        const fileText = await file.text();
        setText(fileText);
      }
      setCurrentIndex(0);
      setIsPlaying(false);
    } catch (error) {
      console.error('Error loading file:', error);
      setText('');
    } finally {
      setIsTextLoading(false);
    }
  };

  useEffect(() => {
    if (isPlaying && currentIndex < words.length - 1) {
      const msPerWord = (60 / wpm) * 1000;
      timerRef.current = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, msPerWord);
    } else if (currentIndex >= words.length - 1) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [isPlaying, currentIndex, words.length, wpm]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying && isMusicPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isMusicPlaying, isPlaying]);

  // Update music volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume;
    }
  }, [musicVolume]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (musicSource.startsWith('blob:')) {
        URL.revokeObjectURL(musicSource);
      }
    };
  }, [musicSource]);

  if (isFullscreen) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white font-sans">
        <audio ref={audioRef} src={musicSource} loop />
        <FullscreenView 
          canvasRef={canvasRef}
          setIsFullscreen={setIsFullscreen}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          setCurrentIndex={setCurrentIndex}
          wpm={wpm}
          setWpm={setWpm}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <audio ref={audioRef} src={musicSource} loop />
      
      <Header isFullscreen={isFullscreen} setIsFullscreen={setIsFullscreen} />

      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col lg:grid lg:grid-cols-[320px_1fr] gap-6 lg:gap-8">
          {/* Left Config Panel */}
          <aside className="lg:sticky lg:top-24 space-y-6 order-2 lg:order-1">
            <SpeedControlPanel wpm={wpm} setWpm={setWpm} />
            <MusicControlPanel 
              isMusicPlaying={isMusicPlaying}
              setIsMusicPlaying={setIsMusicPlaying}
              musicVolume={musicVolume}
              setMusicVolume={setMusicVolume}
              musicName={musicName}
              handleMusicUpload={handleMusicUpload}
            />
            <TextImportPanel 
              handleTextUpload={handleTextUpload}
              isTextLoading={isTextLoading}
              textFileName={textFileName}
            />
          </aside>

          {/* Right Content */}
          <section className="space-y-6 order-1 lg:order-2">
            {/* Main Display Area */}
            <div className="relative bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <canvas ref={canvasRef} className="w-full" />
              {/* Progress bar */}
              <div 
                className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-150" 
                style={{ width: `${((currentIndex + 1) / (words.length || 1)) * 100}%` }} 
              />
            </div>

            {/* Playback Controls */}
            <PlaybackControls 
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              setCurrentIndex={setCurrentIndex}
              wpm={wpm}
              setWpm={setWpm}
            />

            {/* Source Text */}
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-2 text-neutral-400 px-1">
                <Type size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Source Text</span>
              </div>
              <textarea 
                value={text}
                onChange={(e) => { 
                  setText(e.target.value); 
                  setCurrentIndex(0); 
                  setIsPlaying(false); 
                }}
                className="w-full h-40 sm:h-56 bg-neutral-950 border border-white/10 rounded-xl p-4 text-sm text-neutral-300 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                placeholder="Paste your text here..."
              />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;