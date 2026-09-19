import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileText,
  User,
  Bot,
  Loader2,
  Stethoscope,
  Leaf,
  CheckCircle2,
  RotateCcw,
  Clock,
  Layers,
  HelpCircle,
  Activity,
  Flame,
  Moon,
  ShieldAlert,
  Keyboard,
} from 'lucide-react';
import {
  Patient,
  Language,
  ConsultationMode,
  ClinicalHistory,
  TriageAssessment,
  QuestionBankDomain,
  INITIAL_EMPTY_CLINICAL_HISTORY,
  INITIAL_EMPTY_TRIAGE,
} from '../../types';
import { GENERAL_QUESTION_BANK, AYUSH_QUESTION_BANK } from '../../data/questionBank';
import { playTtsAudio, stopSpeaking } from '../../utils/audioUtils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  domainCode?: string;
  domainName?: string;
  timestamp: string;
}

// Deduplicate and canonicalize clinical list items to prevent duplication (e.g. "Taking BP medications" vs "BP medications")
export function cleanDeduplicateClinicalList(
  existingList: string[] = [],
  newItems: string[] = []
): string[] {
  const combined = [...(existingList || []), ...(newItems || [])];
  const uniqueItems: string[] = [];

  const canonicalize = (val: string) => {
    return val
      .toLowerCase()
      .replace(
        /^(taking|takes|taken|on|history of|known case of|diagnosed with|has|suffering from|allergic to)\s+/gi,
        ''
      )
      .replace(/\b(daily|regular|regularly|tablets?|meds?|medications?|pills?)\b/gi, '')
      .replace(/[.,;:()\-]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  for (const raw of combined) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const canon = canonicalize(trimmed);
    if (!canon) continue;

    const existingIdx = uniqueItems.findIndex((existing) => {
      const existingCanon = canonicalize(existing);
      return (
        existingCanon === canon ||
        existingCanon.includes(canon) ||
        canon.includes(existingCanon)
      );
    });

    if (existingIdx === -1) {
      uniqueItems.push(trimmed);
    } else {
      // If one of them is shorter and cleaner without filler words like "taking", prefer the cleaner one
      const existing = uniqueItems[existingIdx];
      const hasPrefixExisting = /^(taking|on|history of|suffering from)/i.test(existing);
      const hasPrefixCurrent = /^(taking|on|history of|suffering from)/i.test(trimmed);

      if (hasPrefixExisting && !hasPrefixCurrent) {
        uniqueItems[existingIdx] = trimmed;
      }
    }
  }

  return uniqueItems;
}

interface Screen5ConversationalChatProps {
  patient: Patient;
  selectedLanguage: Language;
  consultationMode: ConsultationMode;
  departmentId: string;
  history: ClinicalHistory;
  triage: TriageAssessment;
  sessionId?: string;
  onUpdateHistory: (updates: Partial<ClinicalHistory>) => void;
  onUpdateTriage: (updates: Partial<TriageAssessment>) => void;
  onSelectConsultationMode?: (mode: ConsultationMode) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Screen5ConversationalChat: React.FC<Screen5ConversationalChatProps> = ({
  patient,
  selectedLanguage,
  consultationMode,
  departmentId,
  history,
  triage,
  sessionId,
  onUpdateHistory,
  onUpdateTriage,
  onSelectConsultationMode,
  onNext,
  onBack,
}) => {
  // Session tracking: guarantee fresh unique session ID per intake chat
  const [currentSessionId, setCurrentSessionId] = useState<string>(
    () => sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  );

  // Sync external sessionId prop if changed
  useEffect(() => {
    if (sessionId && sessionId !== currentSessionId) {
      setCurrentSessionId(sessionId);
    }
  }, [sessionId]);
  // Mode state: defaults to prop, allows active switching
  const [activeMode, setActiveMode] = useState<ConsultationMode>(consultationMode || 'GENERAL');
  const isAyush = activeMode === 'AYUSH';

  // Active Question Bank pool based on Consultation Mode
  const questionBank: QuestionBankDomain[] = isAyush ? AYUSH_QUESTION_BANK : GENERAL_QUESTION_BANK;

  // Domain tracking state
  const [activeDomainIndex, setActiveDomainIndex] = useState<number>(0);
  const [completedDomains, setCompletedDomains] = useState<string[]>([]);
  const currentDomain = questionBank[activeDomainIndex] || questionBank[0];

  // Terminal Completion state: once reached, questions END and only navigation is active
  const [isHistoryComplete, setIsHistoryComplete] = useState<boolean>(false);
  const [thankYouAcknowledged, setThankYouAcknowledged] = useState<boolean>(false);

  // Guaranteed 3-4 Large Answer Options for EVERY question (Strict SRS FR-CONV.2 Accessibility)
  const domainFallbackOptions =
    selectedLanguage.code === 'hi'
      ? currentDomain.sampleResponsesHi
      : currentDomain.sampleResponsesEn;

  // Chat UI states
  const [messages, setMessages] = useState<Message[]>([]);
  const [quickOptions, setQuickOptions] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const lastSpokenMsgIdRef = useRef<string | null>(null);

  // Guarantee 3-4 options are always visible simultaneously with the mic button
  const displayedOptions: string[] =
    quickOptions.length >= 3
      ? quickOptions.slice(0, 4)
      : Array.from(new Set([...quickOptions, ...domainFallbackOptions])).slice(0, 4);

  const chatBottomRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef<boolean>(false);

  // Auto-scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Auto-play text-to-speech for each new AI assistant question upon appearance (Elderly/low-literacy accessibility)
  useEffect(() => {
    if (messages.length === 0) return;
    const latestMsg = messages[messages.length - 1];

    if (latestMsg.role === 'assistant' && latestMsg.id !== lastSpokenMsgIdRef.current) {
      lastSpokenMsgIdRef.current = latestMsg.id;
      setSpeakingMessageId(latestMsg.id);

      // Auto-trigger SpeechSynthesis call
      playTtsAudio(
        latestMsg.content,
        selectedLanguage.code,
        1.0,
        () => setSpeakingMessageId(latestMsg.id),
        () => {
          setSpeakingMessageId((current) => (current === latestMsg.id ? null : current));
        }
      );
    }
  }, [messages, selectedLanguage.code]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Handle Mode Switch (General vs AYUSH)
  const handleSwitchMode = (newMode: ConsultationMode) => {
    if (newMode === activeMode) return;
    stopSpeaking();
    setSpeakingMessageId(null);
    lastSpokenMsgIdRef.current = null;
    setActiveMode(newMode);
    setIsHistoryComplete(false);
    setThankYouAcknowledged(false);
    if (onSelectConsultationMode) {
      onSelectConsultationMode(newMode);
    }
    // Re-initialize conversation for the new mode's Question Bank with fresh session ID and clean history
    const newSessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setCurrentSessionId(newSessId);
    setActiveDomainIndex(0);
    setCompletedDomains([]);
    setMessages([]);
    onUpdateHistory(INITIAL_EMPTY_CLINICAL_HISTORY);
    onUpdateTriage(INITIAL_EMPTY_TRIAGE);
    initOpeningTurn(newMode, 0, newSessId);
  };

  // Initialize the opening turn from Gemini using the Question Bank
  const initOpeningTurn = useCallback(
    async (mode: ConsultationMode, domainIdx: number = 0, sessId?: string) => {
      setIsHistoryComplete(false);
      setThankYouAcknowledged(false);
      const bank = mode === 'AYUSH' ? AYUSH_QUESTION_BANK : GENERAL_QUESTION_BANK;
      const initialDomain = bank[domainIdx] || bank[0];
      setIsTyping(true);

      try {
        const res = await fetch('/api/gemini/conversational-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessId || currentSessionId,
            messages: [],
            consultationMode: mode,
            language: selectedLanguage.name,
            patientInfo: {
              name: patient.name || 'Patient',
              age: patient.age,
              gender: patient.gender,
            },
            department: departmentId,
            currentDomainId: initialDomain.id,
            completedDomains: [],
            currentFacts: {}, // Strict Rule: Session starts with 100% clean, empty clinical facts
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          const reply = data.data;
          const isEn = selectedLanguage.code === 'en';
          const defaultGreeting = isEn
            ? (mode === 'AYUSH'
                ? `Hello ${patient.name || ''}. I am AarogyaVaani, your AYUSH health intake assistant. What primary health discomfort, pain, or imbalance brings you to the hospital today?`
                : `Hello ${patient.name || ''}. I am AarogyaVaani, your health assistant. What brings you to the hospital today? Please describe your main health concern or symptom.`)
            : (mode === 'AYUSH'
                ? `नमस्ते ${patient.name || ''} जी। मैं आरोग्यवाणी हूँ, आपकी आयुष स्वास्थ्य सहायक। आप किस मुख्य शारीरिक तकलीफ या असंतुलन के लिए आए हैं?`
                : `नमस्ते ${patient.name || ''} जी। मैं आरोग्यवाणी हूँ, आपकी स्वास्थ्य सहायक। आज अस्पताल आने का आपका मुख्य कारण या सबसे बड़ी तकलीफ क्या है?`);

          const greetingMsg: Message = {
            id: `m-init-${Date.now()}`,
            role: 'assistant',
            content: reply.replyMessage || defaultGreeting,
            translation: isEn ? '' : (reply.replyMessageEnglish || initialDomain.coreQuestionsEn[0]),
            domainCode: initialDomain.code,
            domainName: initialDomain.nameEn,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          };

          setMessages([greetingMsg]);

          // Turn 1 Rule: Opening question has NO tap options (free-text or voice only)
          setQuickOptions([]);
        }
      } catch (err) {
        console.error('Failed to init opening turn with Gemini:', err);
        const isEn = selectedLanguage.code === 'en';
        const fallbackMsg: Message = {
          id: `m-init-fb-${Date.now()}`,
          role: 'assistant',
          content: isEn
            ? `Hello ${patient.name || ''}. I am AarogyaVaani, your health assistant. What brings you to the hospital today? Please describe your main symptom or health concern.`
            : `नमस्ते ${patient.name || ''} जी। मैं आरोग्यवाणी हूँ, आपकी स्वास्थ्य सहायक। आज अस्पताल आने का आपका मुख्य कारण या सबसे बड़ी तकलीफ क्या है? कृपया बताएं।`,
          translation: isEn ? '' : initialDomain.coreQuestionsEn[0],
          domainCode: initialDomain.code,
          domainName: initialDomain.nameEn,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([fallbackMsg]);
        setQuickOptions([]);
      } finally {
        setIsTyping(false);
      }
    },
    [currentSessionId, departmentId, patient.age, patient.gender, patient.name, selectedLanguage]
  );

  // Run initial turn on mount: clear prior session data to guarantee completely empty start
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      onUpdateHistory(INITIAL_EMPTY_CLINICAL_HISTORY);
      onUpdateTriage(INITIAL_EMPTY_TRIAGE);
      initOpeningTurn(activeMode, 0);
    }
  }, [activeMode, initOpeningTurn, onUpdateHistory, onUpdateTriage]);

  // Handle Sending a Turn (User typed, spoken, or tapped dynamic suggestion)
  const handleSendTurn = async (rawText?: string) => {
    stopSpeaking();
    setSpeakingMessageId(null);
    const text = (rawText || inputVal).trim();
    if (!text || isTyping) return;

    const isReadyForConsult = /ready\s*(for)?\s*consult|continue\s*intake|आगे\s*बढ़ें|परामर्श\s*के\s*लिए\s*तैयार/i.test(text);
    const isThankYou = /^(thank\s*you|thanks|thank\s*u|धन्यवाद|शुक्रिया)[!.]*$/i.test(text);

    // If user tapped or selected "Ready for consultation" / "Continue Intake"
    if (isReadyForConsult) {
      stopSpeaking();
      setSpeakingMessageId(null);
      onNext();
      return;
    }

    // If user tapped or said "Thank you"
    if (isThankYou) {
      stopSpeaking();
      setSpeakingMessageId(null);
      setThankYouAcknowledged(true);
      setIsHistoryComplete(true);
      setInputVal('');

      const userAckMsg: Message = {
        id: `m-user-ack-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const isEn = selectedLanguage.code === 'en';
      const botAckMsg: Message = {
        id: `m-bot-ack-${Date.now()}`,
        role: 'assistant',
        content: isEn
          ? 'You are welcome! Your clinical intake history has been finalized and securely saved. Please click "Ready for consultation" below to proceed.'
          : 'आपका स्वागत है! आपका स्वास्थ्य इतिहास दर्ज हो चुका है। कृपया आगे बढ़ने के लिए नीचे "परामर्श के लिए तैयार" बटन दबाएं।',
        translation: isEn ? '' : 'You are welcome! Your clinical intake history has been finalized and securely saved.',
        domainCode: isAyush ? 'AYU-06' : 'GEN-06',
        domainName: isEn ? 'Intake Complete' : 'इतिहास पूर्ण',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userAckMsg, botAckMsg]);
      return;
    }

    // If history is already complete, strictly do NOT send into Gemini or restart questions
    if (isHistoryComplete) {
      return;
    }

    const userMsg: Message = {
      id: `m-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedTranscript = [...messages, userMsg];
    setMessages(updatedTranscript);
    setInputVal('');
    setIsTyping(true);

    // Current domain being targeted
    const activeDomain = questionBank[activeDomainIndex] || questionBank[0];

    try {
      const res = await fetch('/api/gemini/conversational-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSessionId,
          messages: updatedTranscript.map((m) => ({ role: m.role, content: m.content })),
          consultationMode: activeMode,
          language: selectedLanguage.name,
          patientInfo: {
            name: patient.name || 'Patient',
            age: patient.age,
            gender: patient.gender,
          },
          department: departmentId,
          currentDomainId: activeDomain.id,
          completedDomains,
          currentFacts: {
            chiefComplaint: history.hpi.chiefComplaint || undefined,
            duration: history.hpi.durationNumber > 0 ? `${history.hpi.durationNumber} ${history.hpi.durationUnit}` : undefined,
            severity: history.hpi.severity > 0 ? history.hpi.severity : undefined,
            character: history.hpi.character || undefined,
            radiation: history.hpi.radiation || undefined,
            associatedSymptoms: history.associatedSymptoms.length ? history.associatedSymptoms : undefined,
            pastMedicalHistory: history.pastMedicalHistory.length ? history.pastMedicalHistory : undefined,
            currentMedications: history.currentMedications.length ? history.currentMedications : undefined,
            drugAllergies: history.drugAllergies.length ? history.drugAllergies : undefined,
            ayushAssessment: history.ayushAssessment,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const reply = data.data;

        const isReplyComplete =
          reply.isHistoryComplete === true ||
          reply.status === 'history_complete' ||
          reply.status === 'completed' ||
          reply.currentDomainId === 'history_complete' ||
          reply.currentDomainId === 'completed';

        // Advance domain progression
        const newlyCompleted = Array.from(
          new Set([
            ...completedDomains,
            activeDomain.id,
            ...(reply.completedDomains || []).filter((d: string) => d !== 'history_complete'),
          ])
        );

        // Check if patient's response had compound facts (e.g., severity + onset/duration)
        const sevMatch =
          text.match(/(\d{1,2})\s*(?:out\s*of|\/)\s*10/i) ||
          text.match(/(?:severity|scale|pain\s*(?:level|is|rate)?)\s*[:=]?\s*(\d{1,2})/i) ||
          text.match(/(\d{1,2})\s*(?:बटा|में\s*से)\s*10/i);
        if (sevMatch) {
          const sevNum = parseInt(sevMatch[1], 10);
          if (sevNum >= 1 && sevNum <= 10 && !newlyCompleted.includes('severity_duration_pattern')) {
            newlyCompleted.push('severity_duration_pattern');
          }
        }
        if (text.match(/started\s+today|today\s*morning|today|since\s+yesterday|yesterday|2\s*hours|3\s*days|घंटे|दिन/i)) {
          if (!newlyCompleted.includes(isAyush ? 'pradhana_lakshana' : 'chief_complaint_onset')) {
            newlyCompleted.push(isAyush ? 'pradhana_lakshana' : 'chief_complaint_onset');
          }
        }

        // HARD VALIDATION: All 6 domains must be genuinely explored before allowing history_complete
        const requiredDomainIds = questionBank.map((d) => d.id);
        const allRequiredPresent = requiredDomainIds.every((id) => newlyCompleted.includes(id));
        const allDomainsExplored =
          allRequiredPresent &&
          (isReplyComplete || newlyCompleted.length >= questionBank.length);

        if (allDomainsExplored) {
          setIsHistoryComplete(true);
          setCompletedDomains(questionBank.map((d) => d.id));
          setActiveDomainIndex(questionBank.length - 1);
        } else {
          setIsHistoryComplete(false);
          setCompletedDomains(newlyCompleted);
          // Advance to next uncompleted domain in pool
          const nextIndex = questionBank.findIndex((d) => !newlyCompleted.includes(d.id));
          if (nextIndex !== -1) {
            setActiveDomainIndex(nextIndex);
          } else if (activeDomainIndex < questionBank.length - 1) {
            setActiveDomainIndex((prev) => prev + 1);
          }
        }

        const targetDomainObj =
          allDomainsExplored
            ? questionBank[questionBank.length - 1]
            : (questionBank.find((d) => d.id === reply.currentDomainId) ||
               questionBank.find((d) => !newlyCompleted.includes(d.id)) ||
               questionBank[Math.min(activeDomainIndex + 1, questionBank.length - 1)]);

        const isEn = selectedLanguage.code === 'en';
        const assistantMsg: Message = {
          id: `m-bot-${Date.now()}`,
          role: 'assistant',
          content: reply.replyMessage || (isEn ? targetDomainObj.coreQuestionsEn[0] : targetDomainObj.coreQuestionsHi[0]),
          translation: isEn ? '' : (reply.replyMessageEnglish || targetDomainObj.coreQuestionsEn[0]),
          domainCode: allDomainsExplored ? (isAyush ? 'AYU-06' : 'GEN-06') : (targetDomainObj.code || reply.currentDomainId),
          domainName: allDomainsExplored ? (isEn ? 'Intake Complete' : 'इतिहास पूर्ण') : (reply.currentDomainName || (isEn ? targetDomainObj.nameEn : targetDomainObj.nameHi)),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        // Dynamically update suggestion pills or completion options
        if (allDomainsExplored) {
          setQuickOptions(
            selectedLanguage.code === 'hi'
              ? ['परामर्श के लिए तैयार', 'धन्यवाद']
              : ['Ready for consultation', 'Thank you']
          );
        } else if (reply.quickSuggestions && reply.quickSuggestions.length > 0) {
          setQuickOptions(reply.quickSuggestions);
        } else {
          // Fallback suggestions from target domain in Question Bank
          setQuickOptions(
            selectedLanguage.code === 'hi'
              ? targetDomainObj.sampleResponsesHi.slice(0, 4)
              : targetDomainObj.sampleResponsesEn.slice(0, 4)
          );
        }

        // Factual Extraction Updates (Strictly No Diagnosis and canonical deduplication)
        if (reply.extractedFacts) {
          const facts = reply.extractedFacts;
          let parsedDurationNum = history.hpi.durationNumber;
          let parsedDurationUnit = history.hpi.durationUnit;
          if (facts.duration) {
            const match = String(facts.duration).match(/(\d+)\s*(hour|day|week|month)/i);
            if (match) {
              parsedDurationNum = parseInt(match[1], 10);
              const unitRaw = match[2].toLowerCase();
              if (unitRaw.startsWith('hour')) parsedDurationUnit = 'Hours';
              else if (unitRaw.startsWith('day')) parsedDurationUnit = 'Days';
              else if (unitRaw.startsWith('week')) parsedDurationUnit = 'Weeks';
              else if (unitRaw.startsWith('month')) parsedDurationUnit = 'Months';
            }
          } else if (text.match(/started\s+today|today|आज/i)) {
            parsedDurationNum = 1;
            parsedDurationUnit = 'Days';
          }

          let parsedSeverity = history.hpi.severity;
          if (facts.severity && Number(facts.severity) > 0) {
            parsedSeverity = Number(facts.severity);
          } else if (sevMatch) {
            const val = parseInt(sevMatch[1], 10);
            if (val >= 1 && val <= 10) {
              parsedSeverity = val;
            }
          }

          onUpdateHistory({
            hpi: {
              ...history.hpi,
              chiefComplaint: facts.chiefComplaint || history.hpi.chiefComplaint || (messages.length <= 1 ? text : ''),
              durationNumber: parsedDurationNum,
              durationUnit: parsedDurationUnit,
              character: facts.character || history.hpi.character,
              radiation: facts.radiation || history.hpi.radiation,
              severity: parsedSeverity,
              vernacularVoiceTranscript: `${history.hpi.vernacularVoiceTranscript ? history.hpi.vernacularVoiceTranscript + ' | ' : ''}${text}`,
            },
            associatedSymptoms: cleanDeduplicateClinicalList(
              history.associatedSymptoms,
              facts.associatedSymptoms || []
            ),
            pastMedicalHistory: cleanDeduplicateClinicalList(
              history.pastMedicalHistory,
              facts.pastHistory || []
            ),
            currentMedications: cleanDeduplicateClinicalList(
              history.currentMedications,
              facts.medications || []
            ),
            drugAllergies: cleanDeduplicateClinicalList(
              history.drugAllergies,
              facts.allergies || []
            ),
            ayushAssessment: isAyush
              ? {
                  prakritiVikriti: facts.prakritiVikriti || history.ayushAssessment?.prakritiVikriti,
                  agniKoshtha: facts.agniKoshtha || history.ayushAssessment?.agniKoshtha,
                  nidraManas: facts.nidraManas || history.ayushAssessment?.nidraManas,
                  balaAmaSweda: facts.balaAmaSweda || history.ayushAssessment?.balaAmaSweda,
                  rituAharaTriggers: facts.rituAharaTriggers || history.ayushAssessment?.rituAharaTriggers,
                  priorAyushLifestyle: facts.priorAyushLifestyle || history.ayushAssessment?.priorAyushLifestyle,
                }
              : history.ayushAssessment,
          });

          // Triage assessment update if red flag pattern reported
          if (reply.redFlagDetected) {
            onUpdateTriage({
              level: 'RED',
              redFlagsDetected: [
                reply.redFlagSymptomPattern || 'Reported acute severe symptoms warranting prompt evaluation',
              ],
              urgencyRationale:
                reply.redFlagSymptomPattern || 'Patient-reported acute symptom pattern requires immediate attention.',
            });
          }
        }
      }
    } catch (err) {
      console.error('Conversational engine turn error:', err);
      // Fallback turn advancing to next domain or completing only if all 6 domains are genuinely completed
      const newlyCompleted = Array.from(new Set([...completedDomains, activeDomain.id]));
      const requiredDomainIds = questionBank.map((d) => d.id);
      const allRequiredDone = requiredDomainIds.every((id) => newlyCompleted.includes(id));

      if (allRequiredDone || newlyCompleted.length >= questionBank.length) {
        setIsHistoryComplete(true);
        setCompletedDomains(questionBank.map((d) => d.id));
        setActiveDomainIndex(questionBank.length - 1);
        const isEn = selectedLanguage.code === 'en';
        const finishMsg: Message = {
          id: `m-bot-finish-${Date.now()}`,
          role: 'assistant',
          content: isEn
            ? 'Thank you. All 6 clinical domains have been explored. Your health history is summarized below. Please proceed to consultation.'
            : 'धन्यवाद। सभी 6 क्लीनिकल पहलुओं का विवरण दर्ज कर लिया गया है। कृपया आगे बढ़ें।',
          translation: isEn ? '' : 'Thank you. All 6 clinical domains have been explored.',
          domainCode: isAyush ? 'AYU-06' : 'GEN-06',
          domainName: isEn ? 'Intake Complete' : 'इतिहास पूर्ण',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, finishMsg]);
        setQuickOptions(
          selectedLanguage.code === 'hi'
            ? ['परामर्श के लिए तैयार', 'धन्यवाद']
            : ['Ready for consultation', 'Thank you']
        );
      } else {
        setCompletedDomains(newlyCompleted);
        const nextMissingIndex = questionBank.findIndex((d) => !newlyCompleted.includes(d.id));
        const nextIdx = nextMissingIndex !== -1 ? nextMissingIndex : Math.min(activeDomainIndex + 1, questionBank.length - 1);
        setActiveDomainIndex(nextIdx);
        const nextDomainObj = questionBank[nextIdx];
        const isEn = selectedLanguage.code === 'en';
        const fallbackMsg: Message = {
          id: `m-bot-${Date.now()}`,
          role: 'assistant',
          content: isEn ? nextDomainObj.coreQuestionsEn[0] : nextDomainObj.coreQuestionsHi[0],
          translation: isEn ? '' : nextDomainObj.coreQuestionsEn[0],
          domainCode: nextDomainObj.code,
          domainName: isEn ? nextDomainObj.nameEn : nextDomainObj.nameHi,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, fallbackMsg]);
        setQuickOptions(
          isEn
            ? nextDomainObj.sampleResponsesEn.slice(0, 4)
            : nextDomainObj.sampleResponsesHi.slice(0, 4)
        );
      }
    } finally {
      setIsTyping(false);
    }
  };

  // Toggle Voice Recording
  const handleToggleVoice = () => {
    stopSpeaking();
    setSpeakingMessageId(null);

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      // Graceful simulated speech input for browser preview without mic access
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const userMsgCount = messages.filter((m) => m.role === 'user').length;
        if (userMsgCount === 0) {
          const sampleSpeech =
            selectedLanguage.code === 'en'
              ? 'I have had a severe headache since yesterday morning'
              : 'मुझे कल सुबह से बहुत तेज सिरदर्द हो रहा है';
          handleSendTurn(sampleSpeech);
        } else {
          const curDomain = questionBank[activeDomainIndex] || questionBank[0];
          const sampleSpeech =
            selectedLanguage.code === 'hi'
              ? curDomain.sampleResponsesHi[0]
              : curDomain.sampleResponsesEn[0];
          handleSendTurn(sampleSpeech);
        }
      }, 1400);
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.lang = selectedLanguage.code === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setRecognitionError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          handleSendTurn(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
        setRecognitionError('Microphone input unavailable. You can tap options or type below.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Play / Toggle Speech Audio via TTS (manual click/replay)
  const handleTogglePlayAudio = (msgId: string, text: string) => {
    if (speakingMessageId === msgId) {
      stopSpeaking();
      setSpeakingMessageId(null);
    } else {
      stopSpeaking();
      setSpeakingMessageId(msgId);
      playTtsAudio(
        text,
        selectedLanguage.code,
        1.0,
        () => setSpeakingMessageId(msgId),
        () => {
          setSpeakingMessageId((current) => (current === msgId ? null : current));
        }
      );
    }
  };

  // Restart conversation with fresh session ID and empty history
  const handleResetChat = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
    lastSpokenMsgIdRef.current = null;
    setIsHistoryComplete(false);
    setThankYouAcknowledged(false);
    const newSessId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    setCurrentSessionId(newSessId);
    setActiveDomainIndex(0);
    setCompletedDomains([]);
    setMessages([]);
    onUpdateHistory(INITIAL_EMPTY_CLINICAL_HISTORY);
    onUpdateTriage(INITIAL_EMPTY_TRIAGE);
    initOpeningTurn(activeMode, 0, newSessId);
  };

  // Canonical deduplication for drawer rendering
  const cleanAssociatedSymptoms = cleanDeduplicateClinicalList(history.associatedSymptoms);
  const cleanPastHistory = cleanDeduplicateClinicalList(history.pastMedicalHistory);
  const cleanMedications = cleanDeduplicateClinicalList(history.currentMedications);
  const cleanAllergies = cleanDeduplicateClinicalList(history.drugAllergies);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner with Active Mode, Session ID, and Question Bank details */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl border border-emerald-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/40 rounded text-emerald-300 text-[11px] font-mono uppercase tracking-wider font-semibold">
                Step 5 of 10 • Conversational History Engine
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight flex items-center gap-2 text-white">
              {isAyush ? (
                <Leaf className="w-6 h-6 text-teal-400 shrink-0" />
              ) : (
                <Stethoscope className="w-6 h-6 text-emerald-400 shrink-0" />
              )}
              <span>
                {isAyush
                  ? 'AYUSH Holistic Question Bank Engine'
                  : 'General Medicine Question Bank Engine'}
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300">
              Active intake for <strong className="text-white">{patient.name || 'Patient'}</strong>{' '}
              ({patient.age}y, {patient.gender}). Traverses 6 clinical domains dynamically.
            </p>
          </div>

          {/* Consultation Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700/60 shrink-0">
            <span className="text-[11px] text-slate-300 font-semibold px-2">Mode:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleSwitchMode('GENERAL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  !isAyush
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>General Mode</span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchMode('AYUSH')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  isAyush
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <Leaf className="w-3.5 h-3.5" />
                <span>AYUSH Mode</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Question Bank 6-Domain Progress Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {isAyush ? 'AYUSH Question Bank Domains' : 'General Medicine Question Bank Domains'}
            </h2>
            <span
              className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-bold ${
                isHistoryComplete
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isHistoryComplete
                ? `${questionBank.length} of ${questionBank.length} Explored • Intake Finalized`
                : `${completedDomains.length} of ${questionBank.length} Explored`}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={handleResetChat}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 transition"
              title="Restart Question Bank inquiry"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restart Bank</span>
            </button>
          </div>
        </div>

        {/* Domain Progress Indicator Stepper (Read-Only Status Display) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {questionBank.map((domain, idx) => {
            const isCompleted = isHistoryComplete || completedDomains.includes(domain.id);
            const isCurrent = !isHistoryComplete && idx === activeDomainIndex;

            return (
              <div
                key={domain.id}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between select-none ${
                  isCurrent
                    ? isAyush
                      ? 'border-teal-500 bg-teal-50/90 ring-2 ring-teal-500/20 shadow-xs'
                      : 'border-emerald-500 bg-emerald-50/90 ring-2 ring-emerald-500/20 shadow-xs'
                    : isCompleted
                    ? 'border-emerald-200 bg-emerald-50/40 text-slate-700'
                    : 'border-slate-200/70 bg-slate-50/50 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isCurrent
                        ? isAyush
                          ? 'bg-teal-700 text-white'
                          : 'bg-emerald-700 text-white'
                        : isCompleted
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {domain.code}
                  </span>

                  {isCompleted ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-semibold" title="Explored">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="hidden sm:inline">Explored</span>
                    </span>
                  ) : isCurrent ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold" title="In Progress">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                      <span className="hidden sm:inline">Active</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] text-slate-400" title="Pending">
                      <Clock className="w-3 h-3 text-slate-300 shrink-0" />
                      <span className="hidden sm:inline">Pending</span>
                    </span>
                  )}
                </div>

                <div>
                  <p
                    className={`text-[11px] font-bold line-clamp-1 ${
                      isCurrent
                        ? 'text-slate-900'
                        : isCompleted
                        ? 'text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {domain.nameEn}
                  </p>
                  <p
                    className={`text-[10px] line-clamp-1 ${
                      isCurrent
                        ? 'text-slate-600'
                        : isCompleted
                        ? 'text-slate-500'
                        : 'text-slate-400'
                    }`}
                  >
                    {domain.nameHi}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main 2-Column Chat & Factual Summary Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Dynamic Chat Engine Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col min-h-[660px] lg:h-[720px] overflow-hidden">
          {/* Active Domain Indicator Bar */}
          <div
            className={`px-4 py-2 border-b flex items-center justify-between text-xs ${
              isAyush
                ? 'bg-teal-50/60 border-teal-100 text-teal-900'
                : 'bg-emerald-50/60 border-emerald-100 text-emerald-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                {currentDomain.code}
              </span>
              <span className="font-bold text-xs">{currentDomain.nameEn}</span>
              <span className="text-slate-500 text-[11px]">({currentDomain.nameHi})</span>
            </div>
          </div>

          {/* Chat Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div
                      className={`w-8 h-8 rounded-full text-white flex items-center justify-center shrink-0 shadow-sm text-xs font-bold ${
                        isAyush ? 'bg-teal-700' : 'bg-emerald-700'
                      }`}
                    >
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] p-4 rounded-2xl text-xs space-y-1.5 shadow-sm leading-relaxed ${
                      isUser
                        ? 'bg-emerald-700 text-white rounded-tr-none'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-bold text-[11px] opacity-80 flex items-center gap-1.5">
                        {isUser ? patient.name || 'Patient' : isAyush ? 'AYUSH History Assistant' : 'Clinical History Assistant'}
                        {!isUser && msg.domainCode && (
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 font-mono text-[9px] rounded font-semibold">
                            {msg.domainCode}
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] opacity-60 font-mono">{msg.timestamp}</span>
                    </div>

                    <p className="text-sm font-medium">{msg.content}</p>

                    {!isUser && msg.translation && msg.translation !== msg.content && selectedLanguage.code !== 'en' && (
                      <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                        "{msg.translation}"
                      </p>
                    )}

                    {!isUser && (
                      <div className="pt-1.5 flex items-center justify-between border-t border-slate-100/70 mt-1">
                        {speakingMessageId === msg.id ? (
                          <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                            <span>Speaking question aloud...</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Audio read-aloud</span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleTogglePlayAudio(msg.id, msg.content)}
                          className={`px-1.5 py-0.5 rounded transition flex items-center gap-1 text-[10px] ${
                            speakingMessageId === msg.id
                              ? 'bg-emerald-100 text-emerald-800 font-bold shadow-xs'
                              : 'hover:bg-slate-100 text-slate-400 hover:text-emerald-700'
                          }`}
                          title={
                            speakingMessageId === msg.id
                              ? 'Stop speaking'
                              : 'Replay question audio in speech'
                          }
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Replay</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-sm text-xs font-bold">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-center gap-2 text-slate-500 text-xs pl-2 py-1">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span className="font-medium">
                  Assistant is analyzing history response against Question Bank...
                </span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* DUAL HIGH-ACCESSIBILITY INPUT ZONE (SRS FR-CONV.2) */}
          {/* Turn 1: Mic + Open Text Field Only. Turn 2+: Mic + 3-4 Large Tap Options + Keyboard Fallback */}
          {/* Terminal History Complete State: Once reached, active questioning ceases and only navigation actions are active */}
          <div className="p-3.5 sm:p-4 bg-slate-50/95 border-t-2 border-slate-200 space-y-3 shrink-0">
            {isHistoryComplete ? (
              /* Truly Terminal State: questioning ceases, only navigation buttons active */
              <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-emerald-950">
                        {selectedLanguage.code === 'en'
                          ? 'Clinical Intake History Complete'
                          : 'स्वास्थ्य इतिहास संकलन पूर्ण'}
                      </h4>
                      <span className="px-2.5 py-0.5 bg-emerald-200 text-emerald-900 rounded-full text-[10px] font-bold font-mono">
                        6 of 6 Domains Recorded
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {selectedLanguage.code === 'en'
                        ? 'All clinical domains have been explored and documented for the attending doctor. The questioning phase is now complete.'
                        : 'चिकित्सक परामर्श हेतु सभी 6 आवश्यक क्लीनिकल पहलुओं का विवरण दर्ज कर लिया गया है। अब कोई और प्रश्न शेष नहीं है।'}
                    </p>
                  </div>
                </div>

                {thankYouAcknowledged && (
                  <div className="p-2.5 bg-white border border-emerald-200 rounded-xl text-xs text-emerald-900 font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      {selectedLanguage.code === 'en'
                        ? "You're welcome! Your responses are securely recorded. Click 'Ready for consultation' to proceed."
                        : "आपका स्वागत है! आपका विवरण सुरक्षित है। आगे बढ़ने के लिए 'परामर्श के लिए तैयार' पर क्लिक करें।"}
                    </span>
                  </div>
                )}

                {/* Terminal Navigation Actions: NO more AI questioning */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={onNext}
                    className="py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.99]"
                  >
                    <span>
                      {selectedLanguage.code === 'en'
                        ? 'Ready for Consultation / Continue Intake'
                        : 'परामर्श के लिए तैयार / आगे बढ़ें'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {!thankYouAcknowledged ? (
                    <button
                      type="button"
                      onClick={() => handleSendTurn(selectedLanguage.code === 'en' ? 'Thank you' : 'धन्यवाद')}
                      className="py-3.5 px-4 bg-white hover:bg-slate-100 border-2 border-emerald-300 text-emerald-900 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <span>{selectedLanguage.code === 'en' ? 'Thank you' : 'धन्यवाद'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onNext}
                      className="py-3.5 px-4 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 text-emerald-900 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <span>
                        {selectedLanguage.code === 'en' ? 'Proceed to Red-Flag Review' : 'रेड-फ्लैग समीक्षा पर जाएं'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
            {/* Accessibility Header Notice */}
            <div className="flex items-center justify-between text-xs px-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-slate-800 text-[11px] sm:text-xs">
                  {messages.filter((m) => m.role === 'user').length === 0
                    ? selectedLanguage.code === 'en'
                      ? 'State Chief Complaint (Voice or Text)'
                      : 'मुख्य तकलीफ बताएं (बोलकर या लिखकर)'
                    : selectedLanguage.code === 'en'
                    ? 'Voice or Touch Answer'
                    : 'बोलकर या छूकर उत्तर दें'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {messages.filter((m) => m.role === 'user').length === 0
                  ? 'Turn 1: Free Expression'
                  : 'SRS FR-CONV.2 Accessible Mode'}
              </span>
            </div>

            {/* Turn 1 vs Turn 2+ Dynamic Input Layout */}
            {messages.filter((m) => m.role === 'user').length === 0 ? (
              /* FIRST QUESTION: Free-text / Voice ONLY, NO preset tap options */
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
                {/* 1. Large Mic Button (Left) */}
                <div className="sm:col-span-4 bg-white rounded-2xl p-3 sm:p-4 border-2 border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-center">
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    disabled={isTyping}
                    className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 relative ${
                      isListening
                        ? 'bg-rose-600 text-white ring-8 ring-rose-200 animate-pulse shadow-rose-300'
                        : isTyping
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xl ring-4 ring-emerald-100'
                    }`}
                    title="Tap to Speak (बोलकर बताएं)"
                  >
                    {isListening ? (
                      <MicOff className="w-9 h-9 sm:w-10 sm:h-10" />
                    ) : (
                      <Mic className="w-9 h-9 sm:w-10 sm:h-10" />
                    )}
                  </button>

                  <div className="mt-2 text-center space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      {isListening
                        ? selectedLanguage.code === 'en' ? 'Listening... Speak now' : 'सुन रहे हैं... बोलिए'
                        : selectedLanguage.code === 'en' ? 'Tap to Speak' : 'बोलकर बताएं'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {selectedLanguage.code === 'en' ? 'Speak your main symptom' : 'अपनी मुख्य तकलीफ बोलें'}
                    </p>
                  </div>
                </div>

                {/* 2. Open Text Input Field (Right) */}
                <div className="sm:col-span-8 bg-white rounded-2xl p-4 border-2 border-slate-200/90 shadow-xs flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="first-turn-complaint-input" className="block text-xs font-bold text-slate-800">
                      {selectedLanguage.code === 'en'
                        ? 'Or type your main health concern below:'
                        : 'या अपनी मुख्य तकलीफ नीचे लिखकर बताएं:'}
                    </label>
                    <p className="text-[11px] text-slate-500">
                      {selectedLanguage.code === 'en'
                        ? 'Since symptoms vary, please describe in your own words. Tailored answer choices will appear for next questions.'
                        : 'प्रत्येक मरीज की तकलीफ अलग होती है, इसलिए सीधे अपनी भाषा में लिखें। अगले प्रश्नों में विकल्प मिलेंगे।'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      id="first-turn-complaint-input"
                      type="text"
                      value={inputVal}
                      onChange={(e) => setInputVal(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendTurn()}
                      disabled={isTyping}
                      autoFocus
                      placeholder={
                        selectedLanguage.code === 'en'
                          ? 'e.g., severe headache since yesterday, high fever with chills, stomach cramps...'
                          : 'जैसे, कल से तेज सिरदर्द, कंपकंपी के साथ बुखार, पेट में मरोड़...'
                      }
                      className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm border-2 border-slate-300 focus:border-emerald-500 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:outline-none bg-slate-50 focus:bg-white transition"
                    />
                    <button
                      type="button"
                      id="first-turn-send-btn"
                      onClick={() => handleSendTurn()}
                      disabled={!inputVal.trim() || isTyping}
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm flex items-center gap-1.5 transition shrink-0"
                    >
                      <span>{selectedLanguage.code === 'en' ? 'Send' : 'भेजें'}</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* SUBSEQUENT QUESTIONS: Large Mic (Left) + 3-4 Dynamic Context-Specific Tap Options (Right) */
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
                {/* 1. LARGE Circular Microphone Button */}
                <div className="sm:col-span-4 bg-white rounded-2xl p-3 sm:p-4 border-2 border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-center">
                  <button
                    type="button"
                    onClick={handleToggleVoice}
                    disabled={isTyping}
                    className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 relative ${
                      isListening
                        ? 'bg-rose-600 text-white ring-8 ring-rose-200 animate-pulse shadow-rose-300'
                        : isTyping
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-xl ring-4 ring-emerald-100'
                    }`}
                    title="Tap to Speak (बोलकर बताएं)"
                  >
                    {isListening ? (
                      <MicOff className="w-9 h-9 sm:w-10 sm:h-10" />
                    ) : (
                      <Mic className="w-9 h-9 sm:w-10 sm:h-10" />
                    )}
                  </button>

                  <div className="mt-2 text-center space-y-0.5">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      {isListening
                        ? selectedLanguage.code === 'en' ? 'Listening... Speak now' : 'सुन रहे हैं... बोलिए'
                        : selectedLanguage.code === 'en' ? 'Tap to Speak' : 'बोलकर बताएं'}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {selectedLanguage.code === 'en' ? 'Speak naturally' : 'बोलकर उत्तर दें'}
                    </p>
                  </div>
                </div>

                {/* 2. 3-4 LARGE Tap-able Answer Options */}
                <div className="sm:col-span-8 flex flex-col justify-between space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-600 px-1 font-semibold">
                    <span>
                      {selectedLanguage.code === 'en'
                        ? 'Or tap your answer below:'
                        : 'या नीचे दिए विकल्पों में से चुनें:'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">
                      {displayedOptions.length} quick answers
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {displayedOptions.map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSendTurn(opt)}
                        disabled={isTyping || isListening}
                        className="min-h-[56px] px-3.5 py-2.5 bg-white hover:bg-emerald-50 active:bg-emerald-100 border-2 border-slate-200 hover:border-emerald-500 rounded-xl text-left text-xs sm:text-sm text-slate-800 font-medium transition-all shadow-2xs active:scale-[0.98] disabled:opacity-50 flex items-center gap-2.5 group"
                      >
                        <span className="w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 transition">
                          {i + 1}
                        </span>
                        <span className="line-clamp-2 leading-snug flex-1">{opt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error banner if microphone fails */}
            {recognitionError && (
              <div className="px-3 py-1.5 bg-amber-50 text-amber-800 text-[11px] rounded-lg border border-amber-200 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>{recognitionError}</span>
              </div>
            )}

            {/* Minor Fallback Option: Keyboard Typing for Turn 2+ */}
            {messages.filter((m) => m.role === 'user').length > 0 && (
              <div className="pt-1 border-t border-slate-200/70">
                {!showManualInput ? (
                  <div className="flex items-center justify-between pt-0.5">
                    <button
                      type="button"
                      onClick={() => setShowManualInput(true)}
                      className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition font-medium py-1 px-2 rounded-lg hover:bg-slate-200/50"
                    >
                      <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {selectedLanguage.code === 'en'
                          ? 'Type custom answer with keyboard'
                          : 'कीबोर्ड से लिखकर बताएं (वैकल्पिक)'}
                      </span>
                    </button>

                    <span className="text-[10px] text-slate-400 hidden sm:inline">
                      Large touch targets enabled
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 font-medium text-slate-600">
                        <Keyboard className="w-3.5 h-3.5" />
                        <span>Custom keyboard answer:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowManualInput(false)}
                        className="text-slate-400 hover:text-slate-600 text-[10px] underline"
                      >
                        Hide
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendTurn()}
                        disabled={isTyping}
                        placeholder={
                          selectedLanguage.code === 'en'
                            ? 'Type custom answer in English...'
                            : `Type custom answer in ${selectedLanguage.name}...`
                        }
                        className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSendTurn()}
                        disabled={!inputVal.trim() || isTyping}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition"
                      >
                        <span>Send</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>

        {/* Right Column: Factual History Extraction & Safety Guardrail */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Extracted Clinical Facts
                </h2>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
                {isAyush ? 'AYUSH Schema' : 'Allopathy Schema'}
              </span>
            </div>

            {/* Extracted Data Items */}
            <div className="space-y-2.5 text-xs">
              {!history.hpi.chiefComplaint &&
              history.hpi.durationNumber === 0 &&
              history.hpi.severity === 0 &&
              !history.hpi.character &&
              !history.hpi.radiation &&
              cleanAssociatedSymptoms.length === 0 &&
              cleanPastHistory.length === 0 &&
              cleanMedications.length === 0 &&
              cleanAllergies.length === 0 &&
              (!isAyush || !history.ayushAssessment?.agniState) ? (
                <div className="p-4 bg-slate-50/80 rounded-xl border border-dashed border-slate-300 text-center py-6 space-y-2">
                  <div className="w-8 h-8 rounded-full bg-slate-200/80 flex items-center justify-center mx-auto text-slate-500">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700">No Clinical Facts Recorded Yet</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                      This panel starts completely empty for every session. As the patient speaks or taps answers, verified factual data will populate here turn-by-turn.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {history.hpi.chiefComplaint && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Chief Complaint (मुख्य तकलीफ):
                      </span>
                      <span className="font-bold text-slate-900 mt-0.5 block text-sm">
                        {history.hpi.chiefComplaint}
                      </span>
                    </div>
                  )}

                  {(history.hpi.durationNumber > 0 || history.hpi.severity > 0) && (
                    <div className="grid grid-cols-2 gap-2">
                      {history.hpi.durationNumber > 0 ? (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">
                            Onset & Duration:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {history.hpi.durationNumber} {history.hpi.durationUnit}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Onset & Duration:
                          </span>
                          <span className="text-slate-400 italic text-[11px]">Awaiting inquiry</span>
                        </div>
                      )}

                      {history.hpi.severity > 0 ? (
                        <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                          <span className="text-slate-500 block text-[10px] uppercase font-bold">
                            Severity:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {history.hpi.severity} / 10 Scale
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Severity:
                          </span>
                          <span className="text-slate-400 italic text-[11px]">Awaiting inquiry</span>
                        </div>
                      )}
                    </div>
                  )}

                  {history.hpi.character && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Character & Quality:
                      </span>
                      <span className="text-slate-800 font-medium">{history.hpi.character}</span>
                    </div>
                  )}

                  {history.hpi.radiation && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">
                        Radiation / Spread:
                      </span>
                      <span className="text-slate-800 font-medium">{history.hpi.radiation}</span>
                    </div>
                  )}

                  {/* AYUSH-specific extracted facts */}
                  {isAyush && history.ayushAssessment && (
                    <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-2">
                      <span className="text-teal-900 font-bold text-[11px] uppercase tracking-wider block">
                        AYUSH Pariksha Indicators:
                      </span>
                      <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                        {history.ayushAssessment.prakritiVikriti && (
                          <div className="bg-white/80 p-1.5 rounded border border-teal-200">
                            <span className="text-slate-500 block text-[9px] font-bold">Prakriti & Vikriti:</span>
                            <span className="font-semibold text-teal-950">
                              {history.ayushAssessment.prakritiVikriti}
                            </span>
                          </div>
                        )}
                        {history.ayushAssessment.agniKoshtha && (
                          <div className="bg-white/80 p-1.5 rounded border border-teal-200">
                            <span className="text-slate-500 block text-[9px] font-bold">Agni & Koshtha:</span>
                            <span className="font-semibold text-teal-950">
                              {history.ayushAssessment.agniKoshtha}
                            </span>
                          </div>
                        )}
                        {history.ayushAssessment.nidraManas && (
                          <div className="bg-white/80 p-1.5 rounded border border-teal-200">
                            <span className="text-slate-500 block text-[9px] font-bold">Nidra & Manas:</span>
                            <span className="font-semibold text-teal-950">
                              {history.ayushAssessment.nidraManas}
                            </span>
                          </div>
                        )}
                        {history.ayushAssessment.balaAmaSweda && (
                          <div className="bg-white/80 p-1.5 rounded border border-teal-200">
                            <span className="text-slate-500 block text-[9px] font-bold">Bala, Sweda & Ama:</span>
                            <span className="font-semibold text-teal-950">
                              {history.ayushAssessment.balaAmaSweda}
                            </span>
                          </div>
                        )}
                        {history.ayushAssessment.rituAharaTriggers && (
                          <div className="bg-white/80 p-1.5 rounded border border-teal-200">
                            <span className="text-slate-500 block text-[9px] font-bold">Ritu & Ahara:</span>
                            <span className="font-semibold text-teal-950">
                              {history.ayushAssessment.rituAharaTriggers}
                            </span>
                          </div>
                        )}
                        {history.ayushAssessment.priorAyushLifestyle && (
                          <div className="bg-white/80 p-1.5 rounded border border-teal-200">
                            <span className="text-slate-500 block text-[9px] font-bold">Prior AYUSH & Dinacharya:</span>
                            <span className="font-semibold text-teal-950">
                              {history.ayushAssessment.priorAyushLifestyle}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {cleanAssociatedSymptoms.length > 0 && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                        Associated Symptoms Reported:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cleanAssociatedSymptoms.map((sym, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-medium"
                          >
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {cleanPastHistory.length > 0 && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                        Past Medical History:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cleanPastHistory.map((item, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {cleanMedications.length > 0 && (
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">
                        Current Medications:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cleanMedications.map((item, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded text-[10px] font-medium"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {cleanAllergies.length > 0 && (
                    <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200">
                      <span className="text-amber-800 block text-[10px] uppercase font-bold mb-1">
                        Known Drug Allergies:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {cleanAllergies.map((item, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-white border border-amber-200 text-amber-900 rounded text-[10px] font-bold"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Triage Alert Indicator */}
              {triage.level === 'RED' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Priority Review Symptom Pattern</span>
                  </div>
                  <p className="text-[11px] text-rose-900 leading-relaxed">
                    {triage.redFlagsDetected[0] ||
                      'Reported symptom pattern warrants immediate physician attention.'}
                  </p>
                </div>
              )}
            </div>

            {/* Safety Directive Enforcement Notice */}
            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-3 flex items-center gap-1.5 leading-relaxed">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Safety Rule Enforced:</strong> Restates patient-reported facts only.
                Never produces diagnostic conclusions or ICD-10 codes.
              </span>
            </div>
          </div>

          {/* Proceed Button */}
          <button
            type="button"
            onClick={onNext}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition"
          >
            <span>Proceed to Red-Flag Review (आगे बढ़ें)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Consultation Mode</span>
        </button>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition"
        >
          <span>Continue Intake</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
