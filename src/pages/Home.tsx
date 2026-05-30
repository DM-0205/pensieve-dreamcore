import { useState, useCallback, useEffect } from 'react';
import { gsap } from 'gsap';
import { Eye, Undo2, Sparkles, List, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import ParticleCanvas from '@/components/ParticleCanvas';
import LiquidCanvas from '@/components/LiquidCanvas';
import MemoryLabels from '@/components/MemoryLabels';
import DiveTransition from '@/components/DiveTransition';
import MemoryView from '@/components/MemoryView';
import VoiceInputPanel from '@/components/VoiceInputPanel';
import MemorySidebar from '@/components/MemorySidebar';
import EditMemoryPanel from '@/components/EditMemoryPanel';
import TrashSidebar from '@/components/TrashSidebar';
import AuthButton from '@/components/AuthButton';
import LanguageSwitch from '@/components/LanguageSwitch';
import Onboarding, { hasSeenOnboarding } from '@/components/Onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { loadMemories, deleteUserMemory, updateUserMemory } from '@/types';
import type { Memory, ViewState } from '@/types';

export default function Home() {
  const { t } = useTranslation();
  const { user, loginWithGoogle } = useAuth();
  const uid = user?.uid;
  const [view, setView] = useState<ViewState>('main');
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [basinLoaded, setBasinLoaded] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoriesLoaded, setMemoriesLoaded] = useState(false);
  const [customPositions, setCustomPositions] = useState<Map<string, { angle: number; distance: number }>>(new Map());
  const [showSidebar, setShowSidebar] = useState(false);
  const [showTrashSidebar, setShowTrashSidebar] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    (async () => {
      const loaded = await loadMemories(uid);
      setMemories(loaded);
      setMemoriesLoaded(true);
      if (user && !hasSeenOnboarding()) {
        setShowOnboarding(true);
      }
    })();
  }, [uid, user]);

  // 引导进入第三步后自动关闭语音面板，避免遮挡后续步骤
  useEffect(() => {
    if (onboardingStep >= 2 && showPanel) {
      setShowPanel(false);
    }
  }, [onboardingStep, showPanel]);

  // 引导第三步自动选中"设计初衷"记忆，方便展示拖动和编辑
  useEffect(() => {
    if (onboardingStep === 2) {
      const designMemory = memories.find((m) => m.id === 'default-1');
      if (designMemory) {
        setSelectedMemory(designMemory);
      }
    }
  }, [onboardingStep, memories]);

  // Recalculate positions for user memories, respecting custom drag positions
  const processedMemories: Memory[] = memories.map((m) => {
    if (m.id.startsWith('default-')) return m;
    const custom = customPositions.get(m.id);
    if (custom) {
      return { ...m, angle: custom.angle, distance: custom.distance };
    }
    return m;
  });

  const sceneRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 2, ease: 'power2.out' });
  }, []);

  const handleSelectMemory = (memory: Memory) => {
    setSelectedMemory((prev) => (prev?.id === memory.id ? null : memory));
  };

  const handleDive = () => {
    if (!selectedMemory) return;
    setView('diving');
  };

  const handleTransitionComplete = () => {
    setView('memory');
  };

  const handleBack = () => {
    setView('main');
    setSelectedMemory(null);
  };

  const handleMemoryAdded = async (newMemory: Memory) => {
    const updated = await loadMemories(uid);
    setMemories(updated);
    setSelectedMemory(newMemory);
  };

  const handleDeleteMemory = async (id: string) => {
    await deleteUserMemory(id, uid);
    const updated = await loadMemories(uid);
    setMemories(updated);
    if (selectedMemory?.id === id) {
      setSelectedMemory(null);
    }
  };

  const handlePositionChange = async (id: string, angle: number, distance: number) => {
    setCustomPositions((prev) => {
      const next = new Map(prev);
      next.set(id, { angle, distance });
      return next;
    });

    if (uid) {
      await updateUserMemory(id, { angle, distance }, uid);
    } else {
      try {
        const { loadMemories: localLoad } = await import('@/types');
        const all = await localLoad();
        const userMem = all.filter((m) => m.id.startsWith('user-'));
        const updated = userMem.map((m) =>
          m.id === id ? { ...m, angle, distance } : m
        );
        localStorage.setItem('pensieve-memories', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showPanel) setShowPanel(false);
        else if (view === 'memory') handleBack();
      }
      if (e.key === 'Enter' && view === 'main' && selectedMemory && !showPanel) {
        handleDive();
      }
      // Shift + R 重置引导（开发调试用）
      if (e.key === 'R' && e.shiftKey) {
        localStorage.removeItem('pensieve-onboarding');
        location.reload();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [view, selectedMemory, showPanel]);

  useEffect(() => {
    const basinImg = new Image();
    basinImg.onload = () => setBasinLoaded(true);
    basinImg.src = '/basin.png';
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#050810]">
      <ParticleCanvas />

      {/* Main scene */}
      {view === 'main' && (
        <div
          ref={sceneRef}
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 5 }}
        >
          {/* Ambient glow */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: isMobile ? '100%' : '700px',
              height: isMobile ? '100%' : '500px',
              background: 'radial-gradient(ellipse at center, rgba(92, 176, 203, 0.06) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />

          {/* === PENSIEVE CONTAINER === */}
          <div
            className="relative transition-all duration-700"
            style={{
              width: '520px',
              height: '380px',
              transform: isMobile ? 'scale(0.55)' : 'none',
              transformOrigin: 'center center'
            }}
          >

            {/* LAYER 1: Liquid — ON TOP of basin, SVG mask for basin inner shape */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
              <defs>
                <mask id="basin-inner-mask">
                  <rect width="100%" height="100%" fill="black" />
                  <ellipse
                    cx="150"
                    cy="150"
                    rx="143.3"
                    ry="90"
                    fill="white"
                  />
                </mask>
              </defs>
            </svg>
            <div
              className="absolute"
              style={{
                left: '50%',
                top: '46.5%',
                transform: `translate(-50%, -50%) perspective(800px) rotateX(70deg)`,
                width: '300px',
                height: '300px',
                maskImage: 'url(#basin-inner-mask)',
                WebkitMaskImage: 'url(#basin-inner-mask)',
                zIndex: 7,
              }}
            >
              <LiquidCanvas size={300} />
            </div>

            {/* LAYER 2: Memory labels around the basin */}
            {memoriesLoaded && (
              <div data-onboarding="memory-labels" className="absolute inset-0">
                <MemoryLabels
                  memories={processedMemories}
                  onSelect={handleSelectMemory}
                  selectedId={selectedMemory?.id || null}
                  onDelete={handleDeleteMemory}
                  onEdit={setEditingMemory}
                  onPositionChange={handlePositionChange}
                  scale={1}
                  onboardingStep={onboardingStep}
                />
              </div>
            )}

            {/* LAYER 3: Basin image — ON TOP, covers liquid edges, transparent center shows liquid */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                zIndex: 5,
                opacity: basinLoaded ? 1 : 0,
                transition: 'opacity 1.5s ease-out',
              }}
            >
              <img
                src="/basin.png"
                alt="Pensieve"
                className="w-full h-full object-contain"
                draggable={false}
                style={{
                  filter: 'drop-shadow(0 10px 40px rgba(92, 176, 203, 0.10))',
                }}
              />
            </div>

            {/* Subtle reflection under basin */}
            <div
              className="absolute pointer-events-none"
              style={{
                bottom: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '350px',
                height: '30px',
                background: 'radial-gradient(ellipse at center, rgba(92, 176, 203, 0.08) 0%, transparent 70%)',
                filter: 'blur(15px)',
                zIndex: 0,
              }}
            />
          </div>

          {/* Title */}
          <div
            className="absolute top-0 left-0 right-0 pt-8 md:pt-10 text-center pointer-events-none px-6"
            style={{ zIndex: 20 }}
          >
            <h1
              className="font-cinzel text-xl md:text-3xl font-bold tracking-[0.4em] md:tracking-[0.5em] uppercase text-[#7eb8d8]/80"
              style={{ textShadow: '0 0 30px rgba(92, 176, 203, 0.5)' }}
            >
              {t('title')}
            </h1>
            <p className="font-cormorant text-xs md:text-base font-semibold italic text-white/40 mt-2 md:mt-3 tracking-[0.15em]">
              {t('subtitle')}
            </p>
          </div>

          {/* Bottom controls */}
          <div
            className="absolute bottom-0 left-0 right-0 pb-8 md:pb-10 flex justify-center gap-8 md:gap-12"
            style={{ zIndex: 20 }}
          >
            {/* Add Thought button */}
            <button
              data-onboarding="add-button"
              onClick={() => {
                if (!user) {
                  toast(t('loginPrompt'), {
                    icon: '🔮',
                    duration: 2500,
                  });
                  loginWithGoogle();
                  return;
                }
                setShowPanel(true);
              }}
              className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110"
            >
              <div className="w-12 h-12 rounded-full border border-[#5CB0CB]/25 flex items-center justify-center backdrop-blur-sm bg-[#5CB0CB]/8 group-hover:bg-[#5CB0CB]/15 group-hover:border-[#5CB0CB]/45 transition-all">
                <Sparkles className="w-5 h-5 text-[#5CB0CB]/60 group-hover:text-[#5CB0CB]" />
              </div>
              <span className="font-cormorant text-[10px] text-[#5CB0CB]/40 tracking-[0.2em] uppercase group-hover:text-[#5CB0CB]/70 transition-colors">
                {t('add')}
              </span>
            </button>

            {/* Enter Memory button */}
            <button
              onClick={handleDive}
              disabled={!selectedMemory}
              className={`group flex flex-col items-center gap-2 transition-all duration-300 ${selectedMemory ? 'hover:scale-110 cursor-pointer' : 'opacity-30 cursor-not-allowed'}`}
            >
              <div className={`w-16 h-16 rounded-full border flex items-center justify-center backdrop-blur-sm transition-all ${selectedMemory ? 'border-[#5CB0CB]/40 bg-[#5CB0CB]/10 group-hover:bg-[#5CB0CB]/20 group-hover:border-[#5CB0CB]/60' : 'border-white/10 bg-white/5'}`}>
                <Eye className={`w-6 h-6 ${selectedMemory ? 'text-[#5CB0CB] group-hover:text-white' : 'text-white/30'}`} />
              </div>
              <span className={`font-cormorant text-[10px] tracking-[0.2em] uppercase transition-colors ${selectedMemory ? 'text-[#5CB0CB]/60 group-hover:text-[#5CB0CB]' : 'text-white/25'}`}>
                {selectedMemory ? t('enterMemory') : t('view')}
              </span>
            </button>

            {/* Clear button */}
            <button
              onClick={() => setSelectedMemory(null)}
              className="group flex flex-col items-center gap-2 transition-all duration-300 hover:scale-110"
            >
              <div className="w-12 h-12 rounded-full border border-white/15 flex items-center justify-center backdrop-blur-sm bg-white/5 group-hover:bg-white/10 group-hover:border-white/30 transition-all">
                <Undo2 className="w-5 h-5 text-white/40 group-hover:text-white/70" />
              </div>
              <span className="font-cormorant text-[10px] text-white/30 tracking-[0.2em] uppercase group-hover:text-white/60 transition-colors">
                {t('clear')}
              </span>
            </button>
          </div>

          {/* Hint */}
          {selectedMemory && (
            <div className="absolute bottom-[120px] md:bottom-[130px] left-0 right-0 text-center pointer-events-none" style={{ zIndex: 20 }}>
              <p className="font-cormorant text-[11px] md:text-sm text-white/30 italic tracking-wider animate-pulse">
                {t('pressEnter')}
              </p>
            </div>
          )}

          {/* Personal memory count & sidebar button */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center gap-2 md:gap-3" style={{ zIndex: 20 }}>
            <AuthButton />
            <LanguageSwitch />
            {memories.filter((m) => m.id.startsWith('user-')).length > 0 && (
              <div className="flex items-center gap-1.5 md:gap-2 pointer-events-none">
                <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 text-[#e8d5a3]/40" />
                <span className="font-cormorant text-[10px] md:text-xs text-white/30 whitespace-nowrap">
                  {memories.filter((m) => m.id.startsWith('user-')).length} {t('personal')}
                </span>
              </div>
            )}
            <button
              data-onboarding="trash-button"
              onClick={() => setShowTrashSidebar(true)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/15 flex items-center justify-center backdrop-blur-sm bg-white/5 hover:bg-white/10 hover:border-red-400/30 transition-all group shrink-0"
              title="Trash Bin"
            >
              <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/40 group-hover:text-red-400/70 transition-colors" />
            </button>
            <button
              data-onboarding="archive-button"
              onClick={() => setShowSidebar(true)}
              className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-white/15 flex items-center justify-center backdrop-blur-sm bg-white/5 hover:bg-white/10 hover:border-[#5CB0CB]/30 transition-all group shrink-0"
              title="Memory Archive"
            >
              <List className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/40 group-hover:text-[#5CB0CB]/70 transition-colors" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Input Panel */}
      <div data-onboarding="voice-panel">
        <VoiceInputPanel
          isOpen={showPanel}
          onClose={() => setShowPanel(false)}
          onMemoryAdded={handleMemoryAdded}
        />
      </div>

      {/* Edit Memory Panel */}
      <EditMemoryPanel
        isOpen={!!editingMemory}
        memory={editingMemory}
        onClose={() => setEditingMemory(null)}
        onSave={async (updated) => {
          await updateUserMemory(updated.id, updated, uid);
          setMemories(await loadMemories(uid));
        }}
      />

      {/* Memory Sidebar */}
      <MemorySidebar
        memories={memories}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        onMemoriesChange={async () => {
          setMemories(await loadMemories(uid));
        }}
        onSelectMemory={(memory) => {
          setSelectedMemory(memory);
          setShowSidebar(false);
        }}
      />

      {/* Trash Sidebar */}
      <TrashSidebar
        isOpen={showTrashSidebar}
        onClose={() => setShowTrashSidebar(false)}
        onMemoriesChange={async () => {
          setMemories(await loadMemories(uid));
        }}
      />

      {/* Dive transition */}
      {view === 'diving' && selectedMemory && (
        <DiveTransition
          memory={selectedMemory}
          onComplete={handleTransitionComplete}
        />
      )}

      {/* Memory view */}
      {view === 'memory' && selectedMemory && (
        <MemoryView memory={selectedMemory} onBack={handleBack} />
      )}

      {/* Onboarding */}
      {showOnboarding && (
        <Onboarding
          onComplete={() => setShowOnboarding(false)}
          onOpenVoicePanel={() => setShowPanel(true)}
          onStepChange={setOnboardingStep}
        />
      )}
    </div>
  );
}
