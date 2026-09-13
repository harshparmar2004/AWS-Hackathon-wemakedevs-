import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';

interface VoiceAssistantProps {
  textToSpeak?: string;
  text?: string;
  language?: string; // 'english' | 'hindi'
  label?: string;
  compact?: boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  textToSpeak,
  text,
  language = 'english',
  label,
  compact = false,
}) => {
  const speechContent = textToSpeak || text || '';
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setIsSupported(false);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // When text or language changes, stop active utterance
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  }, [speechContent, language]);

  const cleanTextForSpeech = (raw: string): string => {
    return raw
      .replace(/[#*_`~[\]()]/g, '') // remove markdown symbols
      .replace(/₹/g, ' rupees ')
      .replace(/p\.a\./g, ' per annum ')
      .replace(/kWh/g, ' kilowatt hours ')
      .replace(/DPS/g, ' delayed payment surcharge ')
      .replace(/NACH/g, ' nack ')
      .replace(/EMI/g, ' E M I ')
      .trim();
  };

  const handleSpeak = () => {
    if (!isSupported) return;

    if (isPlaying && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      return;
    }

    if (isPlaying && !isPaused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      return;
    }

    window.speechSynthesis.cancel();

    const clean = cleanTextForSpeech(speechContent);
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
    const isHindi = language?.toLowerCase().includes('hindi');

    // Attempt to pick matching voice
    const voices = window.speechSynthesis.getVoices();
    if (isHindi) {
      const hiVoice = voices.find((v) => v.lang.includes('hi') || v.name.toLowerCase().includes('hindi'));
      if (hiVoice) utterance.voice = hiVoice;
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
    } else {
      const enVoice = voices.find((v) => v.lang === 'en-IN' || v.lang === 'en-US' || v.lang === 'en-GB');
      if (enVoice) utterance.voice = enVoice;
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  if (!isSupported) return null;

  const isHindi = language?.toLowerCase().includes('hindi');
  const defaultLabel = isHindi ? 'सुनें (Voice)' : 'Listen';

  if (compact) {
    return (
      <div className="inline-flex items-center space-x-1">
        <button
          onClick={handleSpeak}
          title={isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Listen to response'}
          className={`p-1 rounded-md transition-colors ${
            isPlaying
              ? 'bg-burnt text-white'
              : 'text-ink-muted hover:text-sand-900 hover:bg-sand-200/60'
          }`}
        >
          {isPlaying ? (
            isPaused ? (
              <Play className="w-3.5 h-3.5" />
            ) : (
              <Pause className="w-3.5 h-3.5 animate-pulse" />
            )
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>
        {isPlaying && (
          <button
            onClick={handleStop}
            title="Stop listening"
            className="p-1 rounded-md text-ink-muted hover:text-red-600 hover:bg-sand-200/60"
          >
            <VolumeX className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center space-x-1.5">
      <button
        onClick={handleSpeak}
        className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all shadow-2xs ${
          isPlaying
            ? 'bg-burnt text-white border-burnt ring-2 ring-burnt/20'
            : 'bg-white hover:bg-burnt-light/50 border-sand-200 hover:border-burnt text-sand-800'
        }`}
      >
        {isPlaying ? (
          isPaused ? (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </>
          ) : (
            <>
              {/* Soundwave Bars */}
              <div className="flex items-center space-x-0.5 h-3">
                <span className="w-0.5 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-0.5 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-0.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
              </div>
              <span>Speaking...</span>
            </>
          )
        ) : (
          <>
            <Volume2 className="w-3.5 h-3.5 text-burnt" />
            <span>{label || defaultLabel}</span>
          </>
        )}
      </button>

      {isPlaying && (
        <button
          onClick={handleStop}
          className="p-1 rounded-lg bg-white border border-sand-200 text-ink-muted hover:text-red-600 hover:bg-red-50 text-xs transition-colors shadow-2xs"
          title="Stop playback"
        >
          <VolumeX className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
