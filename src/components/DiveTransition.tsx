import { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import type { Memory } from '@/types';

interface DiveTransitionProps {
  memory: Memory;
  onComplete: () => void;
}

export default function DiveTransition({ memory, onComplete }: DiveTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const silverRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const silver = silverRef.current;
    const glow = glowRef.current;
    const text = textRef.current;
    if (!container || !silver || !glow || !text) return;

    const tl = gsap.timeline({
      onComplete,
    });

    // Phase 1: Silver liquid rises from center (0-1.5s)
    tl.fromTo(
      silver,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5, ease: 'power2.inOut' }
    );

    // Phase 2: Center text appears
    tl.fromTo(
      text,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' },
      '-=0.8'
    );

    // Phase 3: Text fades, glow intensifies
    tl.to(text, { opacity: 0, duration: 0.5, ease: 'power2.in' }, '+=0.5');
    tl.to(
      glow,
      {
        opacity: 1,
        scale: 3,
        duration: 1.5,
        ease: 'power3.in',
      },
      '-=0.3'
    );

    // Phase 4: Silver expands to fill screen
    tl.to(
      silver,
      {
        scale: 15,
        opacity: 0.9,
        duration: 2,
        ease: 'power3.inOut',
      },
      '-=1.5'
    );

    // Phase 5: Fade to memory color
    tl.to(
      container,
      {
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      },
      '-=0.3'
    );

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 100 }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#050810]" />

      {/* Expanding water liquid — rgb(92, 176, 203) */}
      <div
        ref={silverRef}
        className="absolute rounded-full"
        style={{
          width: '300px',
          height: '300px',
          background: `
            radial-gradient(circle at 40% 40%,
              rgba(140, 210, 230, 0.95) 0%,
              rgba(92, 176, 203, 0.80) 30%,
              rgba(70, 150, 190, 0.60) 60%,
              rgba(50, 120, 160, 0.35) 100%
            )
          `,
          boxShadow: `
            0 0 60px rgba(92, 176, 203, 0.55),
            0 0 120px rgba(70, 150, 190, 0.35),
            inset 0 0 60px rgba(255, 255, 255, 0.25)
          `,
          transform: 'scale(0)',
        }}
      >
        {/* Inner swirl */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background: `
              conic-gradient(
                from 0deg,
                transparent 0%,
                rgba(255, 255, 255, 0.12) 20%,
                transparent 40%,
                rgba(120, 200, 220, 0.18) 60%,
                transparent 80%,
                transparent 100%
              )
            `,
            animationDuration: '3s',
          }}
        />
      </div>

      {/* Burst glow */}
      <div
        ref={glowRef}
        className="absolute rounded-full opacity-0"
        style={{
          width: '400px',
          height: '400px',
          background: memory.emotion === 'warm'
            ? 'radial-gradient(circle, rgba(232, 213, 163, 0.6) 0%, rgba(245, 230, 200, 0.3) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(92, 176, 203, 0.65) 0%, rgba(70, 150, 190, 0.35) 40%, transparent 70%)',
          filter: 'blur(40px)',
          transform: 'scale(0)',
        }}
      />

      {/* Center text */}
      <div
        ref={textRef}
        className="absolute text-center opacity-0"
        style={{ zIndex: 10 }}
      >
        <div
          className={`
            font-cinzel text-3xl tracking-[0.3em] uppercase drop-shadow-2xl
            ${memory.emotion === 'warm' ? 'text-[#e8d5a3]' : 'text-[#aee2ff]'}
          `}
          style={{
            textShadow: memory.emotion === 'warm'
              ? '0 2px 15px rgba(0,0,0,0.8), 0 0 30px rgba(232, 213, 163, 0.8)'
              : '0 2px 15px rgba(0,0,0,0.8), 0 0 30px rgba(126, 184, 216, 0.8)',
          }}
        >
          {memory.title}
        </div>
        <div style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }} className="font-cormorant text-xl italic mt-3 text-white/80 tracking-wider">
          Diving into memory...
        </div>
      </div>
    </div>
  );
}
