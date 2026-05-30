import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Sparkles, Save, X, ImagePlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Memory } from '@/types';

interface EditMemoryPanelProps {
  memory: Memory | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Memory) => void;
}

export default function EditMemoryPanel({ memory, isOpen, onClose, onSave }: EditMemoryPanelProps) {
  const { t } = useTranslation();
  const [memoryName, setMemoryName] = useState('');
  const [image, setImage] = useState('');
  const [emotion, setEmotion] = useState<'warm' | 'cool'>('warm');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && memory) {
      setMemoryName(memory.title);
      setImage(memory.image || '');
      setEmotion(memory.emotion as 'warm' | 'cool' || 'warm');
    }
  }, [isOpen, memory]);

  useEffect(() => {
    if (isOpen && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!memory || !memoryName.trim()) return;

    const defaultImage = emotion === 'warm' ? '/memory-childhood.jpg' : '/memory-tower.jpg';
    
    const updated: Memory = {
      ...memory,
      title: memoryName.trim(),
      emotion,
      image: image || defaultImage,
    };

    onSave(updated);
    onClose();
  };

  if (!isOpen || !memory) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 90 }}
    >
      <div className="absolute inset-0 bg-[#050810]/80 backdrop-blur-sm" onClick={onClose} />

      <div
        ref={panelRef}
        className="relative w-full max-w-sm mx-4 rounded-[20px]"
        style={{
          background: 'linear-gradient(180deg, rgba(20, 25, 45, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
          border: '1px solid rgba(92, 176, 203, 0.20)',
          boxShadow: '0 0 60px rgba(92, 176, 203, 0.12), 0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-[#5CB0CB]/60" />
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-[#5CB0CB]/80">
              {t('editMemory')}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10">
            <X className="w-4 h-4 text-white/50 hover:text-white/80" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <label className="flex items-center gap-2 font-cinzel text-[10px] tracking-[0.2em] uppercase text-white/40 mb-2">
              {t('memoryTitle')}
            </label>
            <input
              type="text"
              value={memoryName}
              onChange={(e) => setMemoryName(e.target.value)}
              placeholder="Enter a name for this memory..."
              className="w-full p-4 rounded-lg bg-white/5 border border-white/15 font-cormorant text-lg text-white/90 placeholder:text-white/20 focus:outline-none focus:border-[#5CB0CB]/40 transition-colors"
            />
          </div>

          <div className="mb-6">
            <label className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-white/40 mb-3 block">
              {t('memoryTone')}
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setEmotion('warm')}
                className={`flex-1 py-3 rounded-lg border transition-all duration-300 ${
                  emotion === 'warm'
                    ? 'border-[#e8d5a3]/50 bg-[#e8d5a3]/10 text-[#e8d5a3]'
                    : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                }`}
              >
                <span className="font-cormorant text-sm">{t('warmJoy')}</span>
              </button>
              <button
                onClick={() => setEmotion('cool')}
                className={`flex-1 py-3 rounded-lg border transition-all duration-300 ${
                  emotion === 'cool'
                    ? 'border-[#7eb8d8]/50 bg-[#7eb8d8]/10 text-[#7eb8d8]'
                    : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                }`}
              >
                <span className="font-cormorant text-sm">{t('coolCalm')}</span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-white/40 mb-3 block">
              {t('bgImage')}
            </label>

            <div className="relative w-full aspect-video rounded-xl overflow-hidden mb-4 bg-[#050810] border border-white/10">
              {image ? (
                <img src={image} alt="Background" className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <img
                    src={emotion === 'warm' ? '/memory-childhood.jpg' : '/memory-tower.jpg'}
                    alt="Default background"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
                <ImagePlus className="w-4 h-4 text-white/50" />
                <span className="font-cormorant text-sm text-white/60">
                  {image && !image.startsWith('/memory-') ? t('changeImage') : t('uploadImage')}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setImage(reader.result as string);
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>

              {image && !image.startsWith('/memory-') && (
                <button
                  onClick={() => setImage('')}
                  className="px-4 py-3 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
                >
                  <span className="font-cormorant text-sm text-white/50">{t('useDefault')}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={!memoryName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-[#e8d5a3]/40 bg-[#e8d5a3]/15 hover:bg-[#e8d5a3]/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 text-[#e8d5a3]" />
              <span className="font-cormorant text-sm text-[#e8d5a3]">{t('saveChanges')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
