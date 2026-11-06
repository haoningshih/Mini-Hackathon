import React, { useState, useEffect, useRef } from 'react';
import {
  ChatMessage,
  UserObjectiveState,
  TargetLanguage,
} from '../types/duo';
import { GOAL_OPTIONS, SUPPORTED_LANGUAGES } from '../data/curriculumData';
import { DuoMascot } from './DuoMascot';
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  HelpCircle,
  Clock,
  Sparkles,
  Phone,
  PhoneOff,
  Globe2,
  Award,
  AlertCircle,
  Lightbulb,
  Radio,
  FileText,
  Pause,
  Play,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  X,
} from 'lucide-react';
import { audioService } from '../utils/audio';

interface ConversationStudioProps {
  objectiveState: UserObjectiveState;
  onFinishAndGenerateReport: (
    history: ChatMessage[],
    durationSeconds: number
  ) => Promise<void>;
  onOpenTutor: (snippet?: string) => void;
  isGeneratingReport: boolean;
  soundEnabled: boolean;
}

export const ConversationStudio: React.FC<ConversationStudioProps> = ({
  objectiveState,
  onFinishAndGenerateReport,
  onOpenTutor,
  isGeneratingReport,
  soundEnabled,
}) => {
  const currentGoalData =
    GOAL_OPTIONS.find((g) => g.id === objectiveState.goal) || GOAL_OPTIONS[0];
  const currentScenario =
    currentGoalData.scenarios.find(
      (s) => s.id === objectiveState.selectedScenarioId
    ) || currentGoalData.scenarios[0];
  const langConfig =
    SUPPORTED_LANGUAGES.find((l) => l.name === objectiveState.targetLanguage) ||
    SUPPORTED_LANGUAGES[0];

  // Conversation history
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);

  // Call & Verbal state
  const [viewMode, setViewMode] = useState<'call' | 'transcript'>('call');
  const [callState, setCallState] = useState<
    'connecting' | 'connected' | 'speaking' | 'listening' | 'processing' | 'paused'
  >('connecting');
  const [handsFreeMode, setHandsFreeMode] = useState<boolean>(true);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0); // 1.0 or 0.75
  const [showLiveTranslation, setShowLiveTranslation] = useState<boolean>(false);
  const [showTranslations, setShowTranslations] = useState<{ [id: string]: boolean }>({});
  
  // Mic diagnostic & real volume level
  const [micPermission, setMicPermission] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [micVolume, setMicVolume] = useState<number>(0);
  const [micErrorMessage, setMicErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const targetDurationSeconds = (objectiveState.targetDurationMinutes || 10) * 60;

  // Initialize conversation and trigger initial spoken greeting
  useEffect(() => {
    const initialGreeting =
      currentScenario?.initialGreeting ||
      `¡Hola! Bienvenido. ¿En qué puedo ayudarte hoy?`;

    const initialMessage: ChatMessage = {
      id: 'msg-0',
      role: 'assistant',
      content: initialGreeting,
      translation:
        objectiveState.targetLanguage === 'French'
          ? 'Hello! Welcome. How can I help you today?'
          : 'Hello! Welcome. How can I assist you today?',
      timestamp: Date.now(),
      vocabHints: [
        { word: 'bienvenido', meaning: 'welcome', partOfSpeech: 'adjective' },
        { word: 'ayudar', meaning: 'to help / assist', partOfSpeech: 'verb' },
      ],
      suggestedReplies:
        objectiveState.targetLanguage === 'French'
          ? [
              'Bonjour ! Je voudrais une table, s’il vous plaît.',
              'Avez-vous des recommandations ?',
            ]
          : [
              '¡Hola! Quisiera una mesa para dos, por favor.',
              '¿Qué me recomienda hoy?',
              'Estoy aquí para mi reunión.',
            ],
    };

    setMessages([initialMessage]);
    setElapsedSeconds(0);
    setIsTimerRunning(true);
    setCallState('connecting');

    if (soundEnabled) {
      audioService.playCallConnecting();
    }

    const timer = setTimeout(() => {
      setCallState('speaking');
      if (soundEnabled) {
        audioService.playCallConnected();
      }

      // Speak initial greeting aloud
      setTimeout(() => {
        speakCharacterMessage(initialGreeting);
      }, 400);
    }, 1200);

    return () => {
      clearTimeout(timer);
      stopListening();
      audioService.stopSpeaking();
      cleanupAudioStream();
    };
  }, [objectiveState.selectedScenarioId, objectiveState.targetLanguage]);

  // Session timer
  useEffect(() => {
    let timer: any = null;
    if (isTimerRunning && !isGeneratingReport && callState !== 'paused') {
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, isGeneratingReport, callState]);

  // Auto scroll transcript
  useEffect(() => {
    if (viewMode === 'transcript') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, viewMode, loading]);

  // Clean up mic stream and analyser
  const cleanupAudioStream = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
  };

  // Setup real microphone stream and Web Audio API analyser to measure real volume
  const initMicrophoneStream = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission('unsupported');
      setMicErrorMessage('Microphone is not supported in this browser.');
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      mediaStreamRef.current = stream;
      setMicPermission('granted');
      setMicErrorMessage(null);

      // Create audio context & analyser for real-time visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!analyserRef.current || !isMicActive) {
            setMicVolume(0);
          } else {
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
          }
          animFrameRef.current = requestAnimationFrame(checkVolume);
        };

        checkVolume();
      }

      return true;
    } catch (err: any) {
      console.warn('Microphone permission request error:', err);
      setMicPermission('denied');
      setMicErrorMessage(
        'Microphone access was denied or blocked by the browser. Please check site permissions or use the quick response buttons.'
      );
      return false;
    }
  };

  // Speak character message with audio callbacks to trigger listening
  const speakCharacterMessage = (text: string) => {
    setCallState('speaking');
    audioService.speak(
      text,
      langConfig.locale,
      speechSpeed,
      () => {
        setCallState('speaking');
      },
      () => {
        // When character finishes speaking, auto-open mic if in hands-free mode
        // Only auto-start if user has already granted permission once
        if (handsFreeMode && !isGeneratingReport && micPermission === 'granted') {
          startListening();
        } else {
          setCallState('connected');
        }
      }
    );
  };

  // In-app mic permission guidance modal
  const [showMicPermissionModal, setShowMicPermissionModal] = useState<boolean>(false);

  // Start speech recognition
  const startListening = async () => {
    // 1. Instantly set UI state to listening so the button reflects the action immediately
    setIsMicActive(true);
    setCallState('listening');
    setLiveTranscript('');
    setMicErrorMessage(null);
    if (soundEnabled) {
      audioService.playListeningPing();
    }

    // 2. Request getUserMedia in parallel for real volume analysis (non-blocking)
    if (!mediaStreamRef.current && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaStreamRef.current = stream;
          setMicPermission('granted');
          setShowMicPermissionModal(false);
          // setup analyser
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            try {
              const audioCtx = new AudioCtx();
              const analyser = audioCtx.createAnalyser();
              analyser.fftSize = 64;
              const source = audioCtx.createMediaStreamSource(stream);
              source.connect(analyser);

              audioContextRef.current = audioCtx;
              analyserRef.current = analyser;

              const dataArray = new Uint8Array(analyser.frequencyBinCount);
              const checkVolume = () => {
                if (!analyserRef.current || !isMicActive) {
                  setMicVolume(0);
                } else {
                  analyserRef.current.getByteFrequencyData(dataArray);
                  let sum = 0;
                  for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                  }
                  const avg = sum / dataArray.length;
                  setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
                }
                animFrameRef.current = requestAnimationFrame(checkVolume);
              };
              checkVolume();
            } catch (e) {
              console.warn('Analyser setup error:', e);
            }
          }
        })
        .catch((err) => {
          console.warn('getUserMedia non-blocking error:', err);
          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            setMicPermission('denied');
            setShowMicPermissionModal(true);
          }
        });
    }

    // 3. Start browser SpeechRecognition
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRec) {
      setMicPermission('unsupported');
      setMicErrorMessage(
        'Speech recognition is not supported in this browser. You can speak by typing or clicking the starter responses!'
      );
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }

      const recognition = new SpeechRec();
      recognition.lang = langConfig.locale;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsMicActive(true);
        setCallState('listening');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const currentSpoken = (final || interim).trim();
        if (currentSpoken) {
          setLiveTranscript(currentSpoken);
        }

        // Reset silence timer on voice activity
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Auto-send when user stops talking for 1.8s
        if (currentSpoken.length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            handleSpokenComplete(currentSpoken);
          }, 1800);
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Speech rec error event:', e);
        if (e.error === 'not-allowed') {
          setMicPermission('denied');
          setShowMicPermissionModal(true);
          setMicErrorMessage('Microphone access blocked. Click "Allow Mic" or open call in new tab.');
        } else if (e.error === 'no-speech') {
          // Normal silence, keep listening!
        } else {
          console.warn('Speech error notice:', e.error);
        }
      };

      recognition.onend = () => {
        // Only reset if user stopped it manually or sent
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Failed to start speech rec:', e);
      setShowMicPermissionModal(true);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }
    setIsMicActive(false);
  };

  // When speech utterance completes, send message to server
  const handleSpokenComplete = (text: string) => {
    stopListening();
    if (!text.trim()) return;
    handleSendMessage(text);
  };

  // Send message to server and get verbal response
  const handleSendMessage = async (textToSend: string) => {
    const text = textToSend.trim();
    if (!text || loading || isGeneratingReport) return;

    if (soundEnabled) audioService.playSuccess();

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputText('');
    setLiveTranscript('');
    setLoading(true);
    setCallState('processing');

    try {
      const res = await fetch('/api/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          objective: {
            language: objectiveState.targetLanguage,
            level: objectiveState.level,
            goal: objectiveState.goal,
            scenario: currentScenario?.title || 'Real life immersion',
          },
          persona: {
            name: currentScenario?.personaName,
            role: currentScenario?.personaRole,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to get character response');
      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: data.reply,
        translation: data.translation,
        culturalTip: data.culturalTip,
        gentleCorrection: data.gentleCorrection,
        vocabHints: data.vocabHints,
        suggestedReplies: data.suggestedReplies,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Speak reply out loud naturally
      if (data.reply) {
        speakCharacterMessage(data.reply);
      }
    } catch (e) {
      console.error(e);
      const fallbackText =
        objectiveState.targetLanguage === 'Spanish'
          ? '¡Muy bien! Comprendo lo que dices. ¿Prefieres probar la especialidad de la casa?'
          : 'Very well! Let us continue practicing this situation together.';

      const fallback: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: fallbackText,
        translation: 'Very well! I understand what you say.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallback]);
      speakCharacterMessage(fallbackText);
    } finally {
      setLoading(false);
    }
  };

  // Toggle manual mic
  const handleToggleMic = async () => {
    if (isMicActive) {
      if (liveTranscript.trim()) {
        handleSpokenComplete(liveTranscript);
      } else {
        stopListening();
        setCallState('connected');
      }
    } else {
      audioService.stopSpeaking();
      await startListening();
    }
  };

  // Toggle call pause
  const handleTogglePause = () => {
    if (callState === 'paused') {
      setCallState('connected');
      if (handsFreeMode && micPermission === 'granted') startListening();
    } else {
      stopListening();
      audioService.stopSpeaking();
      setCallState('paused');
    }
  };

  // Toggle speed
  const handleToggleSpeed = () => {
    const newSpeed = speechSpeed === 1.0 ? 0.75 : 1.0;
    setSpeechSpeed(newSpeed);
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant');
    if (lastAssistantMsg) {
      audioService.speak(lastAssistantMsg.content, langConfig.locale, newSpeed);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = Math.min(
    100,
    Math.round((elapsedSeconds / targetDurationSeconds) * 100)
  );

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4 py-1.5 flex flex-col flex-1 h-[calc(100vh-72px)] min-h-0">
      {/* Top Call Status Bar */}
      <div className="bg-[#1b2b33] border-2 border-[#37464f] rounded-2xl p-2 sm:p-2.5 mb-2 shadow-lg shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Persona info & Live Call indicator */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-[#58cc02]/20 border-2 border-[#58cc02] flex items-center justify-center font-black text-xl">
                {langConfig.flag}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#58cc02] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#58cc02] border-2 border-[#131f24] items-center justify-center text-[8px] font-black text-[#131f24]">
                  ✓
                </span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-white text-base">
                  {currentScenario?.personaName}
                </span>
                <span className="bg-[#1cb0f6]/20 text-[#1cb0f6] text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                  {currentScenario?.personaRole}
                </span>
              </div>
              <div className="text-xs text-[#8495a0] font-semibold flex items-center gap-2">
                <span>{currentScenario?.title}</span>
                <span className="text-[#58cc02] font-extrabold flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse" />
                  Live Voice Call
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Timer, View Switcher & End Call */}
          <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
            {/* Call Duration Timer */}
            <div className="flex items-center gap-2 bg-[#131f24] px-3 py-1.5 rounded-xl border border-[#37464f]">
              <Clock className="w-4 h-4 text-[#ff9600]" />
              <div className="text-xs font-black">
                <span className="text-white">{formatTime(elapsedSeconds)}</span>
                <span className="text-[#8495a0]"> / {formatTime(targetDurationSeconds)}</span>
              </div>
            </div>

            {/* Toggle View: Call vs Transcript */}
            <button
              onClick={() => setViewMode(viewMode === 'call' ? 'transcript' : 'call')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                viewMode === 'call'
                  ? 'bg-[#131f24] text-[#1cb0f6] border-[#1cb0f6]/40 hover:bg-[#20343f]'
                  : 'bg-[#1cb0f6] text-white border-[#0482c8]'
              }`}
              title="Switch between Live Verbal Call and Transcript view"
            >
              {viewMode === 'call' ? <FileText className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {viewMode === 'call' ? 'Transcript' : 'Voice Screen'}
              </span>
            </button>

            {/* Ask Duo Tutor in-call button */}
            <button
              onClick={() => {
                const lastMsg = lastAssistantMessage?.content || '';
                onOpenTutor(lastMsg);
              }}
              className="flex items-center gap-1.5 bg-[#ffd900] hover:bg-[#e5c300] active:translate-y-0.5 text-[#131f24] font-black text-xs uppercase px-3 py-2 rounded-xl shadow-[0_3px_0_0_#b29700] transition cursor-pointer"
              title="Pause and ask Duo a language question"
            >
              <Lightbulb className="w-4 h-4 fill-[#131f24]" />
              <span className="hidden sm:inline">Ask Coach</span>
            </button>

            {/* End Call & Generate Report */}
            <button
              onClick={() => {
                audioService.stopSpeaking();
                stopListening();
                cleanupAudioStream();
                if (soundEnabled) audioService.playCallEnded();
                onFinishAndGenerateReport(messages, elapsedSeconds);
              }}
              disabled={isGeneratingReport}
              className="flex items-center gap-1.5 bg-[#ff4b4b] hover:bg-[#ea2b2b] active:translate-y-0.5 text-white font-black text-xs uppercase px-3.5 py-2 rounded-xl shadow-[0_3px_0_0_#c01e1e] transition cursor-pointer disabled:opacity-50"
              title="End conversation and generate skills report"
            >
              <PhoneOff className="w-4 h-4" />
              <span>{isGeneratingReport ? 'Analyzing...' : 'End Call'}</span>
            </button>
          </div>
        </div>

        {/* Target Session Progress Bar */}
        <div className="w-full bg-[#131f24] h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#ff9600] to-[#58cc02] transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* VIEW 1: LIVE VERBAL CALL SCREEN */}
      {viewMode === 'call' ? (
        <div className="flex-1 flex flex-col bg-[#1b2b33] border-2 border-[#37464f] rounded-3xl p-2.5 sm:p-4 shadow-2xl relative min-h-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#58cc02]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Status & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 z-10 shrink-0 pb-1.5 border-b border-[#37464f]/40">
            <div className="flex items-center gap-2">
              {/* Mic State Indicator Capsule */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300 ${
                  isMicActive
                    ? 'bg-[#ff4b4b]/20 border-[#ff4b4b] text-[#ff4b4b] shadow-[0_0_10px_rgba(255,75,75,0.4)]'
                    : 'bg-[#131f24] border-[#37464f] text-[#8495a0]'
                }`}
              >
                <span className="relative flex h-2.5 w-2.5">
                  {isMicActive ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff4b4b] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff4b4b]"></span>
                    </>
                  ) : (
                    <span className="inline-flex rounded-full h-2.5 w-2.5 bg-[#37464f]"></span>
                  )}
                </span>
                <span className="text-[11px] font-black uppercase tracking-wider">
                  {isMicActive ? 'Mic: LISTENING' : 'Mic: NOT LISTENING'}
                </span>
              </div>

              {/* Persona status */}
              <span className="text-xs font-extrabold text-[#a0b1bc] hidden md:inline">
                • {callState === 'speaking'
                  ? `${currentScenario?.personaName} is speaking...`
                  : callState === 'listening'
                  ? 'Say your answer aloud...'
                  : callState === 'processing'
                  ? `${currentScenario?.personaName} is thinking...`
                  : callState === 'paused'
                  ? 'Call Paused'
                  : 'Ready to speak'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setHandsFreeMode(!handsFreeMode)}
                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border transition ${
                  handsFreeMode
                    ? 'bg-[#58cc02]/20 border-[#58cc02] text-[#58cc02]'
                    : 'bg-[#131f24] border-[#37464f] text-[#8495a0]'
                }`}
              >
                {handsFreeMode ? '⚡ Auto-Reply ON' : 'Manual Mic'}
              </button>

              <button
                onClick={handleToggleSpeed}
                className={`text-[10px] font-black px-2 py-0.5 rounded-lg border transition ${
                  speechSpeed === 0.75
                    ? 'bg-[#ff9600]/20 border-[#ff9600] text-[#ff9600]'
                    : 'bg-[#131f24] border-[#37464f] text-[#8495a0]'
                }`}
              >
                🐢 {speechSpeed === 0.75 ? '0.75x' : '1.0x'}
              </button>
            </div>
          </div>

          {/* Error / Permission Diagnostic Notification */}
          {micErrorMessage && (
            <div className="z-20 my-1 p-2 rounded-xl bg-[#ff9600]/15 border border-[#ff9600] flex items-center justify-between gap-2 text-xs shrink-0">
              <div className="flex items-center gap-1.5 text-white text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#ff9600] shrink-0" />
                <span className="truncate">{micErrorMessage}</span>
              </div>
              <button
                onClick={initMicrophoneStream}
                className="bg-[#ff9600] hover:bg-[#e57c00] text-[#131f24] font-black text-[10px] uppercase px-2.5 py-1 rounded-lg whitespace-nowrap cursor-pointer"
              >
                Allow Mic
              </button>
            </div>
          )}

          {/* Scrollable Center Stage (Avatar, Soundwaves, Teleprompter, Suggestions) */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center text-center z-10 py-1.5 scrollbar-thin">
            {/* Character Avatar with Pulsing Rings */}
            <div className="relative flex items-center justify-center mb-2 shrink-0">
              {callState === 'speaking' && (
                <>
                  <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-[#58cc02]/40 animate-ping" />
                  <div
                    className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-[#58cc02]/20 animate-pulse"
                    style={{ animationDuration: '1.2s' }}
                  />
                </>
              )}

              {callState === 'listening' && (
                <>
                  <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-[#1cb0f6]/40 animate-ping" />
                  <div
                    className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full border border-[#1cb0f6]/20 animate-pulse"
                    style={{ animationDuration: '1s' }}
                  />
                </>
              )}

              <div
                className={`w-18 h-18 sm:w-22 sm:h-22 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 border-3 ${
                  callState === 'speaking'
                    ? 'bg-[#58cc02]/20 border-[#58cc02] scale-105 shadow-[#58cc02]/30'
                    : callState === 'listening'
                    ? 'bg-[#1cb0f6]/20 border-[#1cb0f6] scale-105 shadow-[#1cb0f6]/30'
                    : 'bg-[#131f24] border-[#37464f]'
                }`}
              >
                <DuoMascot
                  mood={
                    callState === 'speaking'
                      ? 'talking'
                      : callState === 'listening'
                      ? 'waving'
                      : callState === 'processing'
                      ? 'thinking'
                      : 'coaching'
                  }
                  size="lg"
                />
              </div>
            </div>

            {/* Dynamic Sound Wave Bars Graphic */}
            <div className="flex items-center gap-1 h-5 mb-2 shrink-0">
              {[12, 22, 16, 26, 14, 24, 14, 26, 18, 12].map((height, idx) => {
                const isActive = callState === 'speaking' || callState === 'listening';
                const dynamicHeight = isMicActive && micVolume > 5
                  ? Math.max(4, Math.round((micVolume / 100) * height * 1.5))
                  : isActive
                  ? Math.max(4, Math.round(height * Math.random() * 1.2))
                  : 3;

                return (
                  <div
                    key={idx}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      callState === 'speaking'
                        ? 'bg-[#58cc02]'
                        : callState === 'listening'
                        ? 'bg-[#1cb0f6]'
                        : 'bg-[#37464f]'
                    }`}
                    style={{
                      height: `${dynamicHeight}px`,
                    }}
                  />
                );
              })}
            </div>

            {/* Live Subtitles & Teleprompter */}
            <div className="max-w-xl w-full bg-[#131f24]/90 backdrop-blur-md border border-[#37464f] rounded-2xl p-3 shadow-xl text-left mb-2">
              {lastAssistantMessage && (
                <div className="mb-1.5">
                  <div className="text-[10px] font-black uppercase text-[#58cc02] mb-0.5 flex items-center justify-between">
                    <span>{currentScenario?.personaName} said:</span>
                    <button
                      onClick={() => setShowLiveTranslation(!showLiveTranslation)}
                      className="text-[#8495a0] hover:text-white flex items-center gap-1 text-[10px] lowercase"
                    >
                      <Globe2 className="w-3 h-3" />
                      <span>{showLiveTranslation ? 'Hide English' : 'Show English'}</span>
                    </button>
                  </div>
                  <p className="font-extrabold text-white text-sm sm:text-base leading-snug">
                    "{lastAssistantMessage.content}"
                  </p>
                  {showLiveTranslation && lastAssistantMessage.translation && (
                    <p className="text-xs text-[#a0b1bc] font-semibold italic mt-0.5">
                      {lastAssistantMessage.translation}
                    </p>
                  )}
                </div>
              )}

              {/* Spoken by User (Live Interim Speech Recognition) */}
              {callState === 'listening' && (
                <div className="mt-2 pt-2 border-t border-[#37464f] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-2 h-2 rounded-full bg-[#1cb0f6] animate-ping shrink-0" />
                    <p className="text-xs font-black text-[#1cb0f6] italic truncate">
                      {liveTranscript
                        ? `Hearing you: "${liveTranscript}..."`
                        : `Speak in ${objectiveState.targetLanguage} now (I'm listening)...`}
                    </p>
                  </div>

                  {liveTranscript && (
                    <button
                      onClick={() => handleSpokenComplete(liveTranscript)}
                      className="bg-[#1cb0f6] hover:bg-[#0482c8] text-white font-black text-[10px] uppercase px-2 py-0.5 rounded-md shrink-0 cursor-pointer"
                    >
                      Send Now
                    </button>
                  )}
                </div>
              )}

              {/* Gentle Correction Banner during call */}
              {lastAssistantMessage?.gentleCorrection?.hasMistake && (
                <div className="mt-2 pt-1.5 border-t border-[#37464f] flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#ffd900] shrink-0" />
                  <span className="text-[10px] text-[#ffd900] font-bold">
                    Duo Tip: Instead of "{lastAssistantMessage.gentleCorrection.originalPhrase}", locals say{' '}
                    <span className="underline">"{lastAssistantMessage.gentleCorrection.improvedPhrase}"</span>
                  </span>
                </div>
              )}
            </div>

            {/* Quick Spoken Reply Starters */}
            {lastAssistantMessage?.suggestedReplies && lastAssistantMessage.suggestedReplies.length > 0 && (
              <div className="w-full max-w-xl flex items-center justify-center gap-1.5 overflow-x-auto py-0.5 scrollbar-none mb-1 shrink-0">
                <span className="text-[9px] font-black uppercase text-[#8495a0] whitespace-nowrap">
                  Say this:
                </span>
                {lastAssistantMessage.suggestedReplies.map((reply, rIdx) => (
                  <button
                    key={rIdx}
                    onClick={() => {
                      handleSendMessage(reply);
                    }}
                    className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#131f24] hover:bg-[#20343f] border border-[#37464f] hover:border-[#58cc02] text-[11px] font-bold text-white transition cursor-pointer"
                  >
                    "{reply}"
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pinned Bottom Control Dock Area (Always fully on screen!) */}
          <div className="shrink-0 z-20 pt-2 border-t border-[#37464f]/60 space-y-2">
            {/* In-Call Quick Speech / Text Input Bar */}
            <div className="flex items-center gap-2 max-w-xl mx-auto w-full">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inputText.trim()) {
                    handleSendMessage(inputText);
                  }
                }}
                placeholder={`Or type your spoken response here in ${objectiveState.targetLanguage}...`}
                className="flex-1 bg-[#131f24] border border-[#37464f] focus:border-[#58cc02] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#8495a0] outline-none"
              />
              {inputText.trim() && (
                <button
                  onClick={() => handleSendMessage(inputText)}
                  className="bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-xs uppercase px-3 py-1.5 rounded-xl cursor-pointer shrink-0"
                >
                  Send
                </button>
              )}
            </div>

            {/* Bottom Verbal Call Controls Dock */}
            <div className="bg-[#131f24] border-2 border-[#37464f] rounded-2xl p-2 sm:p-2.5 flex items-center justify-center gap-2 sm:gap-3 shadow-lg">
              {/* Pause Call */}
              <button
                onClick={handleTogglePause}
                className={`p-2.5 sm:p-3 rounded-xl border transition cursor-pointer ${
                  callState === 'paused'
                    ? 'bg-[#ffd900]/20 border-[#ffd900] text-[#ffd900]'
                    : 'bg-[#1b2b33] border-[#37464f] text-[#8495a0] hover:text-white'
                }`}
                title={callState === 'paused' ? 'Resume Call' : 'Pause Call'}
              >
                {callState === 'paused' ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
              </button>

              {/* Primary Microphone / Speak Button */}
              <button
                onClick={handleToggleMic}
                className={`flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm uppercase transition-all duration-200 cursor-pointer shadow-lg active:translate-y-0.5 select-none ${
                  isMicActive
                    ? 'bg-[#ff4b4b] hover:bg-[#ea2b2b] text-white shadow-[0_3px_0_0_#c01e1e] ring-4 ring-[#ff4b4b]/40 animate-pulse'
                    : 'bg-[#58cc02] hover:bg-[#46a302] text-white shadow-[0_3px_0_0_#398402]'
                }`}
                title={isMicActive ? 'Microphone is LIVE. Click to send.' : 'Microphone is OFF. Click to speak.'}
              >
                <div className="relative flex items-center justify-center">
                  {isMicActive ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                      <div className="w-7 h-7 rounded-full bg-white text-[#ff4b4b] flex items-center justify-center">
                        <Mic className="w-4 h-4 stroke-[2.5]" />
                      </div>
                    </>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-black/20 text-white flex items-center justify-center">
                      <Mic className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  )}
                </div>

                <div className="text-left">
                  <div className="flex items-center gap-1">
                    <span className="text-xs sm:text-sm font-black tracking-wide">
                      {isMicActive ? '🔴 MIC IS LISTENING...' : '🎙️ MIC IS OFF'}
                    </span>
                    {isMicActive && (
                      <span className="bg-white/20 text-white text-[9px] font-black uppercase px-1 py-0.2 rounded">
                        LIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-bold opacity-90 truncate max-w-[200px] sm:max-w-none">
                    {isMicActive
                      ? liveTranscript
                        ? 'Heard you! Tap to send'
                        : 'Speak now (tap to stop)'
                      : `Tap to speak (${objectiveState.targetLanguage})`}
                  </div>
                </div>

                {/* Real-time wave pill inside button */}
                {isMicActive && (
                  <div className="hidden sm:flex items-center gap-0.5 pl-2 border-l border-white/30 h-5">
                    {[6, 14, 18, 12, 16].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-white rounded-full animate-bounce"
                        style={{
                          height: `${Math.max(3, Math.round((micVolume > 5 ? micVolume / 100 : 0.4) * h))}px`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </button>

              {/* Replay Last Phrase out loud */}
              <button
                onClick={() => {
                  if (lastAssistantMessage) {
                    speakCharacterMessage(lastAssistantMessage.content);
                  }
                }}
                className="p-2.5 sm:p-3 rounded-xl bg-[#1b2b33] border-2 border-[#37464f] text-[#8495a0] hover:text-[#58cc02] transition cursor-pointer"
                title="Repeat last phrase out loud"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: TRANSCRIPT MODE */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-3">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-in fade-in`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[85%] ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border-b-2 mt-1 ${
                        isUser
                          ? 'bg-[#1cb0f6] text-white font-black text-xs border-[#0482c8]'
                          : 'bg-[#58cc02] border-[#46a302]'
                      }`}
                    >
                      {!isUser ? <DuoMascot mood="talking" size="sm" /> : 'YOU'}
                    </div>

                    <div
                      className={`p-3.5 rounded-3xl text-sm leading-relaxed ${
                        isUser
                          ? 'bg-[#1cb0f6] text-white rounded-tr-none shadow-[0_3px_0_0_#0482c8]'
                          : 'bg-[#1b2b33] text-white border-2 border-[#37464f] rounded-tl-none shadow-[0_3px_0_0_#20343f]'
                      }`}
                    >
                      <p className="font-extrabold tracking-wide">{msg.content}</p>

                      {!isUser && msg.translation && (
                        <div className="mt-2 pt-2 border-t border-[#37464f]/60">
                          {showTranslations[msg.id] ? (
                            <p className="text-xs text-[#a0b1bc] font-semibold italic">
                              "{msg.translation}"
                            </p>
                          ) : (
                            <button
                              onClick={() =>
                                setShowTranslations((prev) => ({
                                  ...prev,
                                  [msg.id]: !prev[msg.id],
                                }))
                              }
                              className="text-[11px] font-bold text-[#1cb0f6] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Globe2 className="w-3 h-3" />
                              <span>Show Translation</span>
                            </button>
                          )}
                        </div>
                      )}

                      {!isUser && (
                        <div className="mt-2.5 flex items-center justify-between gap-2 pt-1.5 border-t border-[#37464f]/40">
                          <button
                            onClick={() => audioService.speak(msg.content, langConfig.locale, speechSpeed)}
                            className="p-1 rounded-lg text-[#8495a0] hover:text-[#58cc02] transition"
                            title="Listen"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenTutor(msg.content)}
                            className="text-[11px] font-bold text-[#ffd900] hover:underline flex items-center gap-1"
                          >
                            <HelpCircle className="w-3 h-3" />
                            <span>Ask Coach</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-[#1b2b33] border-2 border-[#37464f] rounded-2xl p-2 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (inputText.trim()) {
                  handleSendMessage(inputText);
                }
              }}
              className="flex items-center gap-2"
            >
              {/* Mic Listening Toggle Button in Transcript Mode */}
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2.5 rounded-xl border-2 flex items-center gap-1.5 transition cursor-pointer ${
                  isMicActive
                    ? 'bg-[#ff4b4b] border-[#ff4b4b] text-white animate-pulse'
                    : 'bg-[#131f24] border-[#37464f] text-[#8495a0] hover:text-[#58cc02] hover:border-[#58cc02]'
                }`}
                title={isMicActive ? 'Mic is LISTENING. Click to stop.' : 'Mic is OFF. Click to speak.'}
              >
                {isMicActive ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    <Mic className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase hidden sm:inline">Listening</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase hidden sm:inline">Mic Off</span>
                  </>
                )}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Type or speak in ${objectiveState.targetLanguage}...`}
                className="flex-1 bg-[#131f24] border-2 border-[#37464f] focus:border-[#58cc02] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#8495a0] outline-none transition"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="bg-[#58cc02] hover:bg-[#46a302] disabled:opacity-40 text-white font-black p-2.5 rounded-xl transition cursor-pointer"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      )}
      {/* In-App Microphone Permission Guidance Modal */}
      {showMicPermissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-[#1b2b33] border-2 border-[#58cc02] rounded-3xl p-6 shadow-2xl relative text-center">
            <button
              onClick={() => setShowMicPermissionModal(false)}
              className="absolute top-4 right-4 text-[#8495a0] hover:text-white p-1 rounded-xl hover:bg-[#20343f]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-full bg-[#58cc02]/20 border-2 border-[#58cc02] flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-[#58cc02] animate-pulse" />
            </div>

            <h3 className="text-xl font-black text-white mb-2">
              Enable Microphone for Live Call
            </h3>
            <p className="text-xs text-[#a0b1bc] font-semibold mb-5 leading-relaxed">
              If Chrome or your browser didn't show the permission popup automatically, it may be restricted by the preview frame or site settings.
            </p>

            <div className="bg-[#131f24] border border-[#37464f] rounded-2xl p-4 text-left text-xs mb-5 space-y-2.5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#58cc02] text-[#131f24] font-black text-[11px] flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="text-white font-semibold">
                  Tap <span className="text-[#58cc02] font-black">"Request Mic Access"</span> below to trigger the browser prompt.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1cb0f6] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="text-white font-semibold">
                  Or check the <span className="text-[#1cb0f6] font-black">🔒 Lock / Camera icon</span> in your browser's address bar to set Microphone to <strong>"Allow"</strong>.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#ffd900] text-[#131f24] font-black text-[11px] flex items-center justify-center shrink-0">
                  3
                </span>
                <span className="text-white font-semibold">
                  Or open this app directly in a full browser tab for instant native microphone access!
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={async () => {
                  try {
                    await initMicrophoneStream();
                    setShowMicPermissionModal(false);
                    startListening();
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="w-full bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-xs uppercase py-3.5 rounded-2xl shadow-[0_4px_0_0_#398402] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Mic className="w-4 h-4" />
                <span>Request Mic Access (Trigger Popup)</span>
              </button>

              <button
                onClick={() => {
                  window.open(window.location.href, '_blank');
                }}
                className="w-full bg-[#1cb0f6] hover:bg-[#0482c8] text-white font-black text-xs uppercase py-3 rounded-2xl shadow-[0_4px_0_0_#0369a1] transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Open Call in Direct Window (Best Mic Support)</span>
              </button>

              <button
                onClick={() => {
                  setShowMicPermissionModal(false);
                  setIsMicActive(true);
                  setCallState('listening');
                }}
                className="w-full bg-[#131f24] hover:bg-[#20343f] text-[#8495a0] hover:text-white font-extrabold text-xs py-2.5 rounded-xl border border-[#37464f] transition cursor-pointer"
              >
                I'll use starter responses & speech typing for now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
