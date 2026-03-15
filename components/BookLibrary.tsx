import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, BookOpen, PenLine, Lock, Sparkles, ChevronLeft, ChevronRight, Loader2, AlertCircle, Home, ArrowLeft, Maximize, Minimize } from 'lucide-react';
// @ts-ignore - pdfjs-dist legacy para mejor compatibilidad
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Usar worker local
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

const STORAGE_KEY = 'obsidiana_book_progress';
const BITACORAS_KEY = 'obsidiana_bitacoras';

// --- HOOKS ---
const useBookProgress = () => {
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const page = parseInt(saved, 10);
      if (!isNaN(page) && page > 0) setCurrentPage(page);
    }
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    localStorage.setItem(STORAGE_KEY, page.toString());
  }, []);

  return { currentPage, handlePageChange };
};

// --- COMPONENTE VISOR PDF ---
const PDFViewer: React.FC<{
  url: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  setTotalPages: (pages: number) => void;
  totalPages: number;
}> = ({ url, currentPage, onPageChange, setTotalPages, totalPages }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showingCover, setShowingCover] = useState(true);
  const [scale, setScale] = useState(() => {
    const width = typeof window !== 'undefined' ? window.innerWidth : 800;
    // Corregido: se elimina la división por pixelRatio que hacía ilegible el PDF en móviles.
    if (width < 480) return 0.6;
    if (width < 768) return 0.9;
    if (width < 1024) return 1.2;
    return 1.4;
  });

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.25));

  // Touch gestures handling
  const lastTouchDistance = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
      touchStartX.current = null;
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
      touchEndX.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const diff = distance - lastTouchDistance.current;
      if (Math.abs(diff) > 5) {
        setScale(prev => {
          const newScale = prev + (diff > 0 ? 0.08 : -0.08);
          return Math.max(0.4, Math.min(4, newScale));
        });
        lastTouchDistance.current = distance;
      }
      if (e.cancelable) e.preventDefault();
    } else if (e.touches.length === 1 && touchStartX.current !== null) {
      touchEndX.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    lastTouchDistance.current = null;
    // Detectar swipe si el zoom no es muy grande (para no interferir con el pan del canvas)
    if (touchStartX.current !== null && touchEndX.current !== null && scale <= 1.5) {
      const distance = touchEndX.current - touchStartX.current;
      if (distance > 50 && currentPage > 1) {
        onPageChange(currentPage - 1); // Swipe derecha -> Anterior
      } else if (distance < -50 && currentPage < totalPages) {
        onPageChange(currentPage + 1); // Swipe izquierda -> Siguiente
      }
    }
    touchStartX.current = null;
    touchEndX.current = null;
    touchStartY.current = null;
  };

  // Zonas de tap para cambiar de página fácilmente en móvil
  const handleEdgeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX } = e;
    const { innerWidth } = window;
    const edgeMargin = innerWidth * 0.2; // 20% de los bordes para cambiar de página
    if (clientX < edgeMargin && currentPage > 1) {
      onPageChange(currentPage - 1);
    } else if (clientX > innerWidth - edgeMargin && currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // 1. Cargar el documento
  useEffect(() => {
    let cancelled = false;
    
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadingProgress(0);
        console.log("Cargando PDF desde:", url);

        const loadingTask = pdfjsLib.getDocument(url);
        
        // Monitor progress
        loadingTask.onProgress = (progress: any) => {
          if (!cancelled && progress.total > 0) {
            setLoadingProgress(Math.round((progress.loaded / progress.total) * 100));
          }
        };

        const pdf = await loadingTask.promise;
        
        if (!cancelled) {
          console.log("PDF cargado, páginas:", pdf.numPages);
          setPdfDoc(pdf);
          setTotalPages(pdf.numPages);
          setLoadingProgress(100);
          // Small delay for visual feedback
          setTimeout(() => {
            setIsLoading(false);
          }, 500);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("Error en PDFViewer:", err);
          setError("No se pudo encontrar el libro. Verifica que el archivo esté en public/books/libro.pdf");
          setIsLoading(false);
        }
      }
    };
    
    loadPdf();
    
    return () => {
      cancelled = true;
    };
  }, [url]);

  // 2. Renderizar la página
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || totalPages === 0) return;

    let cancelled = false;

    const renderPage = async () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // Ignore cancel errors
        }
      }

      setIsRendering(true);
      
      try {
        console.log("Renderizando página:", currentPage, "scale:", scale);
        const page = await pdfDoc.getPage(currentPage);
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        
        const context = canvas.getContext('2d', { willReadFrequently: false });
        if (!context || cancelled) return;

        const viewport = page.getViewport({ scale });
        
        // Use devicePixelRatio for sharp text
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        context.scale(pixelRatio, pixelRatio);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        
        if (!cancelled) {
          console.log("Página renderizada exitosamente");
        }
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException' && !cancelled) {
          console.error("Error al renderizar página:", err);
        }
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [pdfDoc, currentPage, scale, totalPages]);

  // Loading screen with premium visual feedback
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-[#F9F9F7] to-[#EDEDE8]">
        <div className="relative p-6 bg-white rounded-full shadow-2xl mb-8 border border-obsidian-100">
          <div className="absolute inset-0 bg-obsidian-100 rounded-full animate-ping opacity-20" />
          <Loader2 className="animate-spin text-obsidian-800 relative z-10" size={48} strokeWidth={1.5} />
          <BookOpen className="text-obsidian-600 absolute inset-0 m-auto" size={22} />
        </div>
        
        <div className="text-center space-y-3 px-6 max-w-sm">
          <h3 className="font-serif text-2xl text-obsidian-900 italic font-medium tracking-wide">El Despertar de Osiris</h3>
          <p className="text-obsidian-500 font-medium">Sintonizando frecuencia... pág. {currentPage}</p>
        </div>
        
        <div className="mt-10 w-64 h-2 bg-obsidian-100/80 rounded-full overflow-hidden shadow-inner border border-obsidian-200/50">
          <div 
            className="h-full bg-gradient-to-r from-obsidian-600 to-obsidian-800 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(30,41,59,0.5)]"
            style={{ width: `${Math.max(5, loadingProgress)}%` }}
          />
        </div>
        <p className="mt-4 text-xs font-bold tracking-widest text-obsidian-400 uppercase">{loadingProgress}% Completado</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center gap-4">
        <AlertCircle className="text-red-400" size={48} />
        <p className="text-obsidian-800 font-medium">{error}</p>
      </div>
    );
  }

  if (showingCover) {
    return (
      <div 
        className="relative h-full w-full flex flex-col bg-obsidian-900 justify-center items-center cursor-pointer overflow-hidden animate-fade-in" 
        onClick={() => setShowingCover(false)}
      >
        <div className="absolute inset-0 bg-[url('/portada.jpg')] bg-cover bg-center blur-3xl opacity-30 transform scale-110" />
        <img 
          src="/portada.jpg" 
          className="relative z-10 h-auto max-h-[85vh] w-auto max-w-[90vw] shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-md object-contain transition-transform duration-700 hover:scale-105" 
          alt="Portada" 
        />
        <div className="absolute bottom-10 z-20 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/20 text-white font-medium shadow-2xl animate-bounce flex items-center gap-2">
          <span>Toca para abrir en la pág. {currentPage}</span>
          <ChevronRight size={18} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full flex flex-col bg-[#EDEDE5] overflow-hidden" onClick={handleEdgeClick}>
      {/* Page loading overlay - moved to top so it's less intrusive */}
      {isRendering && (
        <div className="absolute top-4 right-4 z-[60] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg flex items-center gap-2 border border-obsidian-100">
          <Loader2 className="animate-spin text-obsidian-600" size={16} />
          <span className="text-sm font-medium text-obsidian-600">Delineando página...</span>
        </div>
      )}
      
      <div 
        className="flex-1 w-full h-full overflow-auto p-4 md:p-8 flex justify-center items-start scroll-smooth"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <div className="relative shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] bg-white transition-transform duration-200 mx-auto origin-top flex-shrink-0" style={{ transform: `scale(1)`, minWidth: 'fit-content' }}>
          <canvas ref={canvasRef} className="bg-white block touch-pan-x touch-pan-y" onContextMenu={(e) => e.preventDefault()} />
          <div className="absolute inset-0 z-10 touch-pan-x touch-pan-y" onContextMenu={(e) => e.preventDefault()} />
        </div>
      </div>

      {/* Controls: Fixed position visually stable and always on top */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 pointer-events-none flex justify-center z-[100] w-full max-w-[90%] md:max-w-[400px]">
        <div className="pointer-events-auto flex items-center justify-between gap-1 sm:gap-3 bg-obsidian-900/40 hover:bg-obsidian-900/80 backdrop-blur-md transition-colors duration-300 px-2 py-2 sm:px-4 rounded-full text-white shadow-[0_8px_30px_rgba(0,0,0,0.2)] border border-white/20 w-full">
          <button
            onClick={(e) => { e.stopPropagation(); zoomOut(); }}
            className="p-3 hover:bg-obsidian-700/60 rounded-full transition-all text-base font-bold active:scale-95"
            title="Alejar"
          >
            −
          </button>
          <div className="flex items-center gap-1 sm:gap-2 bg-obsidian-950/30 rounded-full p-1 border border-white/10">
            <button
              onClick={(e) => { e.stopPropagation(); onPageChange(currentPage - 1); }}
              disabled={currentPage <= 1 || isRendering}
              className="p-2 sm:p-3 hover:bg-obsidian-700/60 rounded-full disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="font-serif tracking-widest text-sm font-bold min-w-[60px] sm:min-w-[80px] text-center text-obsidian-50">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); onPageChange(currentPage + 1); }}
              disabled={currentPage >= totalPages || isRendering}
              className="p-2 sm:p-3 hover:bg-obsidian-700/60 rounded-full disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); zoomIn(); }}
            className="p-3 hover:bg-obsidian-700/60 rounded-full transition-all text-base font-bold active:scale-95"
            title="Acercar"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---
const BookLibrary: React.FC<{ isUnlocked: boolean; onUnlock?: () => void; onClose?: () => void }> = ({ isUnlocked, onUnlock, onClose }) => {
  const { currentPage, handlePageChange } = useBookProgress();
  const [totalPages, setTotalPages] = useState(0);
  const [showAnnotationModal, setShowAnnotationModal] = useState(false);
  const [annotationText, setAnnotationText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(
        document.fullscreenElement || 
        (document as any).webkitFullscreenElement || 
        (document as any).mozFullScreenElement || 
        (document as any).msFullscreenElement
      ));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const doc = document as any;
    const elem = (document.getElementById('obsidiana-reader-container') || document.documentElement) as any;

    if (!doc.fullscreenElement && !doc.webkitFullscreenElement && !doc.mozFullScreenElement && !doc.msFullscreenElement) {
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      }
    }
  };

  if (!isUnlocked) {
    return (
      <div className="fixed inset-0 bg-[#F5F5F0] flex items-center justify-center p-6 z-[100] animate-fade-in">
        <div className="max-w-md text-center space-y-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-obsidian-400 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <img src="/portada.jpg" alt="Portada" className="relative w-64 h-auto mx-auto rounded-lg shadow-2xl rotate-1 group-hover:rotate-0 transition-transform duration-700" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-serif font-bold text-obsidian-900 italic">El Despertar de Osiris</h1>
            <p className="text-obsidian-600 font-serif leading-relaxed text-lg">
              El mapa sagrado de tu inconsciente te espera. Desbloquea la guía completa de arquetipos.
            </p>
          </div>
          <button onClick={onUnlock} className="w-full py-5 bg-obsidian-800 text-white rounded-2xl font-bold shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95">
            <Lock size={20} /> Desbloquear Sabiduría $49.99
          </button>
        </div>
      </div>
    );
  }

  if (!isReading) {
    return (
      <div className="fixed inset-0 bg-[#F5F5F0] flex flex-col z-[50] animate-fade-in">
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-obsidian-100 shadow-sm z-30">
          <div className="flex items-center gap-2">
            {onClose && (
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg text-obsidian-600 transition-colors flex items-center gap-2" title="Ir al Inicio">
                <Home size={20} /> <span className="font-bold hidden sm:inline">Inicio</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <BookOpen className="text-obsidian-600" size={24} />
            <h2 className="font-serif font-bold text-obsidian-900">La Biblioteca</h2>
          </div>
          <div className="w-20" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-auto p-6 sm:p-10 flex flex-col items-center">
          <div className="max-w-4xl w-full">
            <h1 className="text-3xl font-serif font-bold text-obsidian-900 mb-8 border-b border-obsidian-200 pb-4">Tus Libros</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              
              <div 
                onClick={() => setIsReading(true)}
                className="bg-white rounded-2xl p-4 shadow-xl border border-obsidian-100 cursor-pointer hover:-translate-y-2 transition-transform duration-300 group"
              >
                <div className="aspect-[2/3] relative rounded-lg overflow-hidden mb-4 shadow-md bg-stone-200">
                  <img src="/portada.jpg" alt="El Despertar de Osiris" className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                <h3 className="font-serif font-bold text-lg text-obsidian-900 line-clamp-1">El Despertar de Osiris</h3>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-obsidian-500 text-sm">Progreso: Pág {currentPage}</p>
                </div>
                <button className="w-full mt-4 py-3 bg-obsidian-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 group-hover:bg-black transition-colors">
                  <BookOpen size={18} /> Continuar Leyendo
                </button>
              </div>

            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div id="obsidiana-reader-container" className="fixed inset-0 bg-[#F5F5F0] flex flex-col z-[50] animate-fade-in relative">
      <header className="h-16 flex items-center justify-between px-4 sm:px-6 bg-white border-b border-obsidian-100 shadow-sm z-30 relative shrink-0">
        <div className="flex items-center gap-1 sm:gap-3">
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg text-obsidian-600 transition-colors flex items-center gap-1" title="Ir al Dashboard">
              <Home size={20} /> <span className="hidden sm:inline font-bold text-sm">Inicio</span>
            </button>
          )}
          <div className="h-6 w-px bg-obsidian-200 mx-1" />
          <button onClick={() => setIsReading(false)} className="p-2 hover:bg-stone-100 rounded-lg text-obsidian-600 transition-colors flex items-center gap-1" title="Volver a la Biblioteca">
            <ArrowLeft size={20} /> <span className="hidden sm:inline font-bold text-sm">Biblioteca</span>
          </button>
        </div>
        
        <h2 className="font-serif font-bold text-obsidian-900 text-sm sm:text-base absolute left-1/2 -translate-x-1/2 pointer-events-none hidden md:block">
          El Despertar de Osiris
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 sm:px-3 sm:py-2 bg-obsidian-50 hover:bg-obsidian-100 rounded-xl text-obsidian-600 transition-colors flex items-center gap-2 border border-obsidian-200"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            <span className="hidden md:inline text-sm font-bold">{isFullscreen ? 'Salir' : 'Expandir'}</span>
          </button>

          <button
            onClick={() => setShowAnnotationModal(true)}
            className="bg-obsidian-800 text-white px-3 py-2 sm:px-4 rounded-xl text-sm font-bold border border-obsidian-800 flex items-center gap-2 hover:bg-black transition-colors shadow-sm"
          >
            <PenLine size={16} /> <span className="hidden lg:inline">Anotar Intuición</span>
          </button>
        </div>
      </header>

      <main className="flex-1 relative">
        <PDFViewer
          url="/books/libro.pdf"
          currentPage={currentPage}
          onPageChange={handlePageChange}
          setTotalPages={setTotalPages}
          totalPages={totalPages}
        />
      </main>

      {showAnnotationModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-obsidian-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-serif font-bold text-obsidian-900 flex items-center gap-2">
                <Sparkles size={18} className="text-obsidian-400" /> Revelación Pág. {currentPage}
              </h3>
              <button onClick={() => setShowAnnotationModal(false)} className="text-gray-400 hover:text-gray-600"><X /></button>
            </div>
            <textarea
              className="w-full h-40 bg-gray-50 rounded-2xl p-4 font-serif text-obsidian-800 focus:ring-2 focus:ring-obsidian-200 outline-none resize-none border-none shadow-inner"
              placeholder="¿Qué imagen ha surgido al leer?"
              value={annotationText}
              onChange={(e) => setAnnotationText(e.target.value)}
              autoFocus
            />
            <button
              disabled={!annotationText.trim() || isSaving}
              onClick={() => {
                setIsSaving(true);
                const saved = localStorage.getItem(BITACORAS_KEY);
                const bitacoras = saved ? JSON.parse(saved) : [];
                bitacoras.unshift({
                  id: Date.now().toString(),
                  date: new Date().toLocaleDateString(),
                  content: `[LIBRO Pág. ${currentPage}]: ${annotationText}`,
                  tags: ['Biblioteca']
                });
                localStorage.setItem(BITACORAS_KEY, JSON.stringify(bitacoras));
                setTimeout(() => {
                  setShowAnnotationModal(false);
                  setAnnotationText('');
                  setIsSaving(false);
                }, 500);
              }}
              className="w-full mt-6 py-4 bg-obsidian-800 text-white rounded-2xl font-bold hover:bg-black transition-all disabled:opacity-50"
            >
              {isSaving ? "Guardando..." : "Integrar a Bitácoras"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookLibrary;