import { useRef, useEffect, useMemo } from 'react';
import { gsap } from 'gsap';
import { ArrowLeft, RotateCcw, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Memory } from '@/types';

interface MemoryViewProps {
  memory: Memory;
  onBack: () => void;
}

export default function MemoryView({ memory, onBack }: MemoryViewProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const image = imageRef.current;
    const overlay = overlayRef.current;
    const controls = controlsRef.current;
    const title = titleRef.current;
    const text = textRef.current;
    if (!container || !image || !overlay || !controls || !title) return;

    const tl = gsap.timeline();

    tl.fromTo(container, { opacity: 0 }, { opacity: 1, duration: 0.5 });
    tl.fromTo(
      image,
      { scale: 1.15, opacity: 0 },
      { scale: 1, opacity: 1, duration: 2.5, ease: 'power2.out' },
      0
    );
    tl.fromTo(
      overlay,
      { opacity: 0.7 },
      { opacity: 0.25, duration: 3, ease: 'power2.out' },
      0.5
    );
    tl.fromTo(
      title,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 1.5, ease: 'power2.out' },
      1
    );
    if (text) {
      tl.fromTo(
        text,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out' },
        1.5
      );
    }
    tl.fromTo(
      controls,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1, ease: 'power2.out' },
      2
    );

    return () => { tl.kill(); };
  }, [memory]);

  const handleBack = () => {
    const tl = gsap.timeline({ onComplete: onBack });
    tl.to(containerRef.current, { opacity: 0, duration: 1, ease: 'power2.inOut' });
  };

  const isUserMemory = memory.id.startsWith('user-');
  const displayImage = memory.image || '/memory-childhood.jpg';

  const particles = useMemo(() => {
    return Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      width: 2 + Math.random() * 4,
      height: 2 + Math.random() * 4,
      left: Math.random() * 100,
      top: Math.random() * 100,
      floatDuration: 4 + Math.random() * 4,
      delay: Math.random() * 4,
    }));
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 overflow-hidden" style={{ zIndex: 50 }}>
      {/* Background image */}
      <div
        ref={imageRef}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${displayImage})` }}
      />

      {/* Silver liquid overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at center,
              transparent 30%,
              rgba(140, 190, 230, 0.15) 60%,
              rgba(100, 160, 210, 0.25) 100%
            )
          `,
          mixBlendMode: 'screen',
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(5, 8, 16, 0.7) 100%)' }}
      />

      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(184, 212, 232, 0.03) 2px, rgba(184, 212, 232, 0.03) 4px)',
        }}
      />

      {/* Title overlay */}
      <div
        ref={titleRef}
        className="absolute top-0 left-0 right-0 pt-6 md:pt-8 pb-12 md:pb-16 px-6 md:px-8"
        style={{ background: 'linear-gradient(to bottom, rgba(5, 8, 16, 0.6) 0%, transparent 100%)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div
              className={`font-cinzel text-base md:text-lg tracking-[0.2em] md:tracking-[0.3em] uppercase ${memory.emotion === 'warm' ? 'text-[#e8d5a3]' : 'text-[#7eb8d8]'}`}
              style={{
                textShadow: `0 0 20px ${memory.emotion === 'warm' ? 'rgba(232, 213, 163, 0.5)' : 'rgba(126, 184, 216, 0.5)'}`,
              }}
            >
              {memory.title}
            </div>
            <div className="font-cormorant text-xs md:text-sm italic text-white/50 mt-1 tracking-wider">
              {memory.subtitle} {memory.year ? `— ${memory.year}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Text card for user memories or default memories with description */}
      {(isUserMemory && memory.polishedText) || memory.description ? (
        <div
          ref={textRef}
          className="absolute inset-0 flex items-center justify-center p-6 pointer-events-none"
          style={{ zIndex: 10 }}
        >
          <div
            className="w-full max-w-md p-6 rounded-2xl backdrop-blur-md pointer-events-auto max-h-[60vh] overflow-y-auto"
            style={{
              background: 'rgba(10, 15, 30, 0.6)',
              border: '1px solid rgba(92, 176, 203, 0.15)',
              boxShadow: '0 0 40px rgba(100, 140, 180, 0.1)',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-[#5CB0CB]/60" />
              <span className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-[#5CB0CB]/50">
                {memory.description ? t('designPurposeLabel') : t('yourThought')}
              </span>
            </div>
            <p className="font-cormorant text-base md:text-lg text-white/85 leading-relaxed italic whitespace-pre-line">
              {memory.description || memory.polishedText}
            </p>
            {memory.originalText && !memory.description && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <span className="font-cinzel text-[9px] tracking-[0.15em] uppercase text-white/30">
                  {t('original')}
                </span>
                <p className="font-cormorant text-sm text-white/35 italic mt-1 line-through decoration-white/20">
                  {memory.originalText}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Controls */}
      <div
        ref={controlsRef}
        className="absolute bottom-0 left-0 right-0 pb-6 md:pb-8 pt-12 md:pt-16 px-6 md:px-8 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(5, 8, 16, 0.7) 0%, transparent 100%)', zIndex: 20 }}
      >
        <div className="flex items-center justify-center gap-8 md:gap-12 pointer-events-auto">
          <button
            onClick={handleBack}
            className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110"
          >
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-sm bg-white/5 group-hover:bg-white/10 group-hover:border-white/40 transition-all">
              <ArrowLeft className="w-5 h-5 text-white/70 group-hover:text-white" />
            </div>
            <span className="font-cormorant text-xs text-white/50 tracking-widest uppercase group-hover:text-white/80 transition-colors">
              {t('return')}
            </span>
          </button>

          <button
            onClick={() => window.location.reload()}
            className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110"
          >
            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-sm bg-white/5 group-hover:bg-white/10 group-hover:border-white/40 transition-all">
              <RotateCcw className="w-5 h-5 text-white/70 group-hover:text-white" />
            </div>
            <span className="font-cormorant text-xs text-white/50 tracking-widest uppercase group-hover:text-white/80 transition-colors">
              {t('replay')}
            </span>
          </button>
        </div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              background: memory.emotion === 'warm' ? 'rgba(232, 213, 163, 0.4)' : 'rgba(126, 184, 216, 0.4)',
              boxShadow: `0 0 10px ${memory.emotion === 'warm' ? 'rgba(232, 213, 163, 0.3)' : 'rgba(126, 184, 216, 0.3)'}`,
              animation: `float ${p.floatDuration}s ease-in-out infinite`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
