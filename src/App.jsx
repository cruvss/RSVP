import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Type, Gauge, Target, Maximize2, Minimize2, Music, Volume2, VolumeX, Upload } from 'lucide-react';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker?url';

GlobalWorkerOptions.workerSrc = pdfWorker;

const App = () => {
  const [text, setText] = useState("Rapid Serial Visual Presentation (RSVP) allows you to read much faster by keeping your eyes anchored on a single point. This prototype highlights the middle anchor point in red to minimize eye movement.");
  const [wpm, setWpm] = useState(300);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fontSize, setFontSize] = useState(64);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.3);
  const [musicSource, setMusicSource] = useState('/audio/ETUDE.mp3');
  const [musicName, setMusicName] = useState('ETUDE.mp3');
  const [textFileName, setTextFileName] = useState('');
  const [isTextLoading, setIsTextLoading] = useState(false);
  
  const canvasRef = useRef(null);
  const timerRef = useRef(null);
  const audioRef = useRef(null);
  const words = text.split(/\s+/).filter(w => w.length > 0);

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
      setText('');
    } finally {
      setIsTextLoading(false);
    }
  };

  // Calculates which character to highlight in red
  const getAnchorIndex = (word) => {
    const length = word.length;
    if (length <= 1) return 0;
    if (length <= 5) return 1;
    if (length <= 9) return 2;
    if (length <= 13) return 3;
    return 4;
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const word = words[currentIndex] || "";
    
    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!word) return;

    // Font settings
    ctx.font = `bold ${fontSize}px "Courier New", monospace`;
    ctx.textBaseline = 'middle';
    
    const anchorIdx = getAnchorIndex(word);
    const part1 = word.substring(0, anchorIdx);
    const anchorChar = word[anchorIdx];
    const part2 = word.substring(anchorIdx + 1);

    const w1 = ctx.measureText(part1).width;
    const wAnchor = ctx.measureText(anchorChar).width;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const startX = centerX - w1 - (wAnchor / 2);

    // Draw centering guide notches
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - (fontSize * 0.8));
    ctx.lineTo(centerX, centerY - (fontSize * 0.5));
    ctx.moveTo(centerX, centerY + (fontSize * 0.5));
    ctx.lineTo(centerX, centerY + (fontSize * 0.8));
    ctx.stroke();

    // Draw the 3 parts of the word
    ctx.fillStyle = '#ffffff';
    ctx.fillText(part1, startX, centerY);
    
    ctx.fillStyle = '#ff4444'; // Red Anchor
    ctx.fillText(anchorChar, startX + w1, centerY);
    
    ctx.fillStyle = '#ffffff';
    ctx.fillText(part2, startX + w1 + wAnchor, centerY);
  }, [currentIndex, words, fontSize]);

  // Reading loop
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

  // Update canvas on every change
  useEffect(() => {
    draw();
  }, [draw]);

  // Background music control
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying && isMusicPlaying) {
      audioRef.current.play().catch(() => {
        // Handle autoplay restrictions
      });
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

  useEffect(() => {
    return () => {
      if (musicSource.startsWith('blob:')) {
        URL.revokeObjectURL(musicSource);
      }
    };
  }, [musicSource]);

  // Responsive canvas resizing
  useEffect(() => {
    const resize = () => {
      if (canvasRef.current) {
        if (isFullscreen) {
          canvasRef.current.width = Math.min(window.innerWidth * 0.9, 1200);
          canvasRef.current.height = Math.min(window.innerHeight * 0.6, 600);
        } else {
          canvasRef.current.width = canvasRef.current.parentElement.clientWidth;
          canvasRef.current.height = 300;
        }
        draw();
      }
    };
    window.addEventListener('resize', resize);
    resize();
    return () => window.removeEventListener('resize', resize);
  }, [draw, isFullscreen]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <audio 
        ref={audioRef} 
        src={musicSource}
        loop
      />
      <style>{`
        input[type="range"] {
          -webkit-appearance: none;
          height: 4px;
          background: #333;
          border-radius: 5px;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          background: #dc2626;
          border-radius: 50%;
          cursor: pointer;
        }
        canvas {
          image-rendering: crisp-edges;
        }
        .fullscreen-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100vh;
          margin: 0;
          padding: 0;
          background: #0a0a0a;
          z-index: 50;
          display: flex;
          flex-direction: column;
        }
        .fullscreen-navbar {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 1rem;
          background: rgba(23, 23, 23, 0.5);
          backdrop-filter: blur(12px);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .fullscreen-display {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #0a0a0a;
        }
        .fullscreen-controls {
          padding: 2rem;
          background: rgba(23, 23, 23, 0.95);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }
      `}</style>
      
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

      {isFullscreen ? (
        <div className="fullscreen-container">
          <div className="fullscreen-navbar">
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

          <div className="fullscreen-display">
            <canvas ref={canvasRef} />
          </div>

          <div className="fullscreen-controls">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <button 
                onClick={() => { setIsPlaying(false); setCurrentIndex(0); }} 
                className="p-3 hover:bg-white/5 rounded-full text-neutral-400"
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

              <div className="flex flex-col items-center gap-1 min-w-[120px]">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">WPM</span>
                <div className="flex items-center gap-3">
                   <button onClick={() => setWpm(Math.max(50, wpm - 50))} className="text-neutral-500 hover:text-white">-</button>
                   <span className="text-2xl font-mono font-bold text-red-500">{wpm}</span>
                   <button onClick={() => setWpm(Math.min(1000, wpm + 50))} className="text-neutral-500 hover:text-white">+</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <main className="max-w-6xl mx-auto p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
          {/* Left Config Panel */}
          <aside className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2 text-neutral-400">
                <Gauge size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Speed Control</span>
              </div>
              <input 
                type="range" min="100" max="1000" step="50" value={wpm} 
                onChange={(e) => setWpm(parseInt(e.target.value))} 
                className="w-full accent-red-600" 
              />
              <div className="flex justify-between text-[10px] text-neutral-500">
                <span>100 WPM</span>
                <span>1000 WPM</span>
              </div>
              <div className="flex items-center justify-center gap-3 rounded-xl bg-neutral-950/60 border border-white/5 py-2">
                <button onClick={() => setWpm(Math.max(50, wpm - 50))} className="text-neutral-500 hover:text-white">-</button>
                <span className="text-2xl font-mono font-bold text-red-500">{wpm}</span>
                <button onClick={() => setWpm(Math.min(1000, wpm + 50))} className="text-neutral-500 hover:text-white">+</button>
              </div>
            </div>

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
          </aside>

          {/* Right Content */}
          <section className="space-y-6">
            {/* Main Display Area */}
            <div className="relative bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <canvas ref={canvasRef} className="w-full" />
              {/* Progress bar at the bottom of the reader */}
              <div className="absolute bottom-0 left-0 h-1 bg-red-600 transition-all duration-150" 
                   style={{ width: `${((currentIndex + 1) / (words.length || 1)) * 100}%` }} />
            </div>

            {/* Playback Controls */}
            <div className="flex flex-wrap items-center justify-center gap-6 bg-neutral-900 p-6 rounded-2xl border border-white/5">
          <button 
            onClick={() => { setIsPlaying(false); setCurrentIndex(0); }} 
            className="p-3 hover:bg-white/5 rounded-full text-neutral-400"
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

              <div className="flex flex-col items-center gap-1 min-w-[120px]">
                <span className="text-[10px] font-bold text-neutral-500 uppercase">WPM</span>
                <div className="flex items-center gap-3">
                   <button onClick={() => setWpm(Math.max(50, wpm - 50))} className="text-neutral-500 hover:text-white">-</button>
                   <span className="text-2xl font-mono font-bold text-red-500">{wpm}</span>
                   <button onClick={() => setWpm(Math.min(1000, wpm + 50))} className="text-neutral-500 hover:text-white">+</button>
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 border border-white/5 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-neutral-400 px-1">
                <Type size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Source Text</span>
              </div>
              <textarea 
                value={text}
                onChange={(e) => { setText(e.target.value); setCurrentIndex(0); setIsPlaying(false); }}
                className="w-full h-56 bg-neutral-950 border border-white/10 rounded-xl p-4 text-sm text-neutral-300 focus:ring-2 focus:ring-red-500 outline-none resize-none"
                placeholder="Paste your text here..."
              />
            </div>
          </section>
        </div>
        </main>
      )}
    </div>
  );
};

export default App;
