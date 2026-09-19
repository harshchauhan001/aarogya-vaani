import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  HeartHandshake,
  RotateCcw,
  Smartphone,
  MapPin,
  Clock,
  Star,
  Building,
  Printer,
  FileCheck2,
  Volume2,
  VolumeX,
  Play,
  Square,
  Sparkles,
  Radio,
} from 'lucide-react';
import { OPDEncounter, Language } from '../../types';
import { HOSPITAL_DEPARTMENTS, SUPPORTED_LANGUAGES } from '../../data/mockClinicalData';
import { CURRENT_HOSPITAL } from '../../data/hospitals';
import { playHospitalDingDong, playTtsAudio, stopSpeaking } from '../../utils/audioUtils';

/**
 * Authentic next-step voice announcement translations for all 12 supported Indian languages.
 * Matches: "Your registration is complete. Your token number is #{token}. Please proceed to the OPD Waiting Lobby, Block A, and take a seat outside Room {room}. Your token will be called on the display screen."
 */
export const COMPLETION_SPEECH_MESSAGES: Record<
  string,
  (tokenNumber: string | number, roomNumber: string | number) => string
> = {
  en: (token, room) =>
    `Your registration is complete. Your token number is #${token}. Please proceed to the OPD Waiting Lobby, Block A, and take a seat outside Room ${room}. Your token will be called on the display screen.`,
  hi: (token, room) =>
    `आपका पंजीकरण पूरा हो गया है। आपका टोकन नंबर #${token} है। कृपया ओपीडी प्रतीक्षालय, ब्लॉक ए में जाएं और कमरा नंबर ${room} के बाहर बैठें। आपका टोकन डिस्प्ले स्क्रीन पर बुलाया जाएगा।`,
  bn: (token, room) =>
    `আপনার নিবন্ধন সম্পন্ন হয়েছে। আপনার টোকেন নম্বর #${token}। অনুগ্রহ করে ওপিডি ওয়েটিং লবি, ব্লক এ-তে যান এবং রুম ${room}-এর বাইরে বসুন। ডিসপ্লে স্ক্রিনে আপনার টোকেন ডাকা হবে।`,
  te: (token, room) =>
    `మీ రిజిస్ట్రేషన్ పూర్తయింది. మీ టోకెన్ నంబర్ #${token}. దయచేసి ఒపిడి వెయిటింగ్ లాబీ, బ్లాక్ ఎ కి వెళ్లి రూమ్ ${room} బయట కూర్చోండి. మీ టోకెన్ డిస్ప్లే స్క్రీన్‌పై పిలవబడుతుంది.`,
  mr: (token, room) =>
    `तुमची नोंदणी पूर्ण झाली आहे. तुमचा टोकन नंबर #${token} आहे. कृपया ओपीडी वेटिंग लॉबी, ब्लॉक ए येथे जा आणि खोली क्रमांक ${room} बाहेर बसा. तुमचा टोकन डिस्प्ले स्क्रीनवर पुकारला जाईल.`,
  ta: (token, room) =>
    `உங்கள் பதிவு முடிந்தது. உங்கள் டோக்கன் எண் #${token}. தயவுசெய்து ஓபிடி காத்திருப்பு கூடம், பிளாக் ஏ-க்கு சென்று அறை ${room}-க்கு வெளியே அமரவும். உங்கள் டோக்கன் காட்சித் திரையில் அழைக்கப்படும்.`,
  gu: (token, room) =>
    `તમારું રજીસ્ટ્રેશન પૂર્ણ થયું છે. તમારો ટોકન નંબર #${token} છે. કૃપા કરીને ઓપીડી વેઇટિંગ લોબી, બ્લોક એમાં જાઓ અને રૂમ ${room} બહાર બેસો. તમારો ટોકન ડિસ્પ્લે સ્ક્રીન પર બોલાવવામાં આવશે.`,
  kn: (token, room) =>
    `ನಿಮ್ಮ ನೋಂದಣಿ ಪೂರ್ಣಗೊಂಡಿದೆ. ನಿಮ್ಮ ಟೋಕನ್ ಸಂಖ್ಯೆ #${token}. ದಯವಿಟ್ಟು ಒಪಿಡಿ ಕಾಯುವ ಲಾಬಿ, ಬ್ಲಾಕ್ ಎ ಗೆ ಹೋಗಿ ಮತ್ತು ಕೊಠಡಿ ${room} ಹೊರಗೆ ಕುಳಿತುಕೊಳ್ಳಿ. ನಿಮ್ಮ ಟೋಕನ್ ಅನ್ನು ಪ್ರದರ್ಶನ ಪರದೆಯಲ್ಲಿ ಕರೆಯಲಾಗುತ್ತದೆ.`,
  or: (token, room) =>
    `ଆପଣଙ୍କ ପଞ୍ଜୀକରଣ ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି। ଆପଣଙ୍କ ଟୋକନ୍ ନମ୍ବର #${token}। ଦୟାକରି ଓପିଡି ପ୍ରତୀକ୍ଷା ଲବି, ବ୍ଲକ୍ ଏ-କୁ ଯାଆନ୍ତୁ ଏବଂ ରୁମ୍ ${room} ବାହାରେ ବସନ୍ତୁ। ଡିସପ୍ଲେ ସ୍କ୍ରିନରେ ଆପଣଙ୍କ ଟୋକନ୍ ଡକାଯିବ।`,
  ml: (token, room) =>
    `നിങ്ങളുടെ രജിസ്ട്രേഷൻ പൂർത്തിയായി. നിങ്ങളുടെ ടോക്കൺ നമ്പർ #${token} ആണ്. ദയവായി ഒപിഡി വെയിറ്റിംഗ് ലോബി, ബ്ലോക്ക് എ-യിലേക്ക് പോയി റൂം ${room}-ന് പുറത്ത് ഇരിക്കുക. നിങ്ങളുടെ ടോക്കൺ ഡിസ്പ്ലേ സ്ക്രീനിൽ വിളിക്കും.`,
  pa: (token, room) =>
    `ਤੁਹਾਡੀ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਪੂਰੀ ਹੋ ਗਈ ਹੈ। ਤੁਹਾਡਾ ਟੋਕਨ ਨੰਬਰ #${token} ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਓਪੀਡੀ ਵੇਟਿੰਗ ਲਾਬੀ, ਬਲਾਕ ਏ ਵਿੱਚ ਜਾਓ ਅਤੇ ਕਮਰਾ ${room} ਦੇ ਬਾਹਰ ਬੈਠੋ। ਤੁਹਾਡਾ ਟੋਕਨ ਡਿਸਪਲੇਅ ਸਕਰੀਨ 'ਤੇ ਬੁਲਾਇਆ ਜਾਵੇਗਾ।`,
  as: (token, room) =>
    `আপোনাৰ পঞ্জীয়ন সম্পূৰ্ণ হৈছে। আপোনাৰ টোকেন নম্বৰ #${token}। অনুগ্ৰহ কৰি অ'পিডি ৱেটিং লবী, ব্লক এ-লৈ যাওক আৰু কোঠা ${room}-ৰ বাহিৰত বহক। ডিচপ্লে' স্ক্ৰীণত আপোনাৰ টোকেন মতা হ'ব।`,
};

interface Screen13SessionCompleteProps {
  encounter: OPDEncounter;
  selectedLanguage?: Language;
  soundEnabled?: boolean;
  onResetSession: () => void;
  onViewSummarySlip: () => void;
}

export const Screen13SessionComplete: React.FC<Screen13SessionCompleteProps> = ({
  encounter,
  selectedLanguage,
  soundEnabled = true,
  onResetSession,
  onViewSummarySlip,
}) => {
  const [rating, setRating] = useState<number | null>(5);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioAutoplayAttempted, setAudioAutoplayAttempted] = useState(false);

  const dept =
    HOSPITAL_DEPARTMENTS.find((d) => d.id === encounter.departmentId) || HOSPITAL_DEPARTMENTS[0];

  const tokenNum = encounter.tokenNumber || 104;
  const roomNum = dept.roomNumber || '101';

  // Determine active patient language
  const activeLangCode = (
    selectedLanguage?.code ||
    encounter.patient.preferredLanguage ||
    'hi'
  )
    .toLowerCase()
    .split('-')[0];

  const activeLangObj =
    selectedLanguage ||
    SUPPORTED_LANGUAGES.find((l) => l.code === activeLangCode) ||
    SUPPORTED_LANGUAGES[0];

  // Resolve spoken message in patient's selected language
  const msgGenerator =
    COMPLETION_SPEECH_MESSAGES[activeLangCode] || COMPLETION_SPEECH_MESSAGES['en'];
  const spokenMessage = msgGenerator(tokenNum, roomNum);

  const hasPlayedRef = useRef(false);

  // Function to initiate spoken announcement
  const playAnnouncement = (withChime = true) => {
    stopSpeaking();

    if (withChime && soundEnabled) {
      try {
        playHospitalDingDong();
      } catch (err) {
        console.warn('Hospital chime error:', err);
      }
    }

    setIsAudioPlaying(true);
    setAudioAutoplayAttempted(true);

    const speechDelay = withChime && soundEnabled ? 500 : 50;

    const t = setTimeout(() => {
      playTtsAudio(
        spokenMessage,
        activeLangCode,
        1.0,
        () => {
          setIsAudioPlaying(true);
        },
        () => {
          setIsAudioPlaying(false);
        }
      );
    }, speechDelay);

    return () => clearTimeout(t);
  };

  const handleStopAudio = () => {
    stopSpeaking();
    setIsAudioPlaying(false);
  };

  // AUTOMATIC PLAYBACK THE MOMENT THIS SCREEN LOADS (No manual click required)
  useEffect(() => {
    if (hasPlayedRef.current) return;
    hasPlayedRef.current = true;

    // Trigger immediately upon mount
    const cleanupTimer = playAnnouncement(true);

    return () => {
      if (cleanupTimer) cleanupTimer();
      stopSpeaking();
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-center">
      {/* Success Badge & Header */}
      <div className="space-y-3">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-lg border-2 border-emerald-300 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
            Step 10 of 10 • Patient Intake Completed
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
            Registration & Intake Complete!
          </h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
            आपकी पंजीकरण प्रक्रिया सफलतापूर्वक पूरी हो गई है।
          </p>
        </div>
      </div>

      {/* Spoken Voice Announcement Live Status Banner */}
      <div
        className={`max-w-xl mx-auto rounded-2xl p-4 border transition-all duration-300 flex items-center justify-between gap-3 text-left ${
          isAudioPlaying
            ? 'bg-emerald-900/90 text-white border-emerald-500/80 shadow-lg ring-2 ring-emerald-400/40'
            : 'bg-white text-slate-800 border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isAudioPlaying
                ? 'bg-emerald-500 text-white animate-pulse'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isAudioPlaying ? (
              <Radio className="w-5 h-5 animate-spin" />
            ) : (
              <Volume2 className="w-5 h-5 text-emerald-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold ${
                  isAudioPlaying ? 'text-emerald-200' : 'text-slate-900'
                }`}
              >
                {isAudioPlaying ? 'Playing Spoken Instructions' : 'Voice Guidance Available'}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                  isAudioPlaying
                    ? 'bg-emerald-800 text-emerald-100'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {activeLangObj.name} ({activeLangObj.nativeName})
              </span>
            </div>
            <p
              className={`text-[11px] line-clamp-1 mt-0.5 ${
                isAudioPlaying ? 'text-emerald-100 font-medium' : 'text-slate-500'
              }`}
            >
              {spokenMessage}
            </p>
          </div>
        </div>

        <div className="shrink-0">
          {isAudioPlaying ? (
            <button
              id="stop-completion-audio-btn"
              type="button"
              onClick={handleStopAudio}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border border-emerald-700"
              title="Stop voice playback"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop (रोकें)</span>
            </button>
          ) : (
            <button
              id="replay-completion-audio-btn"
              type="button"
              onClick={() => playAnnouncement(true)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              title="Listen to voice instructions again"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Listen (पुनः सुनें)</span>
            </button>
          )}
        </div>
      </div>

      {/* Big Token Number Card */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-emerald-800/40 max-w-xl mx-auto space-y-4">
        <span className="text-xs uppercase tracking-widest text-emerald-300 font-bold block">
          Your OPD Consultation Token
        </span>
        <div className="text-5xl sm:text-6xl font-extrabold font-mono text-emerald-400">
          #{tokenNum}
        </div>

        <div className="pt-3 border-t border-emerald-800/60 grid grid-cols-2 gap-3 text-xs">
          <div className="text-left">
            <span className="text-slate-400 block text-[11px]">Patient Name:</span>
            <span className="font-bold text-white text-sm">{encounter.patient.name}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[11px]">Assigned Room:</span>
            <span className="font-bold text-emerald-300 text-sm">
              Room {roomNum} ({dept.name})
            </span>
          </div>
        </div>
      </div>

      {/* Next Steps Guidance */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm max-w-xl mx-auto text-left space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            What to do next (आगे क्या करें):
          </h2>
          <span className="text-[11px] text-emerald-700 font-medium">
            Spoken in {activeLangObj.name}
          </span>
        </div>

        <div className="space-y-3.5 text-xs text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                Proceed to OPD Waiting Lobby (Block A)
              </span>
              <span className="text-slate-500">
                Please take a seat in the waiting lounge outside Room {roomNum}.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                Watch the Overhead Display Screen
              </span>
              <span className="text-slate-500">
                Your Token #{tokenNum} will be called when the physician is ready.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <span className="font-bold text-slate-900 block">
                SMS Confirmation Sent
              </span>
              <span className="text-slate-500">
                A digital receipt and token link has been sent to +91 {encounter.patient.phone || '9876543210'}.
              </span>
            </div>
          </div>
        </div>

        {/* Read-out box for spoken message */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-900 font-bold text-[11px]">
            <Volume2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Spoken Announcement Transcript ({activeLangObj.nativeName}):</span>
          </div>
          <p className="text-emerald-950 italic text-[12px] leading-relaxed">
            "{spokenMessage}"
          </p>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
          <button
            id="view-summary-slip-btn"
            type="button"
            onClick={onViewSummarySlip}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-700" />
            <span>View / Print OPD Slip</span>
          </button>

          <span className="text-[11px] text-slate-400 font-mono">
            {CURRENT_HOSPITAL.name} Digital Health Record
          </span>
        </div>
      </div>

      {/* Kiosk Feedback Rating */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm max-w-xl mx-auto space-y-3">
        <span className="text-xs font-bold text-slate-700 block">
          How was your kiosk intake experience today? (कियोस्क अनुभव रेटिंग)
        </span>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              id={`rating-star-${star}`}
              type="button"
              onClick={() => {
                setRating(star);
                setFeedbackSubmitted(true);
              }}
              className="p-1 text-amber-400 hover:scale-125 transition"
            >
              <Star
                className={`w-7 h-7 ${
                  rating && rating >= star ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                }`}
              />
            </button>
          ))}
        </div>

        {feedbackSubmitted && (
          <span className="text-[11px] text-emerald-700 font-semibold block animate-fade-in">
            Thank you for your feedback! आपका धन्यवाद!
          </span>
        )}
      </div>

      {/* Reset Kiosk for Next Patient */}
      <div className="pt-2 max-w-xl mx-auto">
        <button
          id="reset-kiosk-session-btn"
          type="button"
          onClick={onResetSession}
          className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
        >
          <RotateCcw className="w-4 h-4 text-emerald-400" />
          <span>Start New Intake for Next Citizen (अगले रोगी के लिए नया सत्र)</span>
        </button>
      </div>
    </div>
  );
};

