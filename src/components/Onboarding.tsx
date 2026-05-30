import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, SkipForward } from 'lucide-react';

interface Step {
  text: string;
  target: string;
  fallbackPos?: { top?: string; bottom?: string; left?: string; right?: string };
}

const STEPS: Step[] = [
  {
    text: '第一步，点击 Add 按钮，可以记录你的灵感。',
    target: 'add-button',
  },
  {
    text: '第二步，点击麦克风开始录制，说完后点击停止，等待 AI 整理生成。',
    target: 'voice-mic',
    fallbackPos: { top: '50%', left: '50%' },
  },
  {
    text: '第三步，冥想盆周围的每一个灵感都可以拖动，调整到你喜欢的位置。',
    target: 'memory-labels',
  },
  {
    text: '第四步，选中灵感后点击编辑按钮，可以修改标题和背景图片。',
    target: 'edit-button',
    fallbackPos: { top: '45%', right: '15%' },
  },
  {
    text: '第五步，点击右上角的文件菜单，可以查看所有的灵感列表。',
    target: 'archive-button',
  },
  {
    text: '第六步，点击回收箱，可以查看或恢复已删除的灵感。',
    target: 'trash-button',
  },
];

const STORAGE_KEY = 'pensieve-onboarding';

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true';
}

export function markOnboardingSeen() {
  localStorage.setItem(STORAGE_KEY, 'true');
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}

interface OnboardingProps {
  onComplete?: () => void;
  onOpenVoicePanel?: () => void;
  onStepChange?: (step: number) => void;
}

export default function Onboarding({ onComplete, onOpenVoicePanel, onStepChange }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const current = STEPS[step];

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  const updatePositions = useCallback(() => {
    const el = document.querySelector(`[data-onboarding="${current.target}"]`);
    if (el) {
      const rect = el.getBoundingClientRect();
      // 过滤掉尺寸为0的情况（元素可能隐藏或未渲染）
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);

        const tooltipWidth = 320;
        const tooltipHeight = 180;
        let x = rect.left + rect.width / 2 - tooltipWidth / 2;
        let y = rect.bottom + 16;

        if (y + tooltipHeight > window.innerHeight - 20) {
          y = rect.top - tooltipHeight - 16;
        }
        if (x < 20) x = 20;
        if (x + tooltipWidth > window.innerWidth - 20) {
          x = window.innerWidth - tooltipWidth - 20;
        }

        setTooltipPos({ x, y });
        return;
      }
    }

    // 目标元素找不到或尺寸为0时，使用 fallback 位置
    setTargetRect(null);
    if (current.fallbackPos) {
      const fw = 320;
      const fh = 180;
      let x = window.innerWidth / 2 - fw / 2;
      let y = window.innerHeight / 2 - fh / 2;

      if (current.fallbackPos.top) {
        const val = parseInt(current.fallbackPos.top);
        y = window.innerHeight * (val / 100) - fh / 2;
      }
      if (current.fallbackPos.left) {
        const val = parseInt(current.fallbackPos.left);
        x = window.innerWidth * (val / 100) - fw / 2;
      }
      if (current.fallbackPos.right) {
        const val = parseInt(current.fallbackPos.right);
        x = window.innerWidth * (1 - val / 100) - fw / 2;
      }
      if (current.fallbackPos.bottom) {
        const val = parseInt(current.fallbackPos.bottom);
        y = window.innerHeight * (1 - val / 100) - fh / 2;
      }

      x = Math.max(20, Math.min(x, window.innerWidth - fw - 20));
      y = Math.max(20, Math.min(y, window.innerHeight - fh - 20));
      setTooltipPos({ x, y });
    } else {
      setTooltipPos({
        x: window.innerWidth / 2 - 160,
        y: window.innerHeight / 2 - 90,
      });
    }
  }, [current]);

  useEffect(() => {
    updatePositions();
    intervalRef.current = setInterval(updatePositions, 300);
    window.addEventListener('resize', updatePositions);
    return () => {
      clearInterval(intervalRef.current);
      window.removeEventListener('resize', updatePositions);
    };
  }, [updatePositions]);

  const handleNext = () => {
    if (step >= STEPS.length - 1) {
      markOnboardingSeen();
      onComplete?.();
    } else {
      if (step === 0 && onOpenVoicePanel) {
        onOpenVoicePanel();
      }
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    markOnboardingSeen();
    onComplete?.();
  };

  const handleAction = () => {
    if (step === 0 && onOpenVoicePanel) {
      onOpenVoicePanel();
      setStep(step + 1);
    } else {
      handleNext();
    }
  };

  return (
    <>
      {/* 高亮边框：直接 fixed 定位，不套任何全屏容器 */}
      {targetRect && (
        <>
          <div
            className="fixed rounded-xl pointer-events-none"
            style={{
              zIndex: 200,
              left: targetRect.left - 12,
              top: targetRect.top - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
              border: '3px solid #5CB0CB',
              boxShadow: '0 0 0 4px rgba(92, 176, 203, 0.3), 0 0 30px 8px rgba(92, 176, 203, 0.5)',
            }}
          />
          <div
            className="fixed rounded-xl pointer-events-none animate-ping"
            style={{
              zIndex: 200,
              left: targetRect.left - 12,
              top: targetRect.top - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
              border: '2px solid rgba(92, 176, 203, 0.6)',
              animationDuration: '2s',
            }}
          />
        </>
      )}

      {/* 提示卡片：直接 fixed 定位 */}
      <div
        className="fixed"
        style={{
          zIndex: 201,
          left: tooltipPos.x,
          top: tooltipPos.y,
          width: '320px',
        }}
      >
        <div
          className="relative p-5 rounded-2xl"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 25, 45, 0.98) 0%, rgba(10, 15, 30, 0.99) 100%)',
            border: '1px solid rgba(92, 176, 203, 0.4)',
            boxShadow: '0 0 60px rgba(92, 176, 203, 0.25), 0 20px 40px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Glow line top */}
          <div
            className="absolute -top-px left-1/2 -translate-x-1/2 h-px"
            style={{
              width: '60%',
              background: 'linear-gradient(90deg, transparent, rgba(92, 176, 203, 0.8), transparent)',
            }}
          />

          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? 'w-6 bg-[#5CB0CB]' : i < step ? 'w-4 bg-[#5CB0CB]/50' : 'w-4 bg-white/15'
                  }`}
                />
              ))}
            </div>
            <span className="font-cormorant text-xs text-white/30">
              {step + 1} / {STEPS.length}
            </span>
          </div>

          {/* Text */}
          <p className="font-cormorant text-lg text-white/90 leading-relaxed mb-5">
            {current.text}
          </p>

          {/* Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 font-cormorant text-sm text-white/40 hover:text-white/70 transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
              跳过
            </button>
            <div className="flex gap-2">
              {step === 0 && (
                <button
                  onClick={handleAction}
                  className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#e8d5a3]/40 bg-[#e8d5a3]/15 hover:bg-[#e8d5a3]/25 transition-all"
                >
                  <span className="font-cormorant text-sm text-[#e8d5a3]">试一试</span>
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#5CB0CB]/40 bg-[#5CB0CB]/15 hover:bg-[#5CB0CB]/25 transition-all"
              >
                <span className="font-cormorant text-sm text-[#5CB0CB]">
                  {step >= STEPS.length - 1 ? '开始体验' : '下一步'}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-[#5CB0CB]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
