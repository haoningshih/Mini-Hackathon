import React, { useState } from 'react';
import { TargetLanguage, LearningGoal, ProficiencyLevel, UserObjectiveState } from '../types/duo';
import { SUPPORTED_LANGUAGES, GOAL_OPTIONS, getScenariosForLanguageAndGoal } from '../data/curriculumData';
import { DuoMascot } from './DuoMascot';
import {
  Plane,
  Briefcase,
  Home,
  Heart,
  GraduationCap,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  Compass,
} from 'lucide-react';
import { audioService } from '../utils/audio';

interface QuestionnaireModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: UserObjectiveState;
  onComplete: (newState: UserObjectiveState, targetAction: 'path' | 'chat') => void;
  soundEnabled: boolean;
}

export const QuestionnaireModal: React.FC<QuestionnaireModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onComplete,
  soundEnabled,
}) => {
  const [step, setStep] = useState<number>(1);
  const [targetLang, setTargetLang] = useState<TargetLanguage>(currentState.targetLanguage);
  const [selectedGoal, setSelectedGoal] = useState<LearningGoal>(currentState.goal);
  const [selectedLevel, setSelectedLevel] = useState<ProficiencyLevel>(currentState.level);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(currentState.selectedScenarioId);
  const [sessionMinutes, setSessionMinutes] = useState<number>(currentState.targetDurationMinutes || 10);
  const [isBuildingPath, setIsBuildingPath] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentGoalData = GOAL_OPTIONS.find((g) => g.id === selectedGoal) || GOAL_OPTIONS[0];
  const availableScenarios = getScenariosForLanguageAndGoal(targetLang, selectedGoal);

  const handleNext = () => {
    if (soundEnabled) audioService.playSuccess();
    if (step < 4) {
      if (step === 1 || step === 2) {
        const scenarios = getScenariosForLanguageAndGoal(targetLang, selectedGoal);
        if (scenarios.length > 0) {
          setSelectedScenarioId(scenarios[0].id);
        }
      }
      setStep(step + 1);
    } else {
      // Build personalized path animation
      setIsBuildingPath(true);
      setTimeout(() => {
        setIsBuildingPath(false);
        const scenarios = getScenariosForLanguageAndGoal(targetLang, selectedGoal);
        const resolvedScenarioId =
          scenarios.some((s) => s.id === selectedScenarioId)
            ? selectedScenarioId
            : scenarios[0]?.id || 'travel-tapas';

        const newState: UserObjectiveState = {
          targetLanguage: targetLang,
          nativeLanguage: 'English',
          goal: selectedGoal,
          level: selectedLevel,
          selectedScenarioId: resolvedScenarioId,
          targetDurationMinutes: sessionMinutes,
          hasCompletedQuestionnaire: true,
        };
        onComplete(newState, 'chat');
      }, 1200);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const getGoalIcon = (iconName: string) => {
    switch (iconName) {
      case 'Plane':
        return <Plane className="w-6 h-6 text-[#ff9600]" />;
      case 'Briefcase':
        return <Briefcase className="w-6 h-6 text-[#1cb0f6]" />;
      case 'Home':
        return <Home className="w-6 h-6 text-[#2ce080]" />;
      case 'Heart':
        return <Heart className="w-6 h-6 text-[#ce82ff]" />;
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6 text-[#ff4b4b]" />;
      default:
        return <Sparkles className="w-6 h-6 text-[#58cc02]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#1b2b33] border-2 border-[#37464f] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Progress Bar */}
        <div className="w-full bg-[#131f24] h-2">
          <div
            className="h-full bg-[#58cc02] transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-[#37464f]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`p-1.5 rounded-xl border border-[#37464f] text-[#8495a0] transition ${
                step === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-white hover:bg-[#20343f]'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#58cc02]">
                Personalization Wizard
              </span>
              <span className="text-xs font-bold text-[#8495a0]">• Step {step} of 4</span>
            </div>
          </div>
          {currentState.hasCompletedQuestionnaire && (
            <button
              onClick={onClose}
              className="text-[#8495a0] hover:text-white font-extrabold text-sm px-3 py-1 rounded-xl hover:bg-[#20343f]"
            >
              Close
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {isBuildingPath ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <DuoMascot mood="cheering" size="xl" className="animate-bounce mb-6" />
              <h2 className="text-2xl font-black text-white mb-2">
                Assembling Your Tailored Objective Path!
              </h2>
              <p className="text-[#8495a0] text-sm max-w-md mb-6">
                Calibrating Duolingo curriculum modules, scenario characters, and AI immersion parameters for {targetLang} ({selectedLevel})...
              </p>
              <div className="flex items-center gap-2 text-[#58cc02] font-extrabold text-sm animate-pulse">
                <Sparkles className="w-5 h-5" />
                <span>Ready to start your conversation!</span>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: Select Target Language */}
              {step === 1 && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <DuoMascot mood="waving" size="lg" />
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        Which language do you want to learn?
                      </h2>
                      <p className="text-sm font-semibold text-[#8495a0]">
                        We will calibrate conversational roleplays and specific curriculum units for your goal.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {SUPPORTED_LANGUAGES.map((lang) => {
                      const isSelected = targetLang === lang.name;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => setTargetLang(lang.name)}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 transition text-left cursor-pointer ${
                            isSelected
                              ? 'bg-[#58cc02]/15 border-[#58cc02] shadow-[0_4px_0_0_#46a302]'
                              : 'bg-[#131f24] border-[#37464f] hover:border-[#58cc02]/60 hover:bg-[#16272e]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-3xl">{lang.flag}</span>
                            <div>
                              <div className="font-extrabold text-white text-base">
                                {lang.name}
                              </div>
                              <div className="text-xs text-[#8495a0] font-bold">
                                {lang.nativeName}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[#58cc02] flex items-center justify-center text-[#131f24] font-black">
                              <Check className="w-4 h-4 text-white stroke-[3]" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: Main Learning Objective */}
              {step === 2 && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <DuoMascot mood="coaching" size="lg" />
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        What is the main objective of your learning?
                      </h2>
                      <p className="text-sm font-semibold text-[#8495a0]">
                        This directs you to specific Duolingo units and unlocks custom AI conversation simulations.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {GOAL_OPTIONS.map((g) => {
                      const isSelected = selectedGoal === g.id;
                      return (
                        <button
                          key={g.id}
                          onClick={() => setSelectedGoal(g.id)}
                          className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 transition text-left cursor-pointer ${
                            isSelected
                              ? 'bg-[#1cb0f6]/15 border-[#1cb0f6] shadow-[0_4px_0_0_#0482c8]'
                              : 'bg-[#131f24] border-[#37464f] hover:border-[#1cb0f6]/60 hover:bg-[#16272e]'
                          }`}
                        >
                          <div className="p-2.5 rounded-xl bg-[#1b2b33] border border-[#37464f]">
                            {getGoalIcon(g.icon)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-black text-white text-base">
                                {g.title}
                              </span>
                              {isSelected && (
                                <span className="bg-[#1cb0f6] text-white text-[11px] font-extrabold px-2 py-0.5 rounded-md">
                                  Selected
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#8495a0] font-semibold leading-relaxed">
                              {g.subtitle}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: Current Proficiency Level */}
              {step === 3 && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <DuoMascot mood="thinking" size="lg" />
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        What is your current level in {targetLang}?
                      </h2>
                      <p className="text-sm font-semibold text-[#8495a0]">
                        The AI will adapt its speed, grammar complexity, and vocabulary to match your level.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[
                      {
                        level: 'A1',
                        title: 'Complete Beginner (A1)',
                        desc: 'I know zero or just a handful of words like "hola" and "gracias".',
                        detail: 'AI uses basic greetings, slow pace, and maximum scaffolded hints.',
                      },
                      {
                        level: 'A2',
                        title: 'Elementary (A2)',
                        desc: 'I can order food, ask simple directions, and introduce myself.',
                        detail: 'AI uses everyday travel & work phrases, simple questions, and gentle corrections.',
                      },
                      {
                        level: 'B1',
                        title: 'Intermediate Conversational (B1)',
                        desc: 'I can converse casually but struggle with past tenses and subjunctive.',
                        detail: 'AI speaks at natural speed with realistic dialogue and nuanced idioms.',
                      },
                      {
                        level: 'B2',
                        title: 'Upper-Intermediate / Advanced (B2+)',
                        desc: 'I can express opinions comfortably; I want professional polish and fluency.',
                        detail: 'AI challenges you with rapid dialogue, complex grammar, and business debate.',
                      },
                    ].map((lvl) => {
                      const isSelected = selectedLevel === lvl.level;
                      return (
                        <button
                          key={lvl.level}
                          onClick={() => setSelectedLevel(lvl.level as ProficiencyLevel)}
                          className={`w-full p-4 rounded-2xl border-2 transition text-left cursor-pointer ${
                            isSelected
                              ? 'bg-[#58cc02]/15 border-[#58cc02] shadow-[0_4px_0_0_#46a302]'
                              : 'bg-[#131f24] border-[#37464f] hover:border-[#58cc02]/60 hover:bg-[#16272e]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-extrabold text-white text-base">
                              {lvl.title}
                            </span>
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#58cc02] flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-[#a0b1bc] font-bold mb-1">{lvl.desc}</p>
                          <p className="text-[11px] text-[#58cc02] font-semibold">{lvl.detail}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: Choose Real-Life Scenario & Conversation Length */}
              {step === 4 && (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <DuoMascot mood="cheering" size="lg" />
                    <div>
                      <h2 className="text-2xl font-black text-white">
                        Pick your immersion scenario & session length
                      </h2>
                      <p className="text-sm font-semibold text-[#8495a0]">
                        After each conversation, you will receive a diagnostic skills report and direct remediation modules.
                      </p>
                    </div>
                  </div>

                  {/* Scenarios for this goal */}
                  <div className="mb-6">
                    <label className="block text-xs font-black uppercase text-[#8495a0] mb-2 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#ff9600]" />
                      Real-Life Scenario to Practice
                    </label>
                    <div className="space-y-2.5">
                      {availableScenarios.map((sc) => {
                        const isSelected = selectedScenarioId === sc.id;
                        return (
                          <button
                            key={sc.id}
                            onClick={() => setSelectedScenarioId(sc.id)}
                            className={`w-full p-3.5 rounded-2xl border-2 transition text-left cursor-pointer ${
                              isSelected
                                ? 'bg-[#ff9600]/15 border-[#ff9600] shadow-[0_3px_0_0_#d87c00]'
                                : 'bg-[#131f24] border-[#37464f] hover:border-[#ff9600]/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-white text-sm">
                                {sc.title}
                              </span>
                              <span className="text-[11px] font-bold text-[#ff9600] bg-[#ff9600]/10 px-2 py-0.5 rounded-md">
                                {sc.personaName} ({sc.personaRole})
                              </span>
                            </div>
                            <p className="text-xs text-[#8495a0]">{sc.description}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Session Duration Selector */}
                  <div>
                    <label className="block text-xs font-black uppercase text-[#8495a0] mb-2 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#1cb0f6]" />
                      Target Conversation Session Length
                    </label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {[
                        { min: 5, label: '5 min', desc: 'Bite-sized' },
                        { min: 10, label: '10 min', desc: 'Recommended' },
                        { min: 15, label: '15 min', desc: 'Deep dive' },
                        { min: 20, label: '20 min', desc: 'Full fluency' },
                      ].map((item) => {
                        const isSelected = sessionMinutes === item.min;
                        return (
                          <button
                            key={item.min}
                            onClick={() => setSessionMinutes(item.min)}
                            className={`p-3 rounded-2xl border-2 text-center transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#1cb0f6]/20 border-[#1cb0f6] shadow-[0_3px_0_0_#0482c8]'
                                : 'bg-[#131f24] border-[#37464f] hover:border-[#1cb0f6]/50'
                            }`}
                          >
                            <div className="font-black text-white text-sm">
                              {item.label}
                            </div>
                            <div className="text-[10px] font-bold text-[#8495a0]">
                              {item.desc}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-[#8495a0] mt-2">
                      💡 You can finish anytime during the chat to instantly generate your detailed Skills Report!
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer Controls */}
        {!isBuildingPath && (
          <div className="px-6 py-4 bg-[#131f24] border-t border-[#37464f] flex items-center justify-between">
            <div className="text-xs text-[#8495a0] font-bold">
              {step < 4 ? 'Tailored to your personal objectives' : 'Creates custom course path & unlocks AI chat'}
            </div>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 bg-[#58cc02] hover:bg-[#46a302] active:translate-y-1 text-white font-black text-sm uppercase tracking-wider px-6 py-3 rounded-2xl shadow-[0_4px_0_0_#398402] transition cursor-pointer"
            >
              <span>{step === 4 ? 'Start Immersion' : 'Continue'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
