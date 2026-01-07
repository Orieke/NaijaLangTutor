// Text-to-Speech utility for Igbo language content
// Uses Web Speech API with fallback options

interface SpeakOptions {
  text: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

class AudioService {
  private synth: SpeechSynthesis | null = null;
  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      this.synth = window.speechSynthesis;
    }
  }

  /**
   * Check if speech synthesis is available
   */
  isAvailable(): boolean {
    return this.synth !== null;
  }

  /**
   * Get available voices, optionally filtered by language
   */
  getVoices(lang?: string): SpeechSynthesisVoice[] {
    if (!this.synth) return [];
    
    let voices = this.synth.getVoices();
    
    if (lang) {
      // Try to find voices for the specific language
      voices = voices.filter(v => v.lang.startsWith(lang));
    }
    
    return voices;
  }

  /**
   * Speak text using Web Speech API
   * For Igbo, we'll use Nigerian English or generic voices as fallback
   */
  speak(options: SpeakOptions): void {
    const {
      text,
      lang = 'en-NG', // Nigerian English as default (closer to Igbo phonetics)
      rate = 0.85, // Slightly slower for language learning
      pitch = 1,
      onStart,
      onEnd,
      onError,
    } = options;

    if (!this.synth) {
      onError?.('Speech synthesis not available in this browser');
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find the best voice
    const voices = this.synth.getVoices();
    
    // Priority: Nigerian English > any English > default
    const nigerianVoice = voices.find(v => v.lang === 'en-NG');
    const englishVoice = voices.find(v => v.lang.startsWith('en'));
    
    if (nigerianVoice) {
      utterance.voice = nigerianVoice;
    } else if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    utterance.onstart = () => onStart?.();
    utterance.onend = () => onEnd?.();
    utterance.onerror = (event) => onError?.(event.error);

    this.synth.speak(utterance);
  }

  /**
   * Stop any currently playing speech
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement = null;
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeaking(): boolean {
    return this.synth?.speaking || false;
  }

  /**
   * Play audio from a URL (for recorded audio)
   */
  async playAudioUrl(
    url: string, 
    onStart?: () => void, 
    onEnd?: () => void,
    onError?: (error: string) => void
  ): Promise<void> {
    this.stop();

    return new Promise((resolve, reject) => {
      const audio = new Audio(url);
      this.audioElement = audio;

      audio.onplay = () => onStart?.();
      audio.onended = () => {
        onEnd?.();
        this.audioElement = null;
        resolve();
      };
      audio.onerror = () => {
        const error = 'Failed to play audio';
        onError?.(error);
        this.audioElement = null;
        reject(new Error(error));
      };

      audio.play().catch((err) => {
        onError?.(err.message);
        reject(err);
      });
    });
  }

  /**
   * Pause currently playing audio
   */
  pause(): void {
    if (this.synth?.speaking) {
      this.synth.pause();
    }
    if (this.audioElement) {
      this.audioElement.pause();
    }
  }

  /**
   * Resume paused audio
   */
  resume(): void {
    if (this.synth?.paused) {
      this.synth.resume();
    }
    if (this.audioElement?.paused) {
      this.audioElement.play();
    }
  }
}

// Singleton instance
export const audioService = new AudioService();

// React hook for using audio service
import { useState, useCallback, useEffect } from 'react';

export function useAudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load voices when component mounts (voices are loaded async in some browsers)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Force load voices
      window.speechSynthesis.getVoices();
      
      // Some browsers need this event listener
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);

  const speak = useCallback((text: string, options?: Partial<SpeakOptions>) => {
    setError(null);
    audioService.speak({
      text,
      ...options,
      onStart: () => {
        setIsPlaying(true);
        options?.onStart?.();
      },
      onEnd: () => {
        setIsPlaying(false);
        options?.onEnd?.();
      },
      onError: (err) => {
        setIsPlaying(false);
        setError(err);
        options?.onError?.(err);
      },
    });
  }, []);

  const playUrl = useCallback(async (url: string) => {
    setError(null);
    try {
      await audioService.playAudioUrl(
        url,
        () => setIsPlaying(true),
        () => setIsPlaying(false),
        (err) => {
          setIsPlaying(false);
          setError(err);
        }
      );
    } catch {
      // Error already handled in callback
    }
  }, []);

  const stop = useCallback(() => {
    audioService.stop();
    setIsPlaying(false);
  }, []);

  const pause = useCallback(() => {
    audioService.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioService.resume();
    setIsPlaying(true);
  }, []);

  return {
    isPlaying,
    error,
    speak,
    playUrl,
    stop,
    pause,
    resume,
    isAvailable: audioService.isAvailable(),
  };
}
