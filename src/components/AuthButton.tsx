import { LogIn, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthButton() {
  const { t } = useTranslation();
  const { user, loginWithGoogle, logout } = useAuth();

  if (user) {
    return (
      <button
        onClick={logout}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
        title={t('logout')}
      >
        {user.photoURL && (
          <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
        )}
        <span className="font-cormorant text-xs text-white/60 max-w-[80px] truncate">
          {user.displayName || user.email}
        </span>
        <LogOut className="w-3 h-3 text-white/40" />
      </button>
    );
  }

  return (
    <button
      onClick={loginWithGoogle}
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#5CB0CB]/30 bg-[#5CB0CB]/10 hover:bg-[#5CB0CB]/20 transition-all"
    >
      <LogIn className="w-3.5 h-3.5 text-[#5CB0CB]" />
      <span className="font-cormorant text-xs text-[#5CB0CB]/80 tracking-wider">
        {t('login')}
      </span>
    </button>
  );
}
