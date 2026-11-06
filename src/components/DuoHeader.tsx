import React from 'react';
import { DuoMascot } from './DuoMascot';
import { TargetLanguage, LearningGoal, ProficiencyLevel } from '../types/duo';
import { Flame, Gem, Heart, SlidersHorizontal, Sparkles, MessageSquare, Map, Award, Volume2, VolumeX } from 'lucide-react';
import { SUPPORTED_LANGUAGES, GOAL_OPTIONS } from '../data/curriculumData';

interface DuoHeaderProps {
  currentTab: 'path' | 'chat' | 'report' | 'drills';
  onSelectTab: (tab: 'path' | 'chat' | 'report' | 'drills') => void;
  targetLanguage: TargetLanguage;
  goal: LearningGoal;
  level: ProficiencyLevel;
  streak: number;
  gems: number;
  hearts: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenQuestionnaire: () => void;
  hasActiveReport: boolean;
}

export const DuoHeader: React.FC<DuoHeaderProps> = ({
  currentTab,
  onSelectTab,
  targetLanguage,
  goal,
  level,
  streak,
  gems,
  hearts,
  soundEnabled,
  onToggleSound,
  onOpenQuestionnaire,
  hasActiveReport,
}) => {
  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.name === targetLanguage) || SUPPORTED_LANGUAGES[0];
  const currentGoalObj = GOAL_OPTIONS.find((g) => g.id === goal) || GOAL_OPTIONS[0];

  return (
    <header className="sticky top-0 z-40 bg-[#131f24] border-b-2 border-[#37464f] px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Duolingo Logo & Extension Identifier */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onSelectTab('path')}>
            <DuoMascot mood="cheering" size="sm" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-['Fredoka',sans-serif] font-bold text-2xl tracking-wide text-[#58cc02]">
                  duolingo
                </span>
                <span className="bg-[#58cc02]/20 text-[#58cc02] text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border border-[#58cc02]/40">
                  Immersion+
                </span>
              </div>
              <span className="text-[11px] font-semibold text-[#8495a0] hidden sm:inline">
                Personalized Objective Extension
              </span>
            </div>
          </div>

          {/* Current Path Badge (clickable to reconfigure) */}
          <button
            onClick={onOpenQuestionnaire}
            className="hidden md:flex items-center gap-2 bg-[#1b2b33] hover:bg-[#20343f] text-white px-3 py-1.5 rounded-xl border-2 border-[#37464f] transition group"
            title="Click to customize language, goal or proficiency"
          >
            <span className="text-base">{currentLangObj.flag}</span>
            <div className="text-left text-xs">
              <div className="font-extrabold flex items-center gap-1">
                <span>{currentLangObj.name}</span>
                <span className="text-[#58cc02]">• {level}</span>
              </div>
              <div className="text-[10px] text-[#8495a0] group-hover:text-white transition">
                {currentGoalObj.title}
              </div>
            </div>
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#8495a0] group-hover:text-[#58cc02] transition ml-1" />
          </button>
        </div>

        {/* Center: Navigation Pill Switcher */}
        <nav className="flex items-center bg-[#1b2b33] p-1 rounded-2xl border-2 border-[#37464f]">
          <button
            onClick={() => onSelectTab('path')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
              currentTab === 'path'
                ? 'bg-[#58cc02] text-white shadow-md'
                : 'text-[#8495a0] hover:text-white'
            }`}
          >
            <Map className="w-4 h-4" />
            <span className="hidden sm:inline">Course Path</span>
          </button>

          <button
            onClick={() => onSelectTab('chat')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
              currentTab === 'chat'
                ? 'bg-[#1cb0f6] text-white shadow-md'
                : 'text-[#8495a0] hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">AI Immersion</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1cb0f6] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#58cc02]"></span>
            </span>
          </button>

          <button
            onClick={() => onSelectTab('report')}
            className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
              currentTab === 'report'
                ? 'bg-[#ce82ff] text-white shadow-md'
                : 'text-[#8495a0] hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Skills Report</span>
            {hasActiveReport && (
              <span className="w-2 h-2 rounded-full bg-[#ff9600]"></span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('drills')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
              currentTab === 'drills'
                ? 'bg-[#ff9600] text-white shadow-md'
                : 'text-[#8495a0] hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Remediation</span>
          </button>
        </nav>

        {/* Right: Gamification Stats & Sound Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Streak */}
          <div className="flex items-center gap-1 text-sm font-black text-[#ff9600] bg-[#1b2b33] px-2.5 py-1 rounded-xl border border-[#37464f]">
            <Flame className="w-4 h-4 fill-[#ff9600]" />
            <span>{streak}</span>
          </div>

          {/* Gems */}
          <div className="hidden sm:flex items-center gap-1 text-sm font-black text-[#1cb0f6] bg-[#1b2b33] px-2.5 py-1 rounded-xl border border-[#37464f]">
            <Gem className="w-4 h-4 fill-[#1cb0f6]" />
            <span>{gems}</span>
          </div>

          {/* Hearts */}
          <div className="flex items-center gap-1 text-sm font-black text-[#ff4b4b] bg-[#1b2b33] px-2.5 py-1 rounded-xl border border-[#37464f]">
            <Heart className="w-4 h-4 fill-[#ff4b4b]" />
            <span>{hearts}</span>
          </div>

          {/* Audio toggle */}
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            className="p-1.5 text-[#8495a0] hover:text-white bg-[#1b2b33] rounded-xl border border-[#37464f] transition"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-[#58cc02]" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          {/* Mobile questionnaire launcher */}
          <button
            onClick={onOpenQuestionnaire}
            className="md:hidden p-1.5 text-[#8495a0] hover:text-white bg-[#1b2b33] rounded-xl border border-[#37464f] transition"
            title="Preferences"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
