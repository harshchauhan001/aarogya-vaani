// Web Audio & Speech Utility for AarogyaVaani

export function playHospitalDingDong() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    // Two-tone hospital chime: High pitch (G5 784Hz) followed by Low pitch (C5 523Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(783.99, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.6);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(523.25, now + 0.35);
    gain2.gain.setValueAtTime(0.35, now + 0.35);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.35);
    osc2.stop(now + 1.2);
  } catch (err) {
    console.warn('Audio Context chime error:', err);
  }
}

export function playEmergencyAlertSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Siren beep
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now + i * 0.2);
      gain.gain.setValueAtTime(0.4, now + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.01, now + (i + 1) * 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.2);
      osc.stop(now + (i + 1) * 0.2);
    }
  } catch (err) {
    console.warn('Emergency alert sound error:', err);
  }
}

// BCP-47 Locale codes mapping for Indian Languages
export const BCP47_LOCALE_MAP: Record<string, string> = {
  hi: 'hi-IN',
  en: 'en-IN',
  bn: 'bn-IN',
  te: 'te-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  as: 'as-IN',
  or: 'or-IN',
};

// Track active HTMLAudioElement to ensure clean audio stoppage
let activeAudioElement: HTMLAudioElement | null = null;

export function stopSpeaking() {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // ignore
    }
    activeAudioElement = null;
  }

  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (err) {
      console.warn('Speech cancellation error:', err);
    }
  }
}

/**
 * Searches the browser's speechSynthesis voice registry for a voice matching
 * the requested language code.
 *
 * CRITICAL FIX: NEVER match English (en-IN) voices for non-English languages
 * (e.g., Hindi, Bengali) simply because the voice has "India" in its name.
 */
export function findBrowserVoice(langCode: string = 'hi'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return null;
  }

  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const baseCode = langCode.toLowerCase().split('-')[0];
  const targetBcp47 = (BCP47_LOCALE_MAP[baseCode] || `${baseCode}-IN`).toLowerCase();

  // 1. Exact BCP-47 match (e.g. "hi-IN" or "hi_IN")
  let matched = voices.find((v) => v.lang.replace('_', '-').toLowerCase() === targetBcp47);
  if (matched) return matched;

  // 2. Base language prefix match (e.g. "hi" or starts with "hi-")
  matched = voices.find((v) => {
    const vLang = v.lang.replace('_', '-').toLowerCase();
    return vLang === baseCode || vLang.startsWith(`${baseCode}-`);
  });
  if (matched) return matched;

  // 3. Name-based match for the native language script or language name
  const langNameKeywords: Record<string, string[]> = {
    hi: ['hindi', 'हिन्दी'],
    bn: ['bengali', 'bangla', 'বাংলা'],
    te: ['telugu', 'తెలుగు'],
    mr: ['marathi', 'मराठी'],
    ta: ['tamil', 'தமிழ்'],
    gu: ['gujarati', 'ગુજરાતી'],
    kn: ['kannada', 'ಕನ್ನಡ'],
    ml: ['malayalam', 'മലയാളം'],
    pa: ['punjabi', 'ਪੰਜਾਬੀ'],
    as: ['assamese', 'অসমীয়া'],
    or: ['odia', 'oriya', 'ଓଡ଼ିଆ'],
    en: ['english', 'en-in', 'en-us', 'en-gb'],
  };

  const keywords = langNameKeywords[baseCode] || [];
  if (keywords.length > 0) {
    matched = voices.find((v) => {
      const vName = v.name.toLowerCase();
      // Crucial: do NOT pick English voices for non-English Indian languages
      if (baseCode !== 'en' && (v.lang.toLowerCase().startsWith('en') || vName.includes('english'))) {
        return false;
      }
      return keywords.some((kw) => vName.includes(kw));
    });
    if (matched) return matched;
  }

  // 4. For English, fallback to any available English voice
  if (baseCode === 'en') {
    return voices.find((v) => v.lang.toLowerCase().startsWith('en')) || null;
  }

  return null;
}

/**
 * Checks whether a voice for the specified language is currently available
 * in the browser's speechSynthesis engine.
 */
export function isBrowserVoiceAvailable(langCode: string = 'hi'): boolean {
  return findBrowserVoice(langCode) !== null;
}

/**
 * Strict Safety Sanitizer: Ensures the AI assistant NEVER refers to itself as
 * "Dr." or "Doctor" in spoken audio or displayed assistant responses.
 */
export function sanitizeAssistantSpeech(text: string): string {
  if (!text) return '';
  return text
    // Hindi & Devanagari patterns
    .replace(/डॉ\.?\s*आरोग्यवाणी/g, 'आरोग्यवाणी, आपकी स्वास्थ्य सहायक')
    .replace(/डॉक्टर\s*आरोग्यवाणी/g, 'आरोग्यवाणी, आपकी स्वास्थ्य सहायक')
    .replace(/\bमैं\s+डॉ\.?\s*आरोग्यवाणी\s*हूँ/g, 'मैं आरोग्यवाणी हूँ, आपकी स्वास्थ्य सहायक')
    .replace(/\bमैं\s+डॉक्टर\s*आरोग्यवाणी\s*हूँ/g, 'मैं आरोग्यवाणी हूँ, आपकी स्वास्थ्य सहायक')
    .replace(/\bमैं\s+डॉ\.?\s*आरोग्यवाणी/g, 'मैं आरोग्यवाणी')
    // English patterns
    .replace(/\bDr\.?\s*AarogyaVaani\b/gi, 'AarogyaVaani, your health assistant')
    .replace(/\bDr\.?\s*Aarogya\b/gi, 'AarogyaVaani')
    .replace(/\bDoctor\s*AarogyaVaani\b/gi, 'AarogyaVaani, your health assistant')
    .replace(/\bI am Dr\.?\s*AarogyaVaani\b/gi, 'I am AarogyaVaani, your health assistant')
    .replace(/\bI am Doctor\s*AarogyaVaani\b/gi, 'I am AarogyaVaani, your health assistant');
}

/**
 * Streams crystal-clear, natural speech audio from the server /api/tts endpoint.
 * Works across all browsers and devices even when the OS lacks native regional voice packs.
 */
export function playServerTtsAudio(
  text: string,
  langCode: string = 'hi',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
) {
  stopSpeaking();

  try {
    const cleanText = sanitizeAssistantSpeech(text).trim();
    if (!cleanText) {
      onEnd?.();
      return;
    }

    const url = `/api/tts?lang=${encodeURIComponent(langCode)}&text=${encodeURIComponent(cleanText)}`;
    const audio = new Audio(url);
    activeAudioElement = audio;

    audio.onplay = () => {
      onStart?.();
    };

    audio.onended = () => {
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
      onEnd?.();
    };

    audio.onerror = (e) => {
      if (activeAudioElement === audio) {
        activeAudioElement = null;
      }
      console.warn('Server TTS audio playback error:', e);
      onError?.(e);
      onEnd?.();
    };

    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch((err) => {
        console.warn('Server audio playback interrupted or blocked by browser policy:', err);
        if (activeAudioElement === audio) {
          activeAudioElement = null;
        }
        onError?.(err);
        onEnd?.();
      });
    }
  } catch (err) {
    console.warn('Error starting server TTS audio:', err);
    onError?.(err);
    onEnd?.();
  }
}

/**
 * High-reliability speech playback:
 * 1. Checks if browser has a native voice for the requested language.
 * 2. If available, uses native SpeechSynthesis.
 * 3. If no browser voice is installed, or if native speech throws an error,
 *    seamlessly plays high-fidelity audio from /api/tts.
 * 4. Calls onVoiceFallback if native browser voice was missing.
 */
export function playTtsAudio(
  text: string,
  langCode: string = 'hi',
  rate: number = 1.0,
  onStart?: () => void,
  onEnd?: () => void,
  onVoiceFallback?: (info: { reason: string; langCode: string }) => void
) {
  stopSpeaking();

  const sanitized = sanitizeAssistantSpeech(text);
  const baseCode = langCode.toLowerCase().split('-')[0];
  const targetBcp47 = BCP47_LOCALE_MAP[baseCode] || 'hi-IN';

  const hasSpeechSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const matchedVoice = hasSpeechSynthesis ? findBrowserVoice(baseCode) : null;

  // Case 1: Browser lacks a native voice for this language
  if (!matchedVoice) {
    onVoiceFallback?.({
      reason: 'browser_voice_unavailable',
      langCode: baseCode,
    });
    playServerTtsAudio(sanitized, baseCode, onStart, onEnd);
    return;
  }

  // Case 2: Browser HAS a native voice for this language
  try {
    const utterance = new SpeechSynthesisUtterance(sanitized);
    utterance.rate = rate;
    utterance.pitch = 1.0;
    utterance.lang = targetBcp47;
    utterance.voice = matchedVoice;

    let hasEnded = false;
    let fallbackTriggered = false;

    const fallbackToServer = () => {
      if (fallbackTriggered || hasEnded) return;
      fallbackTriggered = true;
      onVoiceFallback?.({
        reason: 'synthesis_failed',
        langCode: baseCode,
      });
      playServerTtsAudio(sanitized, baseCode, onStart, onEnd);
    };

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      hasEnded = true;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis utterance error, falling back to server TTS:', e);
      fallbackToServer();
    };

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('SpeechSynthesis error, falling back to server audio:', err);
    onVoiceFallback?.({
      reason: 'exception',
      langCode: baseCode,
    });
    playServerTtsAudio(sanitized, baseCode, onStart, onEnd);
  }
}

export function speakText(
  text: string,
  langCode: string = 'hi',
  rate: number = 1.0,
  onStart?: () => void,
  onEnd?: () => void
) {
  playTtsAudio(text, langCode, rate, onStart, onEnd);
}


