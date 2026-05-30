import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function LanguageSwitch() {
  const { i18n } = useTranslation();

  const toggleLang = () => {
    const next = i18n.language === 'zh' ? 'en' : 'zh';
    i18n.changeLanguage(next);
    localStorage.setItem('pensieve-lang', next);
  };

  return (
    <button
      onClick={toggleLang}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/15 bg-white/5 hover:bg-white/10 transition-all"
      title={i18n.language === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      <Globe className="w-3 h-3 text-white/50" />
      <span className="font-cormorant text-xs text-white/60 tracking-wider">
        {i18n.language === 'zh' ? 'EN' : '中'}
      </span>
    </button>
  );
}
