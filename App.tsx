import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Upload, Image as ImageIcon, 
  ChevronRight, ChevronLeft, Edit3,
  Check, X, Settings, Share2, Type, AlertCircle, Move, Link as LinkIcon, Gift, Download, Loader2, Copy
} from 'lucide-react';

/**
 * 【詩意程式碼註釋：全屏之愛】
 * 空間不再是限制，我們讓每一分愛意都填滿螢幕。
 * 修正了佈局的偏差，讓文字在溫暖的角落安放。
 * 手指的觸碰，是開啟回憶的唯一鑰匙。
 */

interface Config {
  coverTitle: string;
  toName: string;
  intro: string;
  font: string;
  bubbleColor: string;
  filter: string;
}

interface Photo {
  src: string | null;
  caption: string;
  x: number;
  y: number;
  zoom: number;
}

interface Particle {
  x: number;
  y: number;
  s: number;
  vy: number;
  vx: number;
  o: number;
  r: number;
}

const FONTS = [
  { name: 'Noto Serif TC', label: '思源宋體 (優雅)' },
  { name: 'Noto Sans TC', label: '思源黑體 (現代)' },
  { name: 'Ma Shan Zheng', label: '馬善政毛筆 (古典)' },
  { name: 'Zhi Mang Xing', label: '行書 (豪邁)' },
  { name: 'Long Cang', label: '龍倉體 (俏皮)' },
];

const RoseDecoration = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="currentColor">
    <path d="M50 50c0-15 10-25 25-25s25 10 25 25-10 25-25 25-25-10-25-25z" opacity="0.2" />
    <path d="M50 50c-15 0-25-10-25-25s10-25 25-25 25 10 25 25-10 25-25 25z" opacity="0.3" />
    <circle cx="50" cy="50" r="10" className="text-rose-400" />
    <path d="M50 60c0 10-5 20-15 20s-15-10-15-20 5-20 15-20 15 10 15 20z" opacity="0.2" />
  </svg>
);

const PhotoWithBubble = ({ 
  src, caption, bubbleColor, filter, font, 
  transform, isAdjusting, onMouseDown, onWheel 
}: { 
  src: string | null, 
  caption: string, 
  bubbleColor: string, 
  filter: string, 
  font: string,
  transform: { x: number, y: number, zoom: number },
  isAdjusting?: boolean,
  onMouseDown?: (e: React.MouseEvent) => void,
  onWheel?: (e: React.WheelEvent) => void
}) => (
  <div className="relative group p-1 sm:p-2">
    <div className={`relative w-full aspect-square rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-lg bg-rose-50 border-2 ${isAdjusting ? 'border-rose-500 ring-2 ring-rose-300' : 'border-white'} transition-all`}>
      {src ? (
        <img 
          src={src} 
          alt="Memory" 
          draggable={false}
          onMouseDown={isAdjusting ? onMouseDown : undefined}
          onWheel={isAdjusting ? onWheel : undefined}
          style={{
             transform: `scale(${transform.zoom}) translate(${transform.x / transform.zoom}px, ${transform.y / transform.zoom}px)`,
             cursor: isAdjusting ? 'move' : 'default',
             transition: isAdjusting ? 'none' : 'transform 0.1s ease-out'
          }}
          className={`w-full h-full object-cover ${filter} origin-center will-change-transform`} 
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center text-rose-200">
          <ImageIcon size={28} />
          <span className="text-[9px] mt-1 font-bold">待上傳</span>
        </div>
      )}
      
      {isAdjusting && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded-full pointer-events-none backdrop-blur-sm z-20">
          拖曳移動 • 滾輪縮放
        </div>
      )}
    </div>
    {caption && (
      <motion.div 
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ fontFamily: font }}
        className={`absolute -top-2 -right-1 p-2 rounded-xl text-[10px] sm:text-[12px] shadow-xl border border-white/50 max-w-[100px] sm:max-w-[130px] break-words z-10
          ${bubbleColor === 'pink' ? 'bg-rose-100/95 text-rose-600' : 
            bubbleColor === 'blue' ? 'bg-sky-100/95 text-sky-600' : 'bg-white/95 text-slate-600'}
        `}
      >
        {caption}
        <div className={`absolute -bottom-1 left-3 w-2 h-2 rotate-45 
          ${bubbleColor === 'pink' ? 'bg-rose-100/95' : bubbleColor === 'blue' ? 'bg-sky-100/95' : 'bg-white/95'}
        `} />
      </motion.div>
    )}
  </div>
);

// Helper to compress image - Aggressive compression for mobile HTML
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 600; // Smaller size for mobile performance (was 800)
        
        if (width > height && width > maxDim) {
          height = (height * maxDim) / width;
          width = maxDim;
        } else if (height > maxDim) {
          width = (width * maxDim) / height;
          height = maxDim;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress to JPEG 0.5 quality
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
    };
  });
};

const App = () => {
  const [currentPage, setCurrentPage] = useState(0); 
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isViewOnly, setIsViewOnly] = useState(false); 
  const [adjustingPhotoIndex, setAdjustingPhotoIndex] = useState<number | null>(null);
  const [shareUrl, setShareUrl] = useState('');
  const [shareError, setShareError] = useState('');
  const [hasLocalImages, setHasLocalImages] = useState(false);
  const [urlInputModes, setUrlInputModes] = useState<boolean[]>(Array(7).fill(false));
  
  const [config, setConfig] = useState<Config>({
    coverTitle: '三維之愛的心動日記',
    toName: '心上人',
    intro: '這是我們共同編織的故事，每一頁都記錄著那些心動的瞬間。我為你準備了這份驚喜，希望你能感受到這份心意。',
    font: 'Noto Serif TC',
    bubbleColor: 'pink',
    filter: 'sepia-0',
  });
  
  const [photos, setPhotos] = useState<Photo[]>(Array(7).fill({ 
    src: null, 
    caption: '', 
    x: 0, 
    y: 0, 
    zoom: 1 
  }));
  
  const diaryRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });

  const nextPage = () => setCurrentPage(p => p < 3 ? p + 1 : 0);
  const prevPageAction = () => setCurrentPage(p => Math.max(0, p - 1));

  // Check if photos use base64 (uploaded) which breaks URLs
  useEffect(() => {
    const local = photos.some(p => p.src && p.src.startsWith('data:'));
    setHasLocalImages(local);
  }, [photos]);

  // Init: Check URL for shared data
  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1);
      const searchParams = new URLSearchParams(window.location.search);
      
      if (hash) {
        const decodedStr = decodeURIComponent(atob(hash));
        const decoded = JSON.parse(decodedStr);
        
        if (decoded.config) setConfig(decoded.config);
        
        if (decoded.photos) {
          const loadedPhotos = decoded.photos.map((p: any) => ({
             ...p,
             x: p.x ?? 0,
             y: p.y ?? 0,
             zoom: p.zoom ?? 1
          }));
          setPhotos(loadedPhotos);
        }
        setIsViewOnly(true);
      } else if (searchParams.get('mode') === 'view') {
        setIsViewOnly(true);
      }
    } catch (e) {
      console.error("Failed to load data from URL", e);
    }
  }, []);

  useEffect(() => {
    // Canvas animation loop
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const resize = () => { 
        canvas.width = window.innerWidth; 
        canvas.height = window.innerHeight; 
    };
    window.addEventListener('resize', resize);
    resize();

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (particles.length < 30 && Math.random() < 0.05) {
        particles.push({
          x: Math.random() * canvas.width,
          y: canvas.height + 20,
          s: Math.random() * 4 + 2,
          vy: -Math.random() * 1.0 - 0.2,
          vx: Math.sin(Math.random()) * 0.3,
          o: 1,
          r: Math.random() * 360
        });
      }
      
      particles.forEach((p, i) => {
        p.y += p.vy;
        p.x += p.vx;
        p.o -= 0.001;
        p.r += 0.3;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r * Math.PI / 180);
        ctx.fillStyle = `rgba(251, 113, 133, ${p.o * 0.3})`;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s, p.s * 1.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (p.o <= 0) particles.splice(i, 1);
      });
      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handlePhotoMouseDown = (e: React.MouseEvent) => {
    if (adjustingPhotoIndex === null) return;
    const photo = photos[adjustingPhotoIndex];
    dragStart.current = { x: e.clientX - photo.x, y: e.clientY - photo.y };
    window.addEventListener('mousemove', handlePhotoMouseMove);
    window.addEventListener('mouseup', handlePhotoMouseUp);
  };

  const handlePhotoMouseMove = (e: MouseEvent) => {
    if (adjustingPhotoIndex === null) return;
    setPhotos(prev => {
        const newPhotos = [...prev];
        const current = newPhotos[adjustingPhotoIndex];
        newPhotos[adjustingPhotoIndex] = {
            ...current,
            x: e.clientX - dragStart.current.x,
            y: e.clientY - dragStart.current.y
        };
        return newPhotos;
    });
  };

  const handlePhotoMouseUp = () => {
    window.removeEventListener('mousemove', handlePhotoMouseMove);
    window.removeEventListener('mouseup', handlePhotoMouseUp);
  };

  const handlePhotoWheel = (e: React.WheelEvent) => {
    if (adjustingPhotoIndex === null) return;
    const zoomStep = e.deltaY > 0 ? -0.1 : 0.1;
    setPhotos(prev => {
        const newPhotos = [...prev];
        const current = newPhotos[adjustingPhotoIndex];
        const newZoom = Math.max(0.5, Math.min(5, current.zoom + zoomStep));
        newPhotos[adjustingPhotoIndex] = {
            ...current,
            zoom: newZoom
        };
        return newPhotos;
    });
  };

  const startAdjusting = (index: number) => {
    setAdjustingPhotoIndex(index);
    if (index === 0) setCurrentPage(1);
    else if (index >= 1 && index <= 3) setCurrentPage(2);
    else setCurrentPage(3);
  };

  const handleUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedSrc = await compressImage(file);
        const newPhotos = [...photos];
        newPhotos[index] = { ...newPhotos[index], src: compressedSrc, x: 0, y: 0, zoom: 1 };
        setPhotos(newPhotos);
        startAdjusting(index);
      } catch (err) {
        console.error("Compression failed", err);
      }
    }
  };

  const handleUrlInput = (index: number, url: string) => {
    const newPhotos = [...photos];
    newPhotos[index] = { ...newPhotos[index], src: url, x: 0, y: 0, zoom: 1 };
    setPhotos(newPhotos);
  };

  const toggleInputMode = (index: number) => {
    const newModes = [...urlInputModes];
    newModes[index] = !newModes[index];
    setUrlInputModes(newModes);
  };

  const generateShareLink = () => {
    try {
      setShareError('');
      const stateToSave = { config, photos };
      
      // Safety check: local images
      if (hasLocalImages) {
        setShareError('包含上傳圖片，無法使用短網址。請使用下載功能。');
        return;
      }

      const jsonStr = JSON.stringify(stateToSave);
      // Double check length
      if (jsonStr.length > 8000) {
        setShareError('資料量過大，無法產生連結。');
        return;
      }

      const encoded = btoa(encodeURIComponent(jsonStr));
      const baseUrl = window.location.href.split('#')[0].split('?')[0];
      const newUrl = `${baseUrl}#${encoded}`;
      
      setShareUrl(newUrl);
      navigator.clipboard.writeText(newUrl);
    } catch (e) {
      setShareError('生成連結錯誤。');
    }
  };

  // 生成獨立的 HTML 卡片檔案
  const downloadHtmlCard = () => {
    // 獨立的 Icon 組件定義，避免依賴外部
    const iconsScript = `
      const IconHeart = ({ size = 24, className, fill = "none", ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        </svg>
      );
      const IconChevronLeft = ({ size = 24, className, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
          <path d="m15 18-6-6 6-6"/>
        </svg>
      );
      const IconChevronRight = ({ size = 24, className, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
          <path d="m9 18 6-6-6-6"/>
        </svg>
      );
      const IconImage = ({ size = 24, className, ...props }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
          <circle cx="9" cy="9" r="2"/>
          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
        </svg>
      );
    `;

    const viewerScript = `
      ${iconsScript}
      
      const { useState, useEffect, useRef } = React;
      const { createRoot } = ReactDOM;
      // Handle UMD Framer Motion export name differences
      const MotionLib = window.Motion || window.framerMotion;
      const { motion, AnimatePresence } = MotionLib || { motion: { div: 'div', button: 'button' }, AnimatePresence: ({children}) => children };

      // Safe Data Loading from hidden script tag
      let APP_DATA = {};
      try {
        const dataElement = document.getElementById('app-data');
        if (dataElement) {
           APP_DATA = JSON.parse(dataElement.textContent);
        }
      } catch(e) {
        console.error("Data parse error", e);
      }
      
      const { config, photos } = APP_DATA;

      const RoseDecoration = ({ className }) => (
        <svg viewBox="0 0 100 100" className={className} fill="currentColor">
          <path d="M50 50c0-15 10-25 25-25s25 10 25 25-10 25-25 25-25-10-25-25z" opacity="0.2" />
          <path d="M50 50c-15 0-25-10-25-25s10-25 25-25 25 10 25 25-10 25-25 25z" opacity="0.3" />
          <circle cx="50" cy="50" r="10" className="text-rose-400" />
          <path d="M50 60c0 10-5 20-15 20s-15-10-15-20 5-20 15-20 15 10 15 20z" opacity="0.2" />
        </svg>
      );

      const PhotoWithBubble = ({ src, caption, bubbleColor, filter, font, transform }) => (
        <div className="relative group p-1 sm:p-2">
          <div className="relative w-full aspect-square rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-lg bg-rose-50 border-2 border-white">
            {src ? (
              <img 
                src={src} 
                className={\`w-full h-full object-cover \${filter}\`}
                style={{
                   transform: \`scale(\${transform.zoom}) translate(\${transform.x / transform.zoom}px, \${transform.y / transform.zoom}px)\`,
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-rose-200">
                <IconImage size={28} />
              </div>
            )}
          </div>
          {caption && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{ fontFamily: font }}
              className={\`absolute -top-2 -right-1 p-2 rounded-xl text-[10px] sm:text-[12px] shadow-xl border border-white/50 max-w-[100px] sm:max-w-[130px] break-words z-10
                \${bubbleColor === 'pink' ? 'bg-rose-100/95 text-rose-600' : 
                  bubbleColor === 'blue' ? 'bg-sky-100/95 text-sky-600' : 'bg-white/95 text-slate-600'}
              \`}
            >
              {caption}
              <div className={\`absolute -bottom-1 left-3 w-2 h-2 rotate-45 
                \${bubbleColor === 'pink' ? 'bg-rose-100/95' : bubbleColor === 'blue' ? 'bg-sky-100/95' : 'bg-white/95'}
              \`} />
            </motion.div>
          )}
        </div>
      );

      const ViewerApp = () => {
        const [currentPage, setCurrentPage] = useState(0);

        useEffect(() => {
          // Remove loader on mount
          const loader = document.getElementById('initial-loader');
          if (loader) loader.style.display = 'none';
        }, []);

        const nextPage = () => setCurrentPage(p => p < 3 ? p + 1 : 0);
        const prevPageAction = () => setCurrentPage(p => Math.max(0, p - 1));

        if (!config || !photos) {
           return <div className="h-screen flex items-center justify-center text-rose-500 font-bold p-4 text-center">
             資料載入失敗 (Data Load Failed)<br/>
             <span className="text-sm font-normal text-slate-500">可能原因：檔案不完整或記憶體不足</span>
           </div>;
        }

        return (
          <div className="relative min-h-[100vh] w-full bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center p-0 overflow-hidden font-['Noto_Serif_TC']" style={{ fontFamily: config.font }}>
            
             <svg width="0" height="0" className="absolute">
              <defs>
                <clipPath id="heartClip" clipPathUnits="objectBoundingBox">
                  <path d="M0.5,0.89 L0.44,0.835 C0.175,0.594,0,0.437,0,0.246 C0,0.091,0.121,0,0.275,0 C0.363,0,0.446,0.041,0.5,0.106 C0.554,0.041,0.638,0,0.725,0 C0.879,0,1,0.091,1,0.246 C1,0.437,0.825,0.594,0.56,0.835 L0.5,0.89 Z" />
                </clipPath>
              </defs>
            </svg>

            <div className="relative z-10 w-full max-w-[1600px] h-full flex flex-col items-center justify-center">
              
              <AnimatePresence>
                {currentPage > 0 && (
                  <>
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={prevPageAction} className="absolute left-2 lg:left-10 z-50 p-2 text-rose-400 drop-shadow-md hover:text-rose-600 transition-colors">
                      <IconChevronLeft size={60} strokeWidth={1} />
                    </motion.button>
                    <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={nextPage} className="absolute right-2 lg:right-10 z-50 p-2 text-rose-400 drop-shadow-md hover:text-rose-600 transition-colors">
                      <IconChevronRight size={60} strokeWidth={1} />
                    </motion.button>
                  </>
                )}
              </AnimatePresence>

              <div 
                className="perspective-2000 transition-all duration-700 transform-gpu"
                style={{ 
                  width: 'min(520px, 94vw)', 
                  height: 'min(820px, 92vh)' 
                }} 
              >
                <motion.div 
                  className="relative w-full h-full preserve-3d"
                  animate={{ rotateY: currentPage > 0 ? -180 : 0 }}
                  transition={{ type: "spring", stiffness: 40, damping: 15 }}
                >
                  {/* Cover */}
                  <div className="absolute inset-0 backface-hidden z-20 cursor-pointer" onClick={() => setCurrentPage(1)}>
                    <div className="w-full h-full bg-rose-500 rounded-[3.5rem] shadow-2xl flex flex-col items-center justify-center p-10 border-[12px] border-white/10 overflow-hidden relative group">
                      <RoseDecoration className="absolute -top-10 -left-10 w-64 h-64 text-white opacity-10" />
                      <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="mb-8 z-10">
                        <IconHeart fill="white" className="text-white drop-shadow-2xl" size={100} />
                      </motion.div>
                      <h1 className="text-white text-3xl lg:text-5xl font-bold font-['Ma_Shan_Zheng'] mb-10 tracking-[0.2em] text-center leading-tight z-10 drop-shadow-md">
                        {config.coverTitle}
                      </h1>
                      <div className="px-10 py-3 bg-white/20 backdrop-blur-md rounded-full text-white font-bold flex items-center gap-4 border border-white/40 shadow-xl z-10 group-hover:bg-white/30 transition-all">
                        點擊開啟回憶 <IconChevronRight size={22} />
                      </div>
                    </div>
                  </div>

                  {/* Back of Cover */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180 z-10">
                    <div className="w-full h-full bg-white rounded-[3.5rem] shadow-inner border-l-[25px] border-rose-100" />
                  </div>
                </motion.div>

                {/* Inner Pages */}
                <div className={\`absolute inset-0 transition-all duration-700 \${currentPage > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}\`}>
                  <div className="w-full h-full bg-white rounded-[3.5rem] shadow-2xl border border-rose-50 p-6 sm:p-10 flex flex-col overflow-hidden relative">
                    
                    <AnimatePresence mode="wait">
                      {currentPage === 1 && (
                        <motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center text-center z-10 h-full">
                          <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-6 mt-2 shrink-0 shadow-xl rounded-full">
                            <div 
                              className="w-full h-full bg-rose-50 overflow-hidden flex items-center justify-center border-4 border-white"
                              style={{ clipPath: "url(#heartClip)" }}
                            >
                              {photos[0].src ? (
                                <img 
                                  src={photos[0].src} 
                                  className={\`w-full h-full object-cover origin-center \${config.filter}\`}
                                  style={{ 
                                    transform: \`scale(\${photos[0].zoom}) translate(\${photos[0].x / photos[0].zoom}px, \${photos[0].y / photos[0].zoom}px)\`
                                  }}
                                />
                              ) : (
                                <IconHeart size={48} className="text-rose-200" />
                              )}
                            </div>
                          </div>
                          
                          <h3 className="text-rose-500 font-bold text-2xl sm:text-3xl mb-4 border-b-2 border-rose-50 pb-2 px-6 inline-block tracking-widest font-['Ma_Shan_Zheng'] shrink-0">
                            致：{config.toName}
                          </h3>
                          
                          <div className="flex-1 overflow-y-auto custom-scrollbar px-2 sm:px-6 w-full text-center mb-6">
                            <p className="text-slate-700 leading-relaxed italic text-lg sm:text-2xl font-medium pb-8" style={{ fontFamily: config.font }}>
                              「{config.intro}」
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {(currentPage === 2 || currentPage === 3) && (
                        <motion.div key={\`p\${currentPage}\`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col pt-2 z-10 h-full">
                          <div className="grid grid-cols-2 gap-3 sm:gap-6 flex-1 overflow-y-auto custom-scrollbar pr-1">
                            {(currentPage === 2 ? [1, 2, 3] : [4, 5, 6]).map((idx, i) => (
                              <div key={\`photo-\${idx}\`} className={i === 2 ? 'col-span-2' : ''}>
                                <PhotoWithBubble 
                                  src={photos[idx].src} 
                                  caption={photos[idx].caption}
                                  bubbleColor={config.bubbleColor}
                                  filter={config.filter}
                                  font={config.font}
                                  transform={{ x: photos[idx].x, y: photos[idx].y, zoom: photos[idx].zoom }}
                                />
                              </div>
                            ))}
                          </div>
                          <div className="text-center py-4 text-rose-300 text-[10px] tracking-[0.4em] font-bold shrink-0">
                            CHAPTER • {currentPage === 2 ? 'TWO' : 'THREE'}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Pagination Dots */}
                    <div className="mt-auto flex justify-center gap-3 pt-4 z-20 shrink-0 border-t border-rose-50">
                      {[0, 1, 2, 3].map(p => (
                        <div key={p} onClick={() => setCurrentPage(p)} className={\`h-1.5 transition-all duration-300 cursor-pointer rounded-full \${currentPage === p ? 'bg-rose-500 w-8' : 'bg-rose-100 w-2'}\`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      };

      try {
        const root = createRoot(document.getElementById('root'));
        root.render(<ViewerApp />);
      } catch (e) {
        document.body.innerHTML = '<div style="color:red;padding:20px">啟動錯誤：' + e.message + '</div>';
      }
    `;

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${config.coverTitle} - 專屬回憶</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Long+Cang&family=Ma+Shan+Zheng&family=Noto+Sans+TC:wght@400;700&family=Noto+Serif+TC:wght@400;700&family=Zhi+Mang+Xing&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; overflow: hidden; background: #fff1f2; }
    .perspective-2000 { perspective: 3500px; }
    .preserve-3d { transform-style: preserve-3d; }
    .backface-hidden { backface-visibility: hidden; }
    .rotate-y-180 { transform: rotateY(180deg); }
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #fda4af; border-radius: 10px; }
    
    /* Loading Spinner */
    #initial-loader {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: #fff1f2;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.5s;
    }
    .heart-pulse {
      animation: pulse 1.5s infinite;
      color: #f43f5e;
    }
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      50% { transform: scale(1.2); opacity: 1; }
      100% { transform: scale(1); opacity: 0.8; }
    }
  </style>
  
  <script>
    window.onerror = function(msg, url, line, col, error) {
      var loader = document.getElementById('initial-loader');
      if(loader) {
        loader.innerHTML = '<div style="color:red;padding:20px;text-align:center;max-width:300px"><h3>發生錯誤 (Error)</h3><p style="font-size:12px">' + msg + '</p><p style="font-size:12px;margin-top:10px">請嘗試重新整理或使用電腦開啟。</p></div>';
      }
      return false;
    };
  </script>

  <!-- Dependencies: Use unpkg for broad compatibility -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <script crossorigin src="https://unpkg.com/framer-motion@10.16.4/dist/framer-motion.js"></script>

  <script>
    window.React = React;
    window.ReactDOM = ReactDOM;
    // Safety timeout: If React doesn't load in 8 seconds, show error
    setTimeout(function() {
        var loader = document.getElementById('initial-loader');
        if (loader && loader.style.display !== 'none') {
             loader.innerHTML = '<div style="color:#f43f5e;padding:20px;text-align:center"><h3>載入逾時 (Timeout)</h3><p>網路連線可能不穩定，無法載入必要元件。</p></div>';
        }
    }, 8000);
  </script>
</head>
<body>
  <!-- Initial Loader (Visible until React mounts) -->
  <div id="initial-loader">
     <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="currentColor" class="heart-pulse">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
     </svg>
     <p style="margin-top:20px; color:#fb7185; font-family:sans-serif; font-size:14px;">Loading Memories...</p>
  </div>

  <div id="root"></div>
  
  <!-- Use a JSON script tag to avoid JS parsing limits on mobile for large base64 strings -->
  <script type="application/json" id="app-data">
    ${JSON.stringify({ config, photos })}
  </script>

  <script type="text/babel" data-presets="react,env">
    ${viewerScript}
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `love-diary-full-card.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center p-0 overflow-hidden font-['Noto_Serif_TC']" style={{ fontFamily: config.font }}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />

      <svg width="0" height="0" className="absolute">
        <defs>
          <clipPath id="heartClip" clipPathUnits="objectBoundingBox">
            <path d="M0.5,0.89 L0.44,0.835 C0.175,0.594,0,0.437,0,0.246 C0,0.091,0.121,0,0.275,0 C0.363,0,0.446,0.041,0.5,0.106 C0.554,0.041,0.638,0,0.725,0 C0.879,0,1,0.091,1,0.246 C1,0.437,0.825,0.594,0.56,0.835 L0.5,0.89 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className={`relative z-10 w-full max-w-[1600px] h-full flex flex-col lg:flex-row gap-0 lg:gap-8 items-center justify-center`}>
        
        {/* --- 側邊編輯面板 --- */}
        <AnimatePresence>
          {isEditorOpen && !isViewOnly && (
            <motion.div 
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              className="fixed lg:relative left-0 top-0 z-[100] w-full sm:w-[380px] h-full lg:h-[88dvh] bg-white/95 backdrop-blur-2xl lg:rounded-[3rem] p-6 sm:p-8 shadow-2xl border-r lg:border border-white overflow-y-auto custom-scrollbar flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 font-['Ma_Shan_Zheng']">
                <h2 className="text-2xl font-bold text-rose-600 flex items-center gap-2">
                  <Settings size={24} /> 編輯模式
                </h2>
                <button onClick={() => setIsEditorOpen(false)} className="lg:hidden p-2 text-rose-400">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                <section className="space-y-3">
                  <div className="text-rose-500 font-bold text-xs uppercase tracking-widest border-b border-rose-100 pb-1">字體與樣式</div>
                  <div className="relative">
                    <select 
                      value={config.font} 
                      onChange={(e) => setConfig({...config, font: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl bg-rose-50/40 text-sm outline-none appearance-none cursor-pointer"
                      style={{ fontFamily: config.font }}
                    >
                      {FONTS.map(f => (
                        <option key={f.name} value={f.name} style={{ fontFamily: f.name }}>{f.label}</option>
                      ))}
                    </select>
                    <Type size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-300 pointer-events-none" />
                  </div>
                </section>

                <section className="space-y-3">
                  <div className="text-rose-500 font-bold text-xs uppercase tracking-widest border-b border-rose-100 pb-1">文字設定</div>
                  <input type="text" value={config.coverTitle} onChange={e => setConfig({...config, coverTitle: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-rose-50/40 text-sm outline-none" placeholder="封面標題" />
                  <input type="text" value={config.toName} onChange={e => setConfig({...config, toName: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-rose-50/40 text-sm outline-none" placeholder="致：誰" />
                  <textarea value={config.intro} onChange={e => setConfig({...config, intro: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-rose-50/40 text-sm outline-none resize-none" rows={3} placeholder="首頁感言" />
                </section>

                <section className="space-y-3">
                  <div className="flex justify-between items-end border-b border-rose-100 pb-1">
                     <div className="text-rose-500 font-bold text-xs uppercase tracking-widest">上傳回憶</div>
                     <div className="text-[9px] text-slate-400">
                       推薦使用連結，檔案更小
                     </div>
                  </div>
                  
                  <div className="space-y-3">
                    {photos.map((photo, i) => (
                      <div key={`edit-${i}`} className={`bg-white p-3 rounded-2xl border flex flex-col gap-2 shadow-sm transition-colors ${adjustingPhotoIndex === i ? 'border-rose-500 bg-rose-50' : 'border-rose-50'}`}>
                        <div className="flex gap-3 items-center">
                            {/* Input Area */}
                            {!urlInputModes[i] ? (
                                <label className="relative w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center cursor-pointer overflow-hidden shrink-0 border-2 border-dashed border-rose-100 hover:border-rose-400 transition-colors">
                                {photo.src ? <img src={photo.src} className="w-full h-full object-cover" alt="thumb" /> : <Upload size={18} className="text-rose-300" />}
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(i, e)} />
                                </label>
                            ) : (
                                <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100 overflow-hidden">
                                    {photo.src ? <img src={photo.src} className="w-full h-full object-cover" alt="thumb" /> : <LinkIcon size={18} className="text-rose-300" />}
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="text-[9px] text-rose-400 font-bold">{i === 0 ? "★ 封面大圖" : `回憶 ${i}`}</p>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => toggleInputMode(i)} 
                                            className="text-[9px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                                            title="切換上傳模式/連結模式"
                                        >
                                            {urlInputModes[i] ? '改用上傳' : '改用連結'}
                                        </button>
                                        {photo.src && (
                                            <button 
                                            onClick={() => adjustingPhotoIndex === i ? setAdjustingPhotoIndex(null) : startAdjusting(i)}
                                            className={`text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-colors ${adjustingPhotoIndex === i ? 'bg-rose-500 text-white' : 'bg-gray-100 text-gray-500 hover:bg-rose-100 hover:text-rose-500'}`}
                                            >
                                            {adjustingPhotoIndex === i ? <Check size={10} /> : <Move size={10} />}
                                            {adjustingPhotoIndex === i ? '完成' : '調整'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {urlInputModes[i] ? (
                                    <input 
                                        type="text" 
                                        placeholder="貼上圖片網址 (https://...)" 
                                        className="w-full text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 mb-1 outline-none focus:border-rose-300"
                                        value={photo.src && photo.src.startsWith('http') ? photo.src : ''}
                                        onChange={(e) => handleUrlInput(i, e.target.value)}
                                    />
                                ) : null}
                                <input type="text" value={photo.caption} onChange={(e) => {
                                    const newPhotos = [...photos];
                                    newPhotos[i].caption = e.target.value;
                                    setPhotos(newPhotos);
                                }} placeholder="小對白..." className="w-full text-xs bg-transparent border-b border-rose-50 outline-none pb-1" />
                            </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="pt-6 border-t border-rose-100 space-y-3">
                <div className="bg-rose-50 p-4 rounded-xl">
                  <h3 className="text-xs font-bold text-rose-500 mb-2 flex items-center gap-2">
                    <Share2 size={14} /> 分享給他人
                  </h3>
                  
                  {shareUrl ? (
                     <div className="flex flex-col gap-2">
                       <div className="text-[10px] bg-white p-2 rounded border border-rose-200 break-all h-16 overflow-y-auto">
                         {shareUrl}
                       </div>
                       <div className="flex items-center gap-2 text-[10px] text-green-600 font-bold">
                         <Check size={12} /> 已複製到剪貼簿！
                       </div>
                       <button onClick={() => setShareUrl('')} className="text-[10px] text-rose-400 underline self-start">重置</button>
                     </div>
                  ) : (
                    <div className="space-y-3">
                         {/* Option: HTML Card (Primary) */}
                         <div className="bg-white p-3 rounded-lg border border-rose-100 shadow-sm relative overflow-hidden">
                            <div className="flex items-center justify-between mb-2">
                                <div className="text-[11px] font-bold text-slate-700">下載互動卡片 (推薦 ✨)</div>
                                <span className="bg-rose-100 text-rose-600 text-[9px] px-1.5 py-0.5 rounded">獨立檔案</span>
                            </div>
                            <p className="text-[9px] text-slate-400 mb-2">
                                這是最完美的分享方式。包含所有照片，對方打開即看，無需連網，永久保存。
                            </p>
                            <button onClick={downloadHtmlCard} className="w-full py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                <Download size={14} /> 下載完整回憶卡片 (.html)
                            </button>
                         </div>

                         {/* Option: Link (Secondary) - Disabled if data too large */}
                         <div className="text-center">
                            {hasLocalImages ? (
                                <div className="text-[9px] text-slate-400 bg-slate-100 p-2 rounded">
                                    <span className="flex items-center justify-center gap-1 text-slate-500 mb-1 font-bold"><AlertCircle size={10} /> 網址分享已停用</span>
                                    <p>因為您上傳了本地圖片，資料量過大無法產生短連結。請務必使用上方的「下載卡片」功能。</p>
                                </div>
                            ) : (
                                <button onClick={generateShareLink} className="text-[10px] text-rose-400 hover:text-rose-600 underline flex items-center justify-center gap-1 mx-auto">
                                    <Copy size={12} /> 複製純文字/連結分享網址
                                </button>
                            )}
                            
                            {shareError && (
                                <div className="mt-1 text-[9px] text-red-500 flex items-center justify-center gap-1">
                                <AlertCircle size={10} /> {shareError}
                                </div>
                            )}
                         </div>
                    </div>
                  )}
                </div>

                <button onClick={() => setIsViewOnly(true)} className="w-full py-3 bg-white text-rose-500 border border-rose-200 rounded-xl font-bold text-sm shadow-sm hover:bg-rose-50 transition-colors">
                   預覽觀賞模式
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- 日記本主區塊 --- */}
        <div className={`relative flex-1 flex items-center justify-center transition-all duration-700 h-[100dvh] w-full px-4`}>
          
          {/* 側邊切換按鈕 */}
          {!isViewOnly && !isEditorOpen && (
            <button onClick={() => setIsEditorOpen(true)} className="fixed left-6 bottom-10 z-50 p-4 bg-rose-500 text-white rounded-full shadow-2xl hover:bg-rose-600 transition-colors">
              <Edit3 size={24} />
            </button>
          )}

          {/* 左右翻頁箭頭 */}
          <AnimatePresence>
            {currentPage > 0 && (
              <>
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={prevPageAction} className="absolute left-2 lg:left-[-60px] z-50 p-2 text-rose-400 drop-shadow-md hover:text-rose-600 transition-colors">
                  <ChevronLeft size={60} strokeWidth={1} />
                </motion.button>
                <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={nextPage} className="absolute right-2 lg:right-[-60px] z-50 p-2 text-rose-400 drop-shadow-md hover:text-rose-600 transition-colors">
                  <ChevronRight size={60} strokeWidth={1} />
                </motion.button>
              </>
            )}
          </AnimatePresence>

          {/* 日記主體：調整高度適應手機滿版 */}
          <div 
            className={`perspective-2000 transition-all duration-700 transform-gpu ${!isEditorOpen || isViewOnly ? 'scale-100' : 'scale-[0.8] lg:scale-100'}`}
            style={{ 
              width: 'min(520px, 94vw)', 
              height: 'min(820px, 92dvh)' 
            }} 
            ref={diaryRef}
          >
            <motion.div 
              className="relative w-full h-full preserve-3d"
              animate={{ rotateY: currentPage > 0 ? -180 : 0 }}
              transition={{ type: "spring", stiffness: 40, damping: 15 }}
            >
              {/* 封面 */}
              <div className="absolute inset-0 backface-hidden z-20 cursor-pointer" onClick={() => setCurrentPage(1)}>
                <div className="w-full h-full bg-rose-500 rounded-[3.5rem] shadow-2xl flex flex-col items-center justify-center p-10 border-[12px] border-white/10 overflow-hidden relative group">
                  <RoseDecoration className="absolute -top-10 -left-10 w-64 h-64 text-white opacity-10" />
                  <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 4 }} className="mb-8 z-10">
                    <Heart fill="white" className="text-white drop-shadow-2xl" size={100} />
                  </motion.div>
                  <h1 className="text-white text-3xl lg:text-5xl font-bold font-['Ma_Shan_Zheng'] mb-10 tracking-[0.2em] text-center leading-tight z-10 drop-shadow-md">
                    {config.coverTitle}
                  </h1>
                  <div className="px-10 py-3 bg-white/20 backdrop-blur-md rounded-full text-white font-bold flex items-center gap-4 border border-white/40 shadow-xl z-10 group-hover:bg-white/30 transition-all">
                    點擊開啟回憶 <ChevronRight size={22} />
                  </div>
                </div>
              </div>

              {/* 封面背面 */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 z-10">
                <div className="w-full h-full bg-white rounded-[3.5rem] shadow-inner border-l-[25px] border-rose-100" />
              </div>
            </motion.div>

            {/* 內頁 */}
            <div className={`absolute inset-0 transition-all duration-700 ${currentPage > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="w-full h-full bg-white rounded-[3.5rem] shadow-2xl border border-rose-50 p-6 sm:p-10 flex flex-col overflow-hidden relative">
                
                <AnimatePresence mode="wait">
                  {currentPage === 1 && (
                    <motion.div key="p1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center text-center z-10 h-full">
                      {/* 調整：縮小圖片比例以釋放空間給文字 */}
                      <div className="relative w-48 h-48 sm:w-64 sm:h-64 mb-6 mt-2 shrink-0 shadow-xl rounded-full">
                        <div 
                          className={`w-full h-full bg-rose-50 overflow-hidden flex items-center justify-center border-4 border-white transition-all ${adjustingPhotoIndex === 0 ? 'border-rose-400 ring-4 ring-rose-200' : ''}`}
                          style={{ clipPath: "url(#heartClip)" }}
                        >
                          {photos[0].src ? (
                            <img 
                              src={photos[0].src} 
                              alt="Hero"
                              draggable={false}
                              onMouseDown={adjustingPhotoIndex === 0 ? handlePhotoMouseDown : undefined}
                              onWheel={adjustingPhotoIndex === 0 ? handlePhotoWheel : undefined}
                              style={{ 
                                transform: `scale(${photos[0].zoom}) translate(${photos[0].x / photos[0].zoom}px, ${photos[0].y / photos[0].zoom}px)`,
                                transition: adjustingPhotoIndex === 0 ? 'none' : 'transform 0.1s ease-out',
                                cursor: adjustingPhotoIndex === 0 ? 'move' : 'default'
                              }}
                              className={`w-full h-full object-cover origin-center will-change-transform ${config.filter}`} 
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-rose-200">
                                <Heart size={48} className="animate-pulse" />
                            </div>
                          )}
                        </div>
                         {adjustingPhotoIndex === 0 && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-black/60 text-white text-[10px] px-2 py-1 rounded-t-lg backdrop-blur-md whitespace-nowrap">
                              拖曳移動 • 滾輪縮放
                            </div>
                         )}
                         {adjustingPhotoIndex === 0 && (
                          <button onClick={() => setAdjustingPhotoIndex(null)} className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-rose-600 text-white px-4 py-1.5 rounded-full shadow-xl z-20 flex items-center gap-2 text-xs">
                            <Check size={14} /> 完成選取
                          </button>
                        )}
                      </div>
                      
                      <h3 className="text-rose-500 font-bold text-2xl sm:text-3xl mb-4 border-b-2 border-rose-50 pb-2 px-6 inline-block tracking-widest font-['Ma_Shan_Zheng'] shrink-0">
                        致：{config.toName}
                      </h3>
                      
                      {/* 調整：擴大感言區塊，並增加底部安全邊距 */}
                      <div className="flex-1 overflow-y-auto custom-scrollbar px-2 sm:px-6 w-full text-center mb-6">
                        <p className="text-slate-700 leading-relaxed italic text-lg sm:text-2xl font-medium pb-8" style={{ fontFamily: config.font }}>
                          「{config.intro}」
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {(currentPage === 2 || currentPage === 3) && (
                    <motion.div key={`p${currentPage}`} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 flex flex-col pt-2 z-10 h-full">
                      <div className="grid grid-cols-2 gap-3 sm:gap-6 flex-1 overflow-y-auto custom-scrollbar pr-1">
                        {(currentPage === 2 ? [1, 2, 3] : [4, 5, 6]).map((idx, i) => (
                          <div key={`photo-${idx}`} className={i === 2 ? 'col-span-2' : ''}>
                            <PhotoWithBubble 
                              src={photos[idx].src} 
                              caption={photos[idx].caption}
                              bubbleColor={config.bubbleColor}
                              filter={config.filter}
                              font={config.font}
                              transform={{ x: photos[idx].x, y: photos[idx].y, zoom: photos[idx].zoom }}
                              isAdjusting={adjustingPhotoIndex === idx}
                              onMouseDown={handlePhotoMouseDown}
                              onWheel={handlePhotoWheel}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="text-center py-4 text-rose-300 text-[10px] tracking-[0.4em] font-bold shrink-0">
                        CHAPTER • {currentPage === 2 ? 'TWO' : 'THREE'}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 頁碼導航燈 */}
                <div className="mt-auto flex justify-center gap-3 pt-4 z-20 shrink-0 border-t border-rose-50">
                  {[0, 1, 2, 3].map(p => (
                    <div key={p} onClick={() => setCurrentPage(p)} className={`h-1.5 transition-all duration-300 cursor-pointer rounded-full ${currentPage === p ? 'bg-rose-500 w-8' : 'bg-rose-100 w-2'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 預覽模式返回按鈕 (如果網址是分享網址，則不顯示返回按鈕，保持純淨) */}
        {isViewOnly && !window.location.hash && !window.location.search.includes('mode=view') && (
          <button onClick={() => setIsViewOnly(false)} className="fixed top-6 right-6 z-[100] px-6 py-2.5 bg-white/90 text-rose-500 rounded-full shadow-xl font-bold border border-rose-100 flex items-center gap-2 hover:bg-white transition-colors">
            <Edit3 size={18} /> 返回編輯模式
          </button>
        )}

        {/* 如果是分享模式，顯示一個小的提示 */}
        {(window.location.hash || window.location.search.includes('mode=view')) && (
           <div className="fixed bottom-4 right-4 z-50 text-[10px] text-rose-300 opacity-50 pointer-events-none">
             Read Only Mode
           </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-2000 { perspective: 3500px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #fda4af; border-radius: 10px; }
        html, body { height: 100%; overscroll-behavior: none; }
      `}} />
    </div>
  );
};

export default App;