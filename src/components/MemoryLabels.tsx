import { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { X, Edit2 } from 'lucide-react';
import type { Memory } from '@/types';

function formatDate(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

interface MemoryLabelsProps {
  memories: Memory[];
  onSelect: (memory: Memory) => void;
  selectedId: string | null;
  onDelete?: (id: string) => void;
  onEdit?: (memory: Memory) => void;
  onPositionChange?: (id: string, angle: number, distance: number) => void;
  scale?: number;
  onboardingStep?: number;
}

export default function MemoryLabels({ memories, onSelect, selectedId, onDelete, onEdit, onPositionChange, scale = 1, onboardingStep }: MemoryLabelsProps) {
  const labelsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // 拖拽状态
  const dragState = useRef<{
    id: string | null;
    startX: number;
    startY: number;
    origAngle: number;
    origDistance: number;
    containerCx: number;
    containerCy: number;
    hasMoved: boolean;
  }>({
    id: null,
    startX: 0,
    startY: 0,
    origAngle: 0,
    origDistance: 0,
    containerCx: 0,
    containerCy: 0,
    hasMoved: false,
  });
  const hasDraggedRef = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffsets, setDragOffsets] = useState<Map<string, { angle: number; distance: number }>>(new Map());

  // Entrance animation for new labels
  useEffect(() => {
    memories.forEach((memory) => {
      const el = labelsRef.current.get(memory.id);
      if (!el) return;
      if (!el.dataset.animated) {
        el.dataset.animated = 'true';
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)' }
        );
      }
    });
  }, [memories]);

  // Floating animation
  useEffect(() => {
    const tweens: gsap.core.Tween[] = [];
    labelsRef.current.forEach((el, id) => {
      if (!el) return;
      const index = memories.findIndex((m) => m.id === id);
      const tween = gsap.to(el, {
        y: '+=6',
        duration: 3 + (index % 3) * 0.6,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: (index % 5) * 0.3,
      });
      tweens.push(tween);
    });

    return () => {
      tweens.forEach((t) => t.kill());
    };
  }, [memories]);

  const handlePointerDown = useCallback((e: React.PointerEvent, memory: Memory) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    dragState.current = {
      id: memory.id,
      startX: e.clientX,
      startY: e.clientY,
      origAngle: memory.angle,
      origDistance: memory.distance,
      containerCx: rect.left + rect.width / 2,
      containerCy: rect.top + rect.height / 2,
      hasMoved: false,
    };
    hasDraggedRef.current = false;
    setDraggingId(memory.id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.id) return;

    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;

    // 超过 3px 认为是拖拽
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragState.current.hasMoved = true;
      hasDraggedRef.current = true;
    }

    // 将像素偏移转换为角度和距离偏移
    const newDistance = Math.sqrt(
      Math.pow(dragState.current.origDistance * Math.cos((dragState.current.origAngle * Math.PI) / 180) + dx, 2) +
      Math.pow(dragState.current.origDistance * Math.sin((dragState.current.origAngle * Math.PI) / 180) + dy, 2)
    );

    const newAngle = (Math.atan2(
      dragState.current.origDistance * Math.sin((dragState.current.origAngle * Math.PI) / 180) + dy,
      dragState.current.origDistance * Math.cos((dragState.current.origAngle * Math.PI) / 180) + dx
    ) * 180) / Math.PI;

    setDragOffsets((prev) => {
      const next = new Map(prev);
      next.set(dragState.current.id!, { angle: newAngle, distance: newDistance });
      return next;
    });
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragState.current.id) return;

    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;

    const newDistance = Math.sqrt(
      Math.pow(dragState.current.origDistance * Math.cos((dragState.current.origAngle * Math.PI) / 180) + dx, 2) +
      Math.pow(dragState.current.origDistance * Math.sin((dragState.current.origAngle * Math.PI) / 180) + dy, 2)
    );

    const newAngle = (Math.atan2(
      dragState.current.origDistance * Math.sin((dragState.current.origAngle * Math.PI) / 180) + dy,
      dragState.current.origDistance * Math.cos((dragState.current.origAngle * Math.PI) / 180) + dx
    ) * 180) / Math.PI;

    if (onPositionChange) {
      onPositionChange(dragState.current.id, newAngle, newDistance);
    }

    dragState.current.id = null;
    setDraggingId(null);
  }, [onPositionChange]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    >
      {memories.map((memory) => {
        const isSelected = selectedId === memory.id;
        const isHovered = hoveredId === memory.id;
        const isWarm = memory.emotion === 'warm';
        const isDragging = draggingId === memory.id;

        // 使用拖拽偏移或原始位置
        const dragOffset = dragOffsets.get(memory.id);
        const effectiveAngle = dragOffset?.angle ?? memory.angle;
        const effectiveDistance = dragOffset?.distance ?? memory.distance;

        const angleRad = (effectiveAngle * Math.PI) / 180;
        const x = Math.cos(angleRad) * (effectiveDistance * scale);
        const y = Math.sin(angleRad) * (effectiveDistance * scale);

        return (
          <div
            key={memory.id}
            ref={(el) => {
              if (el) labelsRef.current.set(memory.id, el);
              else labelsRef.current.delete(memory.id);
            }}
            className={`absolute pointer-events-auto group w-max whitespace-nowrap ${isDragging ? 'cursor-grabbing z-50' : 'cursor-grab'}`}
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => {
              if (!hasDraggedRef.current) onSelect(memory);
              hasDraggedRef.current = false;
            }}
            onMouseEnter={() => setHoveredId(memory.id)}
            onMouseLeave={() => setHoveredId(null)}
            onPointerDown={(e) => handlePointerDown(e, memory)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <div
              className={`
                relative px-4 py-2 transition-all duration-500 ease-out
                ${isWarm ? 'text-[#e8d5a3]' : 'text-[#7eb8d8]'}
                ${isSelected || isHovered ? 'scale-110' : (scale < 1 ? 'scale-85' : 'scale-100')} opacity-80 hover:opacity-100
              `}
            >
              {/* Glow effect */}
              <div
                className={`
                  absolute inset-0 rounded-2xl blur-xl transition-opacity duration-500
                  ${isWarm ? 'bg-[#e8d5a3]' : 'bg-[#7eb8d8]'}
                  ${isSelected || isHovered ? 'opacity-40' : 'opacity-15'}
                `}
              />

              {/* Delete button for user memories */}
              {(isSelected || isHovered) && onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(memory.id);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500/30 border border-red-400/40 flex items-center justify-center hover:bg-red-500/60 transition-all"
                  style={{ zIndex: 5 }}
                >
                  <X className="w-3 h-3 text-red-300" />
                </button>
              )}

              {/* Text content */}
              <div className="relative text-center whitespace-nowrap">
                <div
                  className="font-cinzel text-sm tracking-[0.15em] uppercase"
                  style={{
                    textShadow: isSelected || isHovered
                      ? `0 0 25px ${isWarm ? 'rgba(232,213,163,0.9)' : 'rgba(126,184,216,0.9)'}`
                      : `0 0 10px ${isWarm ? 'rgba(232,213,163,0.3)' : 'rgba(126,184,216,0.3)'}`
                  }}
                >
                  {memory.title}
                </div>
                <div
                  className={`
                    font-cormorant text-xs italic mt-1 tracking-wider
                    transition-opacity duration-500
                    ${isSelected || isHovered ? 'opacity-80' : 'opacity-35'}
                  `}
                >
                  {memory.createdAt ? formatDate(memory.createdAt) : memory.year}
                </div>
              </div>

              {/* Edit button */}
              {onEdit && (
                <button
                  data-onboarding="edit-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(memory);
                  }}
                  className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-[#5CB0CB]/30 border border-[#5CB0CB]/40 flex items-center justify-center hover:bg-[#5CB0CB]/60 transition-all opacity-60 hover:opacity-100"
                  style={{ zIndex: 5 }}
                >
                  <Edit2 className="w-3 h-3 text-[#5CB0CB]" />
                </button>
              )}

              {/* Ripple indicator */}
              {(isSelected || isHovered) && (
                <div
                  className={`
                    absolute -bottom-1 left-1/2 -translate-x-1/2
                    w-1.5 h-1.5 rounded-full
                    ${isWarm ? 'bg-[#e8d5a3]' : 'bg-[#7eb8d8]'}
                    animate-ping
                  `}
                  style={{ animationDuration: '2s' }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
