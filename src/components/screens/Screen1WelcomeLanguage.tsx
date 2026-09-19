import React, { useState, useEffect } from 'react';
import {
  Globe,
  Volume2,
  VolumeX,
  ArrowRight,
  HeartPulse,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { Language } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockClinicalData';
import { CURRENT_HOSPITAL } from '../../data/hospitals';
import {
  playTtsAudio,
  stopSpeaking,
  isBrowserVoiceAvailable,
} from '../../utils/audioUtils';

interface Screen1WelcomeLanguageProps {
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onNext: () => void;
}

export const Screen1WelcomeLanguage: React.FC<Screen1WelcomeLanguageProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onNext,
}) => {
  const [playingLangCode, setPlayingLangCode] = useState<string | null>(null);
  const [voiceNotice, setVoiceNotice] = useState<{
    message: string;
    langName: string;
    isFallback: boolean;
  } | null>(null);

  // Stop any audio when navigating away or switching screen
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  const handlePlaySample = (e: React.MouseEvent, lang: Language) => {
    e.stopPropagation();

    // If already playing this language, stop it
    if (playingLangCode === lang.code) {
      stopSpeaking();
      setPlayingLangCode(null);
      return;
    }

    stopSpeaking();
    setPlayingLangCode(lang.code);

    const hasBrowserVoice = isBrowserVoiceAvailable(lang.code);
    if (!hasBrowserVoice) {
      setVoiceNotice({
        message: 'Voice preview unavailable in this browser for this language',
        langName: lang.name,
        isFallback: true,
      });
    } else {
      setVoiceNotice(null);
    }

    playTtsAudio(
      lang.samplePhrase,
      lang.code,
      1.0,
      () => {
        setPlayingLangCode(lang.code);
      },
      () => {
        setPlayingLangCode((curr) => (curr === lang.code ? null : curr));
      },
      (info) => {
        // Visible fallback notification when browser lacks offline voice
        setVoiceNotice({
          message: 'Voice preview unavailable in this browser for this language',
          langName: lang.name,
          isFallback: true,
        });
      }
    );
  };

  const isCurrentPlaying = playingLangCode === selectedLanguage.code;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full text-emerald-300 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ayushman Bharat Digital Mission (ABDM) • {CURRENT_HOSPITAL.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              AarogyaVaani (आरोग्यवाणी)
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl">
              Welcome to the Smart Outpatient Registration & Clinical History Intake Kiosk. Please select your preferred language to begin.
            </p>
            <p className="text-xs text-emerald-300 font-medium">
              कृपया अपनी भाषा चुनें • ದಯविಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ • ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-center shrink-0">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
              <HeartPulse className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-white block">Step 1 of 10</span>
            <span className="text-[11px] text-slate-300">Welcome & Language</span>
          </div>
        </div>
      </div>

      {/* Selected Language Hero Box */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-bold font-serif shrink-0">
              {selectedLanguage.nativeName.charAt(0)}
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium uppercase tracking-wider block">
                Selected Language / चुनी गई भाषा
              </span>
              <h2 className="text-lg font-bold text-slate-900">
                {selectedLanguage.name} • {selectedLanguage.nativeName}
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                "{selectedLanguage.samplePhrase}"
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={(e) => handlePlaySample(e, selectedLanguage)}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition ${
                isCurrentPlaying
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              {isCurrentPlaying ? (
                <>
                  <VolumeX className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span>Playing... (रोकें)</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span>Listen (सुनें)</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onNext}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
            >
              <span>Continue (आगे बढ़ें)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visible Voice Fallback / Status Feedback Banner */}
        {voiceNotice && (
          <div className="p-3 bg-amber-50/90 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-amber-950">
                {voiceNotice.message}
              </p>
              <p className="text-[11px] text-amber-800">
                Playing high-clarity streaming speech audio for {voiceNotice.langName} so you can preview the pronunciation without interruption.
              </p>
            </div>
          </div>
        )}

        {isCurrentPlaying && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50/60 px-3 py-1.5 rounded-lg border border-emerald-100">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-ping" />
            <span className="font-medium">
              Audio preview is currently playing for {selectedLanguage.name} ({selectedLanguage.nativeName})...
            </span>
          </div>
        )}
      </div>

      {/* 12 Language Selection Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            <span>Select Your Language (12 Indian Languages Available)</span>
          </h2>
          <span className="text-xs text-slate-500">Tap to choose</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguage.code === lang.code;
            const isThisPlaying = playingLangCode === lang.code;

            return (
              <div
                key={lang.code}
                role="button"
                tabIndex={0}
                onClick={() => onSelectLanguage(lang)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectLanguage(lang);
                  }
                }}
                className={`p-4 rounded-xl text-left border transition relative flex flex-col justify-between cursor-pointer select-none ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-extrabold text-slate-900 block font-serif">
                      {lang.nativeName}
                    </span>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                    )}
                  </div>
                  <span className="text-xs text-slate-600 font-medium block">
                    {lang.name}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="truncate max-w-[120px] italic">
                    {lang.greeting}
                  </span>
                  <button
                    type="button"
                    title={isThisPlaying ? 'Stop Audio' : `Listen to ${lang.name} preview`}
                    onClick={(e) => handlePlaySample(e, lang)}
                    className={`p-1 rounded transition ${
                      isThisPlaying
                        ? 'bg-emerald-600 text-white'
                        : 'hover:bg-slate-100 text-slate-400 hover:text-emerald-700'
                    }`}
                  >
                    {isThisPlaying ? (
                      <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hospital Footnote */}
      <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Free public healthcare intake service under Ayushman Bharat Digital Mission (ABDM). No sign-in required for language selection.</span>
      </div>
    </div>
  );
};

