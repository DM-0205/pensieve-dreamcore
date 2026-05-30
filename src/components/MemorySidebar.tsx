import { useRef, useEffect, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { X, Edit2, Save, Trash2, ImagePlus, RotateCcw, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserMemory, deleteUserMemory } from '@/types';
import type { Memory } from '@/types';

interface MemorySidebarProps {
  memories: Memory[];
  isOpen: boolean;
  onClose: () => void;
  onMemoriesChange: () => void;
  onSelectMemory?: (memory: Memory) => void;
}

export default function MemorySidebar({
  memories,
  isOpen,
  onClose,
  onMemoriesChange,
  onSelectMemory,
}: MemorySidebarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const uid = user?.uid;
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    polishedText: string;
    emotion: 'warm' | 'cool';
    image: string;
  }>({ title: '', polishedText: '', emotion: 'warm', image: '' });
  const [imagePreview, setImagePreview] = useState<string>('');

  // Entrance / exit animation
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const overlay = overlayRef.current;
    if (!sidebar || !overlay) return;

    if (isOpen) {
      gsap.set(sidebar, { x: '100%' });
      gsap.set(overlay, { opacity: 0 });
      gsap.to(overlay, { opacity: 1, duration: 0.3, ease: 'power2.out' });
      gsap.to(sidebar, { x: '0%', duration: 0.5, ease: 'power3.out' });
    } else {
      gsap.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.in' });
      gsap.to(sidebar, {
        x: '100%',
        duration: 0.4,
        ease: 'power3.in',
        onComplete: () => {
          setEditingId(null);
        },
      });
    }
  }, [isOpen]);

  const startEdit = (memory: Memory) => {
    setEditingId(memory.id);
    setEditForm({
      title: memory.title,
      polishedText: memory.polishedText || '',
      emotion: memory.emotion,
      image: memory.image || '',
    });
    setImagePreview(memory.image || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setImagePreview('');
  };

  const handleSave = async (id: string) => {
    await updateUserMemory(id, {
      title: editForm.title.trim(),
      polishedText: editForm.polishedText.trim(),
      emotion: editForm.emotion,
      image: editForm.image || undefined,
    }, uid);
    onMemoriesChange();
    setEditingId(null);
    setImagePreview('');
  };

  const handleDelete = async (id: string) => {
    await deleteUserMemory(id, uid);
    onMemoriesChange();
    setEditingId(null);
  };

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setEditForm((prev) => ({ ...prev, image: result }));
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleUseDefaultImage = () => {
    const defaultImage = editForm.emotion === 'warm' ? '/memory-childhood.jpg' : '/memory-tower.jpg';
    setEditForm((prev) => ({ ...prev, image: defaultImage }));
    setImagePreview(defaultImage);
  };

  const sortedMemories = [...memories].sort((a, b) => {
    const aTime = a.createdAt || 0;
    const bTime = b.createdAt || 0;
    return bTime - aTime;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0" style={{ zIndex: 80 }}>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[#050810]/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className="absolute top-0 right-0 h-full overflow-y-auto"
        style={{
          width: '380px',
          maxWidth: '85vw',
          background: 'linear-gradient(180deg, rgba(20, 25, 45, 0.98) 0%, rgba(10, 15, 30, 0.99) 100%)',
          borderLeft: '1px solid rgba(92, 176, 203, 0.15)',
          boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Top glow line */}
        <div
          className="absolute top-0 left-0 h-px"
          style={{
            width: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(92, 176, 203, 0.4), transparent)',
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 sticky top-0" style={{ background: 'linear-gradient(180deg, rgba(20, 25, 45, 0.98) 0%, rgba(20, 25, 45, 0.8) 80%, transparent 100%)', backdropFilter: 'blur(8px)' }}>
          <div>
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-[#5CB0CB]/80">
              {t('memoryArchive')}
            </h2>
            <p className="font-cormorant text-xs text-white/30 italic mt-1">
              {memories.filter((m) => m.id.startsWith('user-')).length} {t('memoriesCount')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
          >
            <X className="w-4 h-4 text-white/50 hover:text-white/80" />
          </button>
        </div>

        {/* Memory list */}
        <div className="px-4 pb-8 space-y-3">
          {sortedMemories.map((memory) => {
            const isUserMemory = memory.id.startsWith('user-');
            const isWarm = memory.emotion === 'warm';
            const isEditing = editingId === memory.id;
            const dateStr = memory.createdAt
              ? new Date(memory.createdAt).toLocaleDateString('zh-CN')
              : memory.year;

            return (
              <div
                key={memory.id}
                className="relative rounded-xl overflow-hidden transition-all"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                {/* Emotion accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{
                    background: isWarm
                      ? 'linear-gradient(180deg, rgba(232, 213, 163, 0.6), rgba(232, 213, 163, 0.2))'
                      : 'linear-gradient(180deg, rgba(126, 184, 216, 0.6), rgba(126, 184, 216, 0.2))',
                  }}
                />

                {/* View mode */}
                {!isEditing && (
                  <div className="px-4 py-3 pl-5">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => onSelectMemory?.(memory)}
                        className="flex-1 text-left group"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-cinzel text-sm tracking-wider uppercase ${isWarm ? 'text-[#e8d5a3]' : 'text-[#7eb8d8]'}`}
                          >
                            {memory.title}
                          </span>
                          <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-white/40 transition-colors opacity-0 group-hover:opacity-100" />
                        </div>
                        <div className="font-cormorant text-xs text-white/30 italic mt-0.5">
                          {dateStr}
                        </div>
                        {memory.polishedText && (
                          <p className="font-cormorant text-xs text-white/25 mt-1 line-clamp-2">
                            {memory.polishedText}
                          </p>
                        )}
                      </button>

                      <button
                        onClick={() => startEdit(memory)}
                        className="mt-1 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
                      >
                        <Edit2 className="w-3 h-3 text-white/30 hover:text-white/60" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit mode */}
                {isEditing && (
                  <div className="px-4 py-4 pl-5 space-y-4">
                    {/* Title */}
                    <div>
                      <label className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1.5 block">
                        {t('titleLabel')}
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full p-3 rounded-lg bg-white/5 border border-white/10 font-cormorant text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-[#5CB0CB]/40 transition-colors"
                      />
                    </div>

                    {/* Polished text */}
                    <div>
                      <label className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-white/40 mb-1.5 block">
                        {t('contentLabel')}
                      </label>
                      <textarea
                        value={editForm.polishedText}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, polishedText: e.target.value }))}
                        className="w-full p-3 rounded-lg bg-white/5 border border-white/10 font-cormorant text-sm text-white/90 leading-relaxed resize-none focus:outline-none focus:border-[#5CB0CB]/40 transition-colors"
                        rows={3}
                      />
                    </div>

                    {/* Emotion selector */}
                    <div>
                      <label className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-white/40 mb-2 block">
                        {t('toneLabel')}
                      </label>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setEditForm((prev) => ({ ...prev, emotion: 'warm' }))}
                          className={`flex-1 py-2 rounded-lg border text-xs font-cormorant transition-all ${
                            editForm.emotion === 'warm'
                              ? 'border-[#e8d5a3]/50 bg-[#e8d5a3]/10 text-[#e8d5a3]'
                              : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                          }`}
                        >
                          {t('warm')}
                        </button>
                        <button
                          onClick={() => setEditForm((prev) => ({ ...prev, emotion: 'cool' }))}
                          className={`flex-1 py-2 rounded-lg border text-xs font-cormorant transition-all ${
                            editForm.emotion === 'cool'
                              ? 'border-[#7eb8d8]/50 bg-[#7eb8d8]/10 text-[#7eb8d8]'
                              : 'border-white/10 bg-white/5 text-white/40 hover:border-white/20'
                          }`}
                        >
                          {t('cool')}
                        </button>
                      </div>
                    </div>

                    {/* Image upload */}
                    <div>
                      <label className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-white/40 mb-2 block">
                        {t('bgImage')}
                      </label>
                      <div className="flex items-center gap-3">
                        {imagePreview && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                            <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex flex-col gap-2">
                          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-all cursor-pointer w-max">
                            <ImagePlus className="w-3 h-3 text-white/50" />
                            <span className="font-cormorant text-xs text-white/60">{t('uploadImage')}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            onClick={handleUseDefaultImage}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-all w-max"
                          >
                            <RotateCcw className="w-3 h-3 text-white/50" />
                            <span className="font-cormorant text-xs text-white/60">{t('useDefault')}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
                      >
                        <span className="font-cormorant text-sm text-white/60">{t('cancel')}</span>
                      </button>
                      <button
                        onClick={() => handleSave(memory.id)}
                        disabled={!editForm.title.trim()}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-[#5CB0CB]/30 bg-[#5CB0CB]/10 hover:bg-[#5CB0CB]/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Save className="w-3.5 h-3.5 text-[#5CB0CB]" />
                        <span className="font-cormorant text-sm text-[#5CB0CB]">{t('save')}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(memory.id)}
                        className="px-3 py-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/15 transition-all"
                      >
                        <Trash2 className="w-4 h-4 text-red-400/60" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {sortedMemories.length === 0 && (
            <div className="text-center py-12">
              <p className="font-cormorant text-sm text-white/20 italic">
                No memories yet. Speak your first thought.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
