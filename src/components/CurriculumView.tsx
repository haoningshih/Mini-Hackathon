import React, { useState } from 'react';
import { CurriculumUnit, CurriculumLessonNode, TargetLanguage, LearningGoal, ProficiencyLevel } from '../types/duo';
import { DuoMascot } from './DuoMascot';
import {
  BookOpen,
  Sparkles,
  MessageSquare,
  Star,
  Lock,
  Check,
  ChevronRight,
  Flame,
  Volume2,
  X,
  Play,
  Award,
} from 'lucide-react';
import { audioService } from '../utils/audio';

interface CurriculumViewProps {
  units: CurriculumUnit[];
  targetLanguage: TargetLanguage;
  goal: LearningGoal;
  level: ProficiencyLevel;
  onStartLesson: (node: CurriculumLessonNode, unit: CurriculumUnit) => void;
  onLaunchChatForScenario: () => void;
  onViewReport: () => void;
  hasActiveReport: boolean;
  soundEnabled: boolean;
}

export const CurriculumView: React.FC<CurriculumViewProps> = ({
  units,
  targetLanguage,
  goal,
  level,
  onStartLesson,
  onLaunchChatForScenario,
  onViewReport,
  hasActiveReport,
  soundEnabled,
}) => {
  const [selectedGuidebookUnit, setSelectedGuidebookUnit] = useState<CurriculumUnit | null>(null);

  const handlePlayAudio = (phrase: string) => {
    audioService.speak(phrase, targetLanguage === 'French' ? 'fr-FR' : 'es-ES');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Objective Hero Header */}
      <div className="bg-[#1b2b33] border-2 border-[#37464f] rounded-3xl p-6 mb-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-40 h-40 bg-[#58cc02]/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <DuoMascot mood="coaching" size="lg" />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#58cc02]/20 text-[#58cc02] text-xs font-black uppercase px-2.5 py-0.5 rounded-lg border border-[#58cc02]/30">
                  Targeted Pathway
                </span>
                <span className="text-xs font-bold text-[#8495a0]">CEFR {level}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white capitalize">
                {targetLanguage} for {goal}
              </h1>
              <p className="text-xs sm:text-sm text-[#8495a0] font-semibold mt-0.5">
                Curriculum customized to your goals with real-time AI conversational simulations.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <button
              onClick={onLaunchChatForScenario}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-[#1cb0f6] hover:bg-[#0482c8] active:translate-y-1 text-white font-black text-sm uppercase px-5 py-3 rounded-2xl shadow-[0_4px_0_0_#0369a1] transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Launch AI Immersion Chat</span>
            </button>

            {hasActiveReport && (
              <button
                onClick={onViewReport}
                className="flex items-center justify-center gap-2 bg-[#ce82ff] hover:bg-[#a855f7] active:translate-y-1 text-white font-black text-sm uppercase px-4 py-3 rounded-2xl shadow-[0_4px_0_0_#9333ea] transition cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>View Latest Skills Report</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Course Units Path */}
      <div className="space-y-12">
        {units.map((unit) => {
          return (
            <div key={unit.id} className="relative">
              {/* Unit Header Banner */}
              <div
                className={`rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
                  unit.colorScheme === 'green'
                    ? 'bg-[#58cc02] text-white shadow-[#46a302]/30'
                    : unit.colorScheme === 'amber'
                    ? 'bg-[#ff9600] text-white shadow-[#e57c00]/30'
                    : unit.colorScheme === 'blue'
                    ? 'bg-[#1cb0f6] text-white shadow-[#0482c8]/30'
                    : 'bg-[#ce82ff] text-white shadow-[#9333ea]/30'
                }`}
              >
                <div>
                  <div className="text-xs font-black uppercase tracking-wider opacity-90">
                    Unit {unit.unitNumber}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black">{unit.title}</h2>
                  <p className="text-xs sm:text-sm opacity-90 font-semibold max-w-xl">
                    {unit.description}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedGuidebookUnit(unit)}
                  className="flex items-center gap-2 bg-black/20 hover:bg-black/30 text-white font-extrabold text-xs uppercase px-3.5 py-2.5 rounded-xl border border-white/20 transition cursor-pointer whitespace-nowrap self-stretch sm:self-auto justify-center"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Guidebook</span>
                </button>
              </div>

              {/* Stepping-Stone Node Tree */}
              <div className="flex flex-col items-center gap-6 py-2">
                {unit.nodes.map((node, index) => {
                  // Slight zigzag winding path just like Duolingo
                  const offsetMap = ['translate-x-0', '-translate-x-10', 'translate-x-0', 'translate-x-10'];
                  const offsetClass = offsetMap[index % 4];

                  return (
                    <div
                      key={node.id}
                      className={`relative flex flex-col items-center ${offsetClass} transition-transform duration-300`}
                    >
                      {/* AI Remediation Callout Badge */}
                      {node.isRecommendedByAI && (
                        <div className="mb-2 bg-[#ffd900] text-[#131f24] font-black text-[11px] uppercase px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md border-2 border-[#131f24] animate-bounce">
                          <Sparkles className="w-3.5 h-3.5 fill-[#131f24]" />
                          <span>AI Recommended for You</span>
                        </div>
                      )}

                      {/* Lesson Circular Button */}
                      <button
                        onClick={() => node.isUnlocked && onStartLesson(node, unit)}
                        disabled={!node.isUnlocked}
                        className={`relative w-20 h-20 rounded-full flex flex-col items-center justify-center font-black transition-all cursor-pointer select-none group ${
                          !node.isUnlocked
                            ? 'bg-[#37464f] text-[#8495a0] cursor-not-allowed border-b-4 border-[#253238]'
                            : node.isCompleted
                            ? 'bg-[#ffd900] text-[#131f24] border-b-4 border-[#e5b700] hover:brightness-110 active:translate-y-1'
                            : node.isRecommendedByAI
                            ? 'bg-[#58cc02] text-white border-b-4 border-[#46a302] ring-4 ring-[#ffd900] ring-offset-4 ring-offset-[#131f24] hover:brightness-110 active:translate-y-1 animate-pulse'
                            : 'bg-[#58cc02] text-white border-b-4 border-[#46a302] hover:brightness-110 active:translate-y-1'
                        }`}
                      >
                        {/* Inner icon */}
                        {node.type === 'chest' ? (
                          <Award className="w-8 h-8 text-white" />
                        ) : node.type === 'tutor' ? (
                          <MessageSquare className="w-8 h-8 fill-white" />
                        ) : !node.isUnlocked ? (
                          <Lock className="w-7 h-7 text-[#8495a0]" />
                        ) : node.isCompleted ? (
                          <Check className="w-9 h-9 stroke-[3]" />
                        ) : (
                          <Star className="w-8 h-8 fill-white" />
                        )}

                        {/* Stars Indicator */}
                        {node.isUnlocked && node.stars > 0 && (
                          <div className="absolute -bottom-2 flex items-center gap-0.5 bg-[#1b2b33] px-1.5 py-0.5 rounded-full border border-[#37464f]">
                            {[1, 2, 3].map((starIdx) => (
                              <Star
                                key={starIdx}
                                className={`w-2.5 h-2.5 ${
                                  starIdx <= node.stars
                                    ? 'text-[#ffd900] fill-[#ffd900]'
                                    : 'text-[#37464f]'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </button>

                      {/* Node Label Tooltip on Hover */}
                      <div className="mt-2 text-center max-w-[160px]">
                        <span className="text-xs font-black text-white block">
                          {node.title}
                        </span>
                        <span className="text-[10px] font-bold text-[#8495a0]">
                          +{node.xp} XP • {node.type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guidebook Modal */}
      {selectedGuidebookUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#1b2b33] border-2 border-[#37464f] rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#37464f] mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#58cc02]" />
                <h3 className="text-lg font-black text-white">
                  Unit {selectedGuidebookUnit.unitNumber} Guidebook
                </h3>
              </div>
              <button
                onClick={() => setSelectedGuidebookUnit(null)}
                className="text-[#8495a0] hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h4 className="text-sm font-extrabold text-[#58cc02] uppercase mb-1">
              {selectedGuidebookUnit.guidebookTopic}
            </h4>
            <p className="text-xs text-[#8495a0] mb-4 font-semibold">
              Essential conversational phrases for {goal} practice. Click the audio icon to hear native pronunciation.
            </p>

            <div className="space-y-3 mb-6 max-h-[60vh] overflow-y-auto pr-1">
              {selectedGuidebookUnit.guidebookKeyPhrases.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-[#131f24] border border-[#37464f] flex items-center justify-between gap-3 group hover:border-[#58cc02]/60 transition"
                >
                  <div>
                    <div className="font-extrabold text-white text-sm">
                      {item.phrase}
                    </div>
                    <div className="text-xs font-semibold text-[#8495a0]">
                      {item.translation}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlayAudio(item.phrase)}
                    className="p-2 rounded-xl bg-[#1b2b33] text-[#58cc02] hover:bg-[#58cc02] hover:text-white transition"
                    title="Listen to native pronunciation"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setSelectedGuidebookUnit(null);
                onLaunchChatForScenario();
              }}
              className="w-full flex items-center justify-center gap-2 bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-sm uppercase py-3 rounded-2xl shadow-[0_4px_0_0_#398402] transition cursor-pointer"
            >
              <span>Practice in AI Conversation</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
