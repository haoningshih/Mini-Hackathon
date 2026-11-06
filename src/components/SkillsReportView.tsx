import React, { useState } from 'react';
import { SkillsReport, RecommendedModule, PracticeDrill } from '../types/duo';
import { DuoMascot } from './DuoMascot';
import {
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Flame,
  Check,
  X,
  Clock,
  Compass,
} from 'lucide-react';
import { audioService } from '../utils/audio';

interface SkillsReportViewProps {
  report: SkillsReport;
  onNavigateToModule: (moduleId: string) => void;
  onStartNewConversation: () => void;
  onDrillComplete: (drillId: string, earnedXp: number) => void;
  soundEnabled: boolean;
}

export const SkillsReportView: React.FC<SkillsReportViewProps> = ({
  report,
  onNavigateToModule,
  onStartNewConversation,
  onDrillComplete,
  soundEnabled,
}) => {
  const [activeDrillIndex, setActiveDrillIndex] = useState<number>(0);
  const [selectedDrillOption, setSelectedDrillOption] = useState<string | null>(null);
  const [isDrillSubmitted, setIsDrillSubmitted] = useState<boolean>(false);
  const [completedDrills, setCompletedDrills] = useState<{ [id: string]: boolean }>({});

  const drills = report.immediatePracticeDrills || [];
  const currentDrill = drills[activeDrillIndex];

  const handleSelectOption = (opt: string) => {
    if (isDrillSubmitted) return;
    setSelectedDrillOption(opt);
  };

  const handleSubmitDrill = () => {
    if (!selectedDrillOption || !currentDrill) return;
    setIsDrillSubmitted(true);

    const isCorrect = selectedDrillOption === currentDrill.correctOption;
    if (isCorrect) {
      if (soundEnabled) audioService.playSuccess();
      setCompletedDrills((prev) => ({ ...prev, [currentDrill.id]: true }));
      onDrillComplete(currentDrill.id, 20);
    } else {
      if (soundEnabled) audioService.playError();
    }
  };

  const handleNextDrill = () => {
    setSelectedDrillOption(null);
    setIsDrillSubmitted(false);
    if (activeDrillIndex < drills.length - 1) {
      setActiveDrillIndex(activeDrillIndex + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Top Hero Banner */}
      <div className="bg-[#1b2b33] border-2 border-[#37464f] rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10 text-center sm:text-left">
          <DuoMascot mood="cheering" size="lg" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className="bg-[#58cc02] text-[#131f24] font-black text-xs uppercase px-3 py-1 rounded-full shadow-sm">
                Session Completed
              </span>
              <span className="bg-[#1cb0f6]/20 text-[#1cb0f6] font-extrabold text-xs px-2.5 py-0.5 rounded-lg border border-[#1cb0f6]/40">
                {report.cefrBand} Level
              </span>
              <span className="text-xs text-[#8495a0] font-semibold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {Math.round(report.durationSeconds / 60)} min conversation
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">
              {report.overallGrade}
            </h1>
            <p className="text-xs sm:text-sm text-[#a0b1bc] font-semibold leading-relaxed">
              {report.summaryAssessment}
            </p>
          </div>

          <button
            onClick={onStartNewConversation}
            className="flex items-center gap-2 bg-[#1cb0f6] hover:bg-[#0482c8] active:translate-y-1 text-white font-black text-xs uppercase px-4 py-3 rounded-2xl shadow-[0_4px_0_0_#0369a1] transition cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Another Session</span>
          </button>
        </div>
      </div>

      {/* 4 Core Competency Score Cards */}
      <div>
        <h2 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-[#ffd900]" />
          Conversational Competency Breakdown
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              title: 'Grammar & Syntax',
              score: report.grammarScore,
              color: '#58cc02',
              desc: 'Tenses, agreements & word order',
            },
            {
              title: 'Vocabulary Range',
              score: report.vocabScore,
              color: '#1cb0f6',
              desc: 'Topic-specific expressions',
            },
            {
              title: 'Fluency & Flow',
              score: report.fluencyScore,
              color: '#ff9600',
              desc: 'Response rhythm & spontaneity',
            },
            {
              title: 'Cultural Pragmatics',
              score: report.culturalPragmaticsScore,
              color: '#ce82ff',
              desc: 'Courtesy registers & idiom usage',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="bg-[#1b2b33] border-2 border-[#37464f] rounded-2xl p-4 flex flex-col justify-between shadow-md"
            >
              <div>
                <span className="text-[11px] font-black uppercase text-[#8495a0] block mb-1">
                  {item.title}
                </span>
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-3xl font-black"
                    style={{ color: item.color }}
                  >
                    {item.score}%
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="w-full bg-[#131f24] h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${item.score}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
                <span className="text-[10px] text-[#8495a0] font-semibold mt-1 block">
                  {item.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Identified Strengths & Weaknesses (2-column grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths Card */}
        <div className="bg-[#1b2b33] border-2 border-[#37464f] rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-black text-[#58cc02] uppercase mb-4">
            <CheckCircle2 className="w-5 h-5 text-[#58cc02]" />
            What You Did Great
          </div>

          <div className="space-y-3.5">
            {report.strengths.map((str, sIdx) => (
              <div
                key={sIdx}
                className="p-3 rounded-2xl bg-[#131f24] border border-[#37464f]"
              >
                <div className="font-extrabold text-white text-sm mb-1">
                  {str.title}
                </div>
                <p className="text-xs text-[#a0b1bc] font-semibold mb-2">
                  {str.description}
                </p>
                {str.userQuote && (
                  <div className="text-[11px] font-mono bg-[#1b2b33] text-[#58cc02] px-2.5 py-1 rounded-lg border border-[#37464f] italic">
                    "{str.userQuote}"
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Growth Areas (Errors to Improve) */}
        <div className="bg-[#1b2b33] border-2 border-[#37464f] rounded-3xl p-5 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-black text-[#ff9600] uppercase mb-4">
            <AlertTriangle className="w-5 h-5 text-[#ff9600]" />
            Areas to Improve & Specific Mistakes
          </div>

          <div className="space-y-3.5">
            {report.areasToImprove.map((area, aIdx) => (
              <div
                key={aIdx}
                className="p-3.5 rounded-2xl bg-[#131f24] border border-[#37464f] hover:border-[#ff9600]/50 transition"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-white text-xs">
                    {area.skill}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                      area.severity === 'high'
                        ? 'bg-[#ff4b4b]/20 text-[#ff4b4b]'
                        : 'bg-[#ff9600]/20 text-[#ff9600]'
                    }`}
                  >
                    {area.severity} priority
                  </span>
                </div>

                <div className="space-y-1 mb-2">
                  <div className="text-xs text-[#ff4b4b] line-through font-semibold">
                    You said: "{area.whatUserSaid}"
                  </div>
                  <div className="text-xs text-[#58cc02] font-black">
                    Better: "{area.recommendedCorrection}"
                  </div>
                </div>

                <p className="text-[11px] text-[#8495a0] font-semibold">
                  {area.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Duolingo Modules Recommended from this Conversation */}
      <div className="bg-[#1b2b33] border-2 border-[#37464f] rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-xs font-black uppercase text-[#ffd900] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 fill-[#ffd900]" />
              Personalized Course Remediation
            </div>
            <h2 className="text-xl font-black text-white">
              Recommended Duolingo Modules to Fix Your Weak Points
            </h2>
          </div>
        </div>

        <p className="text-xs text-[#8495a0] mb-5 font-semibold">
          These modules in your course pathway are dynamically chosen based on the errors detected during your conversation:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.personalizedModules.map((mod) => (
            <div
              key={mod.id}
              className="bg-[#131f24] border-2 border-[#37464f] hover:border-[#58cc02] rounded-2xl p-4 flex flex-col justify-between transition group shadow-md"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase bg-[#58cc02]/20 text-[#58cc02] px-2 py-0.5 rounded-md">
                    +{mod.xp} XP
                  </span>
                  <BookOpen className="w-4 h-4 text-[#8495a0] group-hover:text-[#58cc02] transition" />
                </div>
                <h3 className="font-black text-white text-sm mb-1 group-hover:text-[#58cc02] transition">
                  {mod.title}
                </h3>
                <p className="text-xs text-[#8495a0] font-semibold mb-3">
                  {mod.description}
                </p>
                <div className="text-[10px] text-[#ffd900] font-bold bg-[#ffd900]/10 p-2 rounded-xl mb-3">
                  🎯 {mod.objectiveAlignment}
                </div>
              </div>

              <button
                onClick={() => onNavigateToModule(mod.id)}
                className="w-full flex items-center justify-center gap-1.5 bg-[#58cc02] hover:bg-[#46a302] text-white font-extrabold text-xs uppercase py-2.5 rounded-xl shadow-[0_3px_0_0_#398402] transition cursor-pointer"
              >
                <span>Jump to Module</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Immediate Interactive Practice Drills (Fix Errors Right Away) */}
      {currentDrill && (
        <div className="bg-[#1b2b33] border-2 border-[#58cc02] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-[#37464f] mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ffd900] fill-[#ffd900]" />
              <h3 className="font-black text-white text-base">
                Immediate Remediation Drill ({activeDrillIndex + 1} of {drills.length})
              </h3>
            </div>
            <span className="text-xs font-black text-[#58cc02]">
              +20 XP per fix
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm font-extrabold text-white mb-4">
              {currentDrill.prompt}
            </p>

            {/* Options */}
            <div className="space-y-2.5">
              {currentDrill.options.map((opt, idx) => {
                const isSelected = selectedDrillOption === opt;
                let btnStyle =
                  'bg-[#131f24] border-[#37464f] text-white hover:border-[#58cc02]';

                if (isDrillSubmitted) {
                  if (opt === currentDrill.correctOption) {
                    btnStyle = 'bg-[#58cc02]/20 border-[#58cc02] text-[#58cc02] font-black';
                  } else if (isSelected) {
                    btnStyle = 'bg-[#ff4b4b]/20 border-[#ff4b4b] text-[#ff4b4b]';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-[#58cc02]/20 border-[#58cc02] text-white';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(opt)}
                    disabled={isDrillSubmitted}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 text-sm font-bold transition flex items-center justify-between cursor-pointer ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {isDrillSubmitted && opt === currentDrill.correctOption && (
                      <Check className="w-5 h-5 text-[#58cc02] stroke-[3]" />
                    )}
                    {isDrillSubmitted && isSelected && opt !== currentDrill.correctOption && (
                      <X className="w-5 h-5 text-[#ff4b4b] stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Explanation Banner when answered */}
          {isDrillSubmitted && (
            <div className="p-3.5 rounded-2xl bg-[#131f24] border border-[#37464f] mb-4 text-xs font-semibold text-[#a0b1bc]">
              💡 {currentDrill.explanation}
            </div>
          )}

          {/* Drill Action buttons */}
          <div className="flex justify-end gap-3">
            {!isDrillSubmitted ? (
              <button
                onClick={handleSubmitDrill}
                disabled={!selectedDrillOption}
                className="bg-[#58cc02] hover:bg-[#46a302] disabled:opacity-40 text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-[0_4px_0_0_#398402] transition cursor-pointer"
              >
                Check Answer
              </button>
            ) : (
              <button
                onClick={handleNextDrill}
                className="bg-[#1cb0f6] hover:bg-[#0482c8] text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-[0_4px_0_0_#0369a1] transition cursor-pointer flex items-center gap-1.5"
              >
                <span>{activeDrillIndex < drills.length - 1 ? 'Next Drill' : 'Drills Completed!'}</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
