import { useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { X, RefreshCcw, Trash } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { loadTrashMemories, restoreFromTrash, permanentDeleteFromTrash } from '@/types';
import type { Memory } from '@/types';

interface TrashSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoriesChange: () => void;
}

export default function TrashSidebar({ isOpen, onClose, onMemoriesChange }: TrashSidebarProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const uid = user?.uid;
  const [trashMemories, setTrashMemories] = useState<Memory[]>([]);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        setTrashMemories(await loadTrashMemories(uid));
      })();
    }
  }, [isOpen, uid]);

  const handleRestore = async (id: string) => {
    await restoreFromTrash(id, uid);
    setTrashMemories(await loadTrashMemories(uid));
    onMemoriesChange();
  };

  const handlePermanentDelete = async (id: string) => {
    await permanentDeleteFromTrash(id, uid);
    setTrashMemories(await loadTrashMemories(uid));
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 w-80 max-w-full bg-[#0a0f1e] border-l border-white/10 shadow-2xl flex flex-col"
      style={{ zIndex: 100 }}
    >
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Trash className="w-5 h-5 text-red-400" />
          <h2 className="font-cinzel text-lg tracking-widest text-red-400/90 uppercase">{t('trashBin')}</h2>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 transition-all text-white/50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {trashMemories.length === 0 ? (
          <div className="text-center mt-10">
            <Trash className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="font-cormorant text-white/40 italic">{t('trashEmpty')}</p>
          </div>
        ) : (
          trashMemories.map((m) => (
            <div key={m.id} className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 relative group">
              <h3 className="font-cinzel text-sm text-white/80">{m.title}</h3>
              <p className="font-cormorant text-xs text-white/40 mt-1">{m.subtitle}</p>

              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleRestore(m.id)}
                  title="Restore"
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#5CB0CB]/30 border border-[#5CB0CB]/30"
                >
                  <RefreshCcw className="w-3 h-3 text-[#5CB0CB]" />
                </button>
                <button
                  onClick={() => handlePermanentDelete(m.id)}
                  title="Permanent Delete"
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-red-500/30 border border-red-500/30"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
