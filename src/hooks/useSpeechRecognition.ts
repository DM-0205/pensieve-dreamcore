import { useState, useRef, useCallback, useEffect } from 'react';

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  reset: () => void;
  error: string | null;
  supported: boolean;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      setSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((prev) => prev + finalText);
      }
      setInterimTranscript(interimText);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') {
        // User or code stopped recognition, not a real error
        return;
      }
      if (event.error === 'no-speech') {
        setError('No speech detected. Please try speaking closer to the microphone.');
      } else if (event.error === 'audio-capture') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (event.error === 'not-allowed') {
        setError('Microphone access denied. Click the lock icon in the address bar and set Microphone to "Allow", then refresh.');
      } else if (event.error === 'service-not-allowed') {
        setError('Speech recognition is blocked. Please check your browser settings or try a different browser.');
      } else {
        setError(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      try { recognition.stop(); } catch { /* ignore */ }
    };
  }, []);

  const startListening = useCallback(async () => {
    if (!recognitionRef.current) {
      setError('Speech recognition is not available in this browser.');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');

    // Try 1: First, explicitly request microphone permission via getUserMedia
    // This triggers the browser's permission popup
    let micAccess = false;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Got permission, stop the stream so SpeechRecognition can use the mic
        stream.getTracks().forEach(t => t.stop());
        micAccess = true;
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission denied. Please: 1) Click the lock icon in your address bar, 2) Set Microphone to "Allow", 3) Refresh the page.');
        return;
      } else if (err.name === 'NotFoundError') {
        setError('No microphone detected on this device. Please connect a microphone.');
        return;
      }
      // For other errors (e.g. NotSupportedError), continue to Try 2
    }

    // Try 2: Start SpeechRecognition directly
    // Some browsers will request mic permission here automatically
    setTimeout(() => {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err: any) {
        // If already running, stop first then restart
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch {
              setError('Could not start listening. Please refresh the page and try again.');
            }
          }, 150);
        } catch {
          setError('Could not start speech recognition. Please try using Chrome or Edge browser.');
        }
      }
    }, micAccess ? 200 : 100);
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch {
      // Already stopped
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const reset = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    reset,
    error,
    supported,
  };
}
