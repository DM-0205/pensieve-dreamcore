import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Mic, MicOff, Sparkles, Save, X, RotateCcw, Volume2, AlertCircle, ImagePlus, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { processVoiceInput } from '@/services/aiPolish';
import { useAuth } from '@/contexts/AuthContext';
import { saveUserMemory } from '@/types';
import type { Memory } from '@/types';

interface VoiceInputPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onMemoryAdded: (memory: Memory) => void;
}

export default function VoiceInputPanel({ isOpen, onClose, onMemoryAdded }: VoiceInputPanelProps) {
  const { t } = useTranslation();
  const { idToken, user, loginWithGoogle } = useAuth();
  const uid = user?.uid;
  const isLoggedIn = !!user;
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    reset,
    error: speechError,
    supported,
  } = useSpeechRecognition();

  const [polished, setPolished] = useState('');
  const [memoryName, setMemoryName] = useState('');
  const [emotion, setEmotion] = useState<'warm' | 'cool'>('warm');
  const [step, setStep] = useState<'record' | 'polish' | 'name' | 'image'>('record');
  const [image, setImage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRef = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Auto-polish when recording stops
  useEffect(() => {
    if (!isListening && transcript && step === 'record' && !processingRef.current) {
      const process = async () => {
        if (!isLoggedIn) return;
        processingRef.current = true;
        setIsProcessing(true);
        try {
          const result = await processVoiceInput(transcript, idToken || undefined);
          const newName = result.title;
          const newSubtitle = result.polished.slice(0, 30) + (result.polished.length > 30 ? '...' : '');

          if (result.fallback) {
            toast(t('dailyLimitExceeded'), {
              icon: '✨',
              duration: 4000,
            });
          }

          const defaultImage = Math.random() > 0.5 ? '/memory-childhood.jpg' : '/memory-tower.jpg';
          const defaultEmotion = defaultImage.includes('childhood') ? 'warm' : 'cool';
          const id = `user-${Date.now()}`;
          const newMemory: Memory = {
            id,
            title: newName.trim(),
            subtitle: newSubtitle,
            emotion: defaultEmotion,
            image: defaultImage,
            year: new Date().getFullYear().toString(),
            angle: 0,
            distance: 320,
            originalText: transcript,
            polishedText: result.polished,
            createdAt: Date.now(),
          };

          await saveUserMemory(newMemory, uid);
          onMemoryAdded(newMemory);

          reset();
          setStep('record');
          onClose();
        } catch (err) {
          console.error("AI processing failed:", err);
        } finally {
          setIsProcessing(false);
          processingRef.current = false;
        }
      };

      process();
    }
  }, [isListening, transcript, step]);

  // Entrance animation
  useEffect(() => {
    if (isOpen && panelRef.current) {
      gsap.fromTo(
        panelRef.current,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, [isOpen, step]);

  const handleStartRecord = async () => {
    if (!isLoggedIn) {
      toast(t('loginPrompt'), {
        icon: '🔮',
        duration: 2500,
      });
      await loginWithGoogle();
      return;
    }
    await startListening();
  };

  const handleStopRecord = () => {
    stopListening();
  };

  const handleReRecord = () => {
    reset();
    setPolished('');
    setMemoryName('');
    setStep('record');
  };

  const handleSave = async () => {
    if (!memoryName.trim() || !polished.trim()) return;

    const defaultImage = emotion === 'warm' ? '/memory-childhood.jpg' : '/memory-tower.jpg';
    const id = `user-${Date.now()}`;
    const newMemory: Memory = {
      id,
      title: memoryName.trim(),
      subtitle: polished.trim().slice(0, 30) + (polished.length > 30 ? '...' : ''),
      emotion,
      image: image || defaultImage,
      year: new Date().getFullYear().toString(),
      angle: 0,
      distance: 320,
      originalText: transcript,
      polishedText: polished,
      createdAt: Date.now(),
    };

    await saveUserMemory(newMemory, uid);
    onMemoryAdded(newMemory);

    // Reset
    reset();
    setPolished('');
    setMemoryName('');
    setImage('');
    setStep('record');
    onClose();
  };

  const handleClose = () => {
    if (isListening) stopListening();
    reset();
    setPolished('');
    setMemoryName('');
    setImage('');
    setStep('record');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: 90 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#050810]/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`relative w-full max-w-lg mx-4 rounded-[20px] transition-shadow duration-500`}
        style={{
          background: 'linear-gradient(180deg, rgba(20, 25, 45, 0.95) 0%, rgba(10, 15, 30, 0.98) 100%)',
          border: isProcessing ? '1px solid transparent' : '1px solid rgba(92, 176, 203, 0.20)',
          boxShadow: isProcessing
            ? '0 0 100px rgba(92, 176, 203, 0.15), 0 20px 40px rgba(0, 0, 0, 0.4)'
            : '0 0 60px rgba(92, 176, 203, 0.12), 0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {isProcessing && <div className="gemini-border-mask" />}

        {/* Top glow line */}
        <div
          className="absolute -top-px left-1/2 -translate-x-1/2 h-px"
          style={{
            width: '60%',
            background: 'linear-gradient(90deg, transparent, rgba(92, 176, 203, 0.5), transparent)',
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div className="flex items-center gap-3">
            <Volume2 className="w-4 h-4 text-[#5CB0CB]/60" />
            <h2 className="font-cinzel text-sm tracking-[0.25em] uppercase text-[#5CB0CB]/80">
              {t('speakYourThought')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:bg-white/10"
          >
            <X className="w-4 h-4 text-white/50 hover:text-white/80" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {/* Error message */}
          {speechError && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-300 mt-0.5 flex-shrink-0" />
                <p className="font-cormorant text-sm text-red-300/80">{speechError}</p>
              </div>
            </div>
          )}

          {/* Browser not supported message */}
          {!supported && (
            <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-center">
              <p className="font-cormorant text-sm text-yellow-300/70">
                Your browser does not support voice input. Please use Chrome, Edge, or Safari.
              </p>
            </div>
          )}

          {/* Step 1: Recording */}
          {step === 'record' && (
            <div className="flex flex-col items-center py-6">
              {/* Mic button */}
              <button
                data-onboarding="voice-mic"
                onClick={isListening ? handleStopRecord : handleStartRecord}
                disabled={!supported || isProcessing || !isLoggedIn}
                className={`
                  relative w-24 h-24 rounded-full flex items-center justify-center
                  transition-all duration-500
                  ${isListening
                    ? 'bg-red-500/20 border-2 border-red-400/50 scale-110'
                    : 'bg-[#5CB0CB]/10 border-2 border-[#5CB0CB]/30 hover:bg-[#5CB0CB]/20 hover:border-[#5CB0CB]/50 hover:scale-105'
                  }
                  ${(!supported || isProcessing || !isLoggedIn) ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {isListening && (
                  <>
                    <div className="absolute inset-0 rounded-full border border-red-400/30 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute -inset-3 rounded-full border border-red-400/15 animate-ping" style={{ animationDuration: '2.5s' }} />
                  </>
                )}
                {isListening ? (
                  <MicOff className="w-8 h-8 text-red-300" />
                ) : (
                  <Mic className="w-8 h-8 text-[#5CB0CB]/70" />
                )}
              </button>

              <p className="mt-6 font-cormorant text-base text-white/50 italic text-center">
                {isProcessing
                  ? t('organizing')
                  : isListening
                    ? t('listening')
                    : !isLoggedIn
                      ? t('loginToRecord')
                      : t('clickToSpeak')}
              </p>

              {/* Live transcript display */}
              {(transcript || interimTranscript) && (
                <div className={`mt-6 w-full p-4 rounded-xl bg-white/5 border border-white/10 transition-opacity duration-300 ${isProcessing ? 'opacity-50' : 'opacity-100'}`}>
                  <p className="font-cormorant text-base text-white/80 leading-relaxed">
                    {transcript}
                    <span className="text-white/30">{interimTranscript}</span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Polish result */}
        </div>
      </div>
    </div>
  );
}
