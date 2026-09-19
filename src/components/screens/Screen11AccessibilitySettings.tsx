import React, { useState } from 'react';
import {
  Eye,
  Volume2,
  Type,
  Sun,
  Moon,
  Contrast,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Accessibility,
  X,
} from 'lucide-react';
import { Language } from '../../types';
import { SUPPORTED_LANGUAGES } from '../../data/mockClinicalData';

interface Screen11AccessibilitySettingsProps {
  selectedLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  onNext?: () => void;
  onBack?: () => void;
  onClose?: () => void;
  textSize?: 'normal' | 'large' | 'xlarge';
  onTextSizeChange?: (size: 'normal' | 'large' | 'xlarge') => void;
  contrastMode?: 'default' | 'high-contrast' | 'yellow-black';
  onContrastModeChange?: (mode: 'default' | 'high-contrast' | 'yellow-black') => void;
  voiceAssistance?: boolean;
  onVoiceAssistanceChange?: (enabled: boolean) => void;
}

export const Screen11AccessibilitySettings: React.FC<Screen11AccessibilitySettingsProps> = ({
  selectedLanguage,
  onSelectLanguage,
  onNext,
  onBack,
  onClose,
  textSize: controlledTextSize,
  onTextSizeChange,
  contrastMode: controlledContrastMode,
  onContrastModeChange,
  voiceAssistance: controlledVoiceAssistance,
  onVoiceAssistanceChange,
}) => {
  const [internalTextSize, setInternalTextSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [internalContrastMode, setInternalContrastMode] = useState<
    'default' | 'high-contrast' | 'yellow-black'
  >('default');
  const [internalVoiceAssistance, setInternalVoiceAssistance] = useState(true);
  const [speechSpeed, setSpeechSpeed] = useState<'slow' | 'normal'>('normal');
  const [largeButtons, setLargeButtons] = useState(false);

  const textSize = controlledTextSize ?? internalTextSize;
  const contrastMode = controlledContrastMode ?? internalContrastMode;
  const voiceAssistance = controlledVoiceAssistance ?? internalVoiceAssistance;

  const handleSetTextSize = (size: 'normal' | 'large' | 'xlarge') => {
    setInternalTextSize(size);
    if (onTextSizeChange) onTextSizeChange(size);
  };

  const handleSetContrastMode = (mode: 'default' | 'high-contrast' | 'yellow-black') => {
    setInternalContrastMode(mode);
    if (onContrastModeChange) onContrastModeChange(mode);
  };

  const handleToggleVoiceAssistance = (val: boolean) => {
    setInternalVoiceAssistance(val);
    if (onVoiceAssistanceChange) onVoiceAssistanceChange(val);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-800/40 relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded text-emerald-300 text-[11px] font-mono uppercase tracking-wider">
                Universal Accessibility & Inclusive Settings
              </span>
              <span className="text-xs text-slate-300">अभिगम्यता एवं सुगमता सेटिंग्स</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
              <Accessibility className="w-6 h-6 text-emerald-400" />
              <span>Universal Accessibility Settings</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Customize text size, high-contrast display modes, and voice reading assistance to suit your visual, auditory, or motor comfort.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="p-3 bg-white/10 backdrop-blur rounded-xl text-center shrink-0 border border-white/10">
              <Eye className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="text-[11px] font-bold text-white block">WCAG 2.1 AAA</span>
              <span className="text-[10px] text-slate-300">Inclusive Kiosk</span>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 transition"
                title="Close settings"
                aria-label="Close settings"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Accessibility Control Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Section 1: Font Size Scaling */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Type className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Text & Display Size</h2>
              <p className="text-[11px] text-slate-500">अक्षर का आकार बदलें</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleSetTextSize('normal')}
              className={`p-3 rounded-xl border text-center transition ${
                textSize === 'normal'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="text-sm block">A</span>
              <span className="text-[10px] block mt-0.5">Standard (100%)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetTextSize('large')}
              className={`p-3 rounded-xl border text-center transition ${
                textSize === 'large'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="text-base font-bold block">A+</span>
              <span className="text-[10px] block mt-0.5">Large (125%)</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetTextSize('xlarge')}
              className={`p-3 rounded-xl border text-center transition ${
                textSize === 'xlarge'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span className="text-lg font-extrabold block">A++</span>
              <span className="text-[10px] block mt-0.5">Extra Large (150%)</span>
            </button>
          </div>
        </div>

        {/* Section 2: Color Contrast Mode */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Contrast className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Contrast & Color Theme</h2>
              <p className="text-[11px] text-slate-500">उच्च कंट्रास्ट रंग मोड</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleSetContrastMode('default')}
              className={`p-3 rounded-xl border text-center transition ${
                contrastMode === 'default'
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                  : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Sun className="w-4 h-4 mx-auto mb-1 text-amber-500" />
              <span className="text-xs font-semibold block">Clean Light</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetContrastMode('high-contrast')}
              className={`p-3 rounded-xl border text-center transition ${
                contrastMode === 'high-contrast'
                  ? 'border-emerald-600 bg-slate-900 text-white font-bold'
                  : 'border-slate-200 bg-slate-900 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Moon className="w-4 h-4 mx-auto mb-1 text-slate-300" />
              <span className="text-xs font-semibold block">High Dark</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetContrastMode('yellow-black')}
              className={`p-3 rounded-xl border text-center transition ${
                contrastMode === 'yellow-black'
                  ? 'border-amber-400 bg-black text-amber-300 font-bold'
                  : 'border-slate-300 bg-black text-amber-400 hover:bg-slate-950'
              }`}
            >
              <Contrast className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <span className="text-xs font-semibold block">Yellow/Black</span>
            </button>
          </div>
        </div>

        {/* Section 3: Audio & Voice Reading */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Volume2 className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Audio Speech Assistant</h2>
              <p className="text-[11px] text-slate-500">आवाज से पढ़कर सुनाने की सुविधा</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Text-to-Speech Voice Prompts</span>
                <span className="text-[11px] text-slate-500">Automatically read out questions in Indian languages</span>
              </div>
              <input
                type="checkbox"
                checked={voiceAssistance}
                onChange={(e) => handleToggleVoiceAssistance(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600 font-semibold">Speech Pace:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSpeechSpeed('slow')}
                  className={`px-3 py-1 rounded-lg border text-xs ${
                    speechSpeed === 'slow'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Slow (धीमा 0.8x)
                </button>
                <button
                  type="button"
                  onClick={() => setSpeechSpeed('normal')}
                  className={`px-3 py-1 rounded-lg border text-xs ${
                    speechSpeed === 'normal'
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  Normal (सामान्य 1.0x)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Motor & Touch Assistance */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Motor & Touch Targets</h2>
              <p className="text-[11px] text-slate-500">स्पर्श बटन सुगमता</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <span className="font-bold text-slate-900 block">Enlarged Touch Hit Areas</span>
                <span className="text-[11px] text-slate-500">Adds extra padding around buttons for tremor assistance</span>
              </div>
              <input
                type="checkbox"
                checked={largeButtons}
                onChange={(e) => setLargeButtons(e.target.checked)}
                className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
              />
            </label>

            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-[11px] text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Current Language: <b>{selectedLanguage.name} ({selectedLanguage.nativeName})</b></span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation / Action */}
      <div className="flex items-center justify-between gap-4 pt-2">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        ) : (
          <div />
        )}

        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Settings & Close (सेटिंग्स लागू करें एवं वापस जाएं)</span>
          </button>
        ) : onNext ? (
          <button
            type="button"
            onClick={onNext}
            className="px-7 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition"
          >
            <span>Complete Intake Session (पंजीकरण पूर्ण करें)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
};
