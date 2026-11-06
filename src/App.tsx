/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DuoHeader } from './components/DuoHeader';
import { QuestionnaireModal } from './components/QuestionnaireModal';
import { CurriculumView } from './components/CurriculumView';
import { ConversationStudio } from './components/ConversationStudio';
import { AskTutorDrawer } from './components/AskTutorDrawer';
import { SkillsReportView } from './components/SkillsReportView';
import { InteractiveDrillModal } from './components/InteractiveDrillModal';
import {
  UserObjectiveState,
  CurriculumUnit,
  CurriculumLessonNode,
  ChatMessage,
  SkillsReport,
} from './types/duo';
import { generateCurriculumForObjective } from './data/curriculumData';
import { audioService } from './utils/audio';
import { Sparkles, Bookmark, BookOpen, RotateCcw } from 'lucide-react';

export default function App() {
  // User Objective State
  const [objectiveState, setObjectiveState] = useState<UserObjectiveState>({
    targetLanguage: 'Spanish',
    nativeLanguage: 'English',
    goal: 'travel',
    level: 'A2',
    selectedScenarioId: 'travel-tapas',
    targetDurationMinutes: 10,
    hasCompletedQuestionnaire: false,
  });

  // App Navigation & Modals
  const [currentTab, setCurrentTab] = useState<'path' | 'chat' | 'report' | 'drills'>('path');
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState<boolean>(true);
  const [isTutorDrawerOpen, setIsTutorDrawerOpen] = useState<boolean>(false);
  const [tutorContextSnippet, setTutorContextSnippet] = useState<string>('');
  const [activeLessonModal, setActiveLessonModal] = useState<{
    lesson: CurriculumLessonNode;
    unit: CurriculumUnit;
  } | null>(null);

  // Gamification metrics
  const [streak, setStreak] = useState<number>(7);
  const [gems, setGems] = useState<number>(450);
  const [hearts, setHearts] = useState<number>(5);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Curriculum State
  const [units, setUnits] = useState<CurriculumUnit[]>(() =>
    generateCurriculumForObjective('Spanish', 'travel')
  );

  // Skills Report State
  const [latestReport, setLatestReport] = useState<SkillsReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState<boolean>(false);

  // Saved phrasebook / tutor rules
  const [phrasebook, setPhrasebook] = useState<
    { question: string; answer: string; timestamp: number }[]
  >([
    {
      question: 'Polite Requests vs Direct Wants',
      answer:
        'Use "Quisiera..." or "¿Me trae..., por favor?" when ordering in restaurants or asking assistance from strangers. Reserve "Quiero" for friends or family.',
      timestamp: Date.now() - 3600000,
    },
  ]);

  // Handle Questionnaire Completion
  const handleQuestionnaireComplete = (
    newState: UserObjectiveState,
    targetAction: 'path' | 'chat' = 'chat'
  ) => {
    setObjectiveState(newState);
    setIsQuestionnaireOpen(false);

    // Generate new curriculum for chosen goal
    const newUnits = generateCurriculumForObjective(
      newState.targetLanguage,
      newState.goal,
      latestReport?.personalizedModules.map((m) => m.id) || []
    );
    setUnits(newUnits);

    if (soundEnabled) audioService.playSuccess();
    setCurrentTab(targetAction);
  };

  // Open Tutor Q&A Drawer with context snippet
  const handleOpenTutor = (snippet?: string) => {
    setTutorContextSnippet(snippet || '');
    setIsTutorDrawerOpen(true);
  };

  // Finish Conversation & Generate Comprehensive Skills Report
  const handleFinishAndGenerateReport = async (
    history: ChatMessage[],
    durationSeconds: number
  ) => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/chat/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: history,
          durationSeconds: durationSeconds || 600,
          objective: {
            language: objectiveState.targetLanguage,
            goal: objectiveState.goal,
            level: objectiveState.level,
            scenario: objectiveState.selectedScenarioId,
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to generate report');
      const data: SkillsReport = await res.json();

      setLatestReport(data);

      // Award XP and Gems for completing conversation
      setStreak((prev) => prev + 1);
      setGems((prev) => prev + 30);

      // Flag recommended modules in curriculum units
      const recommendedIds = data.personalizedModules.map((m) => m.id);
      setUnits((prevUnits) =>
        prevUnits.map((u) => ({
          ...u,
          nodes: u.nodes.map((n) => ({
            ...n,
            isRecommendedByAI:
              recommendedIds.some((rId) => n.id.includes(rId) || rId.includes(n.id)) ||
              n.isRecommendedByAI,
          })),
        }))
      );

      if (soundEnabled) audioService.playFanfare();
      setCurrentTab('report');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Navigate to module from report
  const handleNavigateToModule = (moduleId: string) => {
    setCurrentTab('path');
    if (soundEnabled) audioService.playSuccess();
  };

  // Complete a drill
  const handleDrillComplete = (drillId: string, earnedXp: number) => {
    setGems((prev) => prev + 10);
  };

  // Complete lesson node from path
  const handleLessonComplete = (earnedXp: number) => {
    setGems((prev) => prev + earnedXp);
    if (activeLessonModal) {
      setUnits((prev) =>
        prev.map((u) => ({
          ...u,
          nodes: u.nodes.map((n) =>
            n.id === activeLessonModal.lesson.id
              ? { ...n, isCompleted: true, stars: 3 }
              : n
          ),
        }))
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#131f24] text-white flex flex-col font-['Nunito',sans-serif]">
      {/* Top Navigation Header */}
      <DuoHeader
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        targetLanguage={objectiveState.targetLanguage}
        goal={objectiveState.goal}
        level={objectiveState.level}
        streak={streak}
        gems={gems}
        hearts={hearts}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
        onOpenQuestionnaire={() => setIsQuestionnaireOpen(true)}
        hasActiveReport={!!latestReport}
      />

      {/* Main View Area */}
      <main className={`flex-1 flex flex-col ${currentTab === 'chat' ? 'pb-2 overflow-hidden' : 'pb-16'}`}>
        {/* TAB 1: Course Path */}
        {currentTab === 'path' && (
          <CurriculumView
            units={units}
            targetLanguage={objectiveState.targetLanguage}
            goal={objectiveState.goal}
            level={objectiveState.level}
            onStartLesson={(lesson, unit) => setActiveLessonModal({ lesson, unit })}
            onLaunchChatForScenario={() => setCurrentTab('chat')}
            onViewReport={() => setCurrentTab('report')}
            hasActiveReport={!!latestReport}
            soundEnabled={soundEnabled}
          />
        )}

        {/* TAB 2: AI Immersion Chat */}
        {currentTab === 'chat' && (
          <ConversationStudio
            key={`${objectiveState.targetLanguage}-${objectiveState.selectedScenarioId}`}
            objectiveState={objectiveState}
            onFinishAndGenerateReport={handleFinishAndGenerateReport}
            onOpenTutor={handleOpenTutor}
            isGeneratingReport={isGeneratingReport}
            soundEnabled={soundEnabled}
          />
        )}

        {/* TAB 3: Diagnostic Skills Report */}
        {currentTab === 'report' && (
          <>
            {latestReport ? (
              <SkillsReportView
                report={latestReport}
                onNavigateToModule={handleNavigateToModule}
                onStartNewConversation={() => setCurrentTab('chat')}
                onDrillComplete={handleDrillComplete}
                soundEnabled={soundEnabled}
              />
            ) : (
              <div className="max-w-md mx-auto py-20 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-[#1b2b33] border-2 border-[#37464f] flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-[#ffd900]" />
                </div>
                <h2 className="text-xl font-black text-white mb-2">
                  No Conversation Report Yet
                </h2>
                <p className="text-xs text-[#8495a0] font-semibold mb-6">
                  Complete your first 10-minute AI conversation in {objectiveState.targetLanguage} to generate an in-depth CEFR competency assessment and personalized remediation modules!
                </p>
                <button
                  onClick={() => setCurrentTab('chat')}
                  className="bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-[0_4px_0_0_#398402] transition cursor-pointer"
                >
                  Start Immersion Chat
                </button>
              </div>
            )}
          </>
        )}

        {/* TAB 4: Remediation Drills & Phrasebook */}
        {currentTab === 'drills' && (
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <div className="bg-[#1b2b33] border-2 border-[#37464f] rounded-3xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <Sparkles className="w-6 h-6 text-[#ffd900] fill-[#ffd900]" />
                <h1 className="text-2xl font-black text-white">
                  Remediation & Pocket Guide
                </h1>
              </div>
              <p className="text-xs text-[#8495a0] font-semibold">
                Quick exercises and rules of thumb captured from your AI conversations and questions to Duo.
              </p>
            </div>

            {/* Saved rules and tutor explanations */}
            <div>
              <h2 className="text-sm font-black uppercase text-[#8495a0] mb-3 flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#58cc02]" />
                Saved Duo Explanations ({phrasebook.length})
              </h2>

              <div className="space-y-3">
                {phrasebook.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-[#1b2b33] border-2 border-[#37464f] rounded-2xl p-4 shadow-md"
                  >
                    <div className="font-extrabold text-white text-sm mb-1.5 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#1cb0f6]" />
                      <span>{item.question}</span>
                    </div>
                    <p className="text-xs text-[#a0b1bc] font-semibold leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Practice launcher */}
            <div className="bg-[#1b2b33] border-2 border-[#ff9600]/40 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-white text-base mb-1">
                  Ready for a live conversation?
                </h3>
                <p className="text-xs text-[#8495a0] font-semibold">
                  Put what you learned into practice in a real dialogue simulation.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab('chat')}
                className="bg-[#ff9600] hover:bg-[#e57c00] text-white font-black text-xs uppercase px-5 py-3 rounded-2xl shadow-[0_4px_0_0_#d87c00] transition cursor-pointer whitespace-nowrap"
              >
                Jump into Chat
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Initial / Reconfigurable Objective Questionnaire Modal */}
      <QuestionnaireModal
        isOpen={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        currentState={objectiveState}
        onComplete={handleQuestionnaireComplete}
        soundEnabled={soundEnabled}
      />

      {/* In-Chat Ask Duo Tutor Side-Drawer */}
      <AskTutorDrawer
        isOpen={isTutorDrawerOpen}
        onClose={() => setIsTutorDrawerOpen(false)}
        targetLanguage={objectiveState.targetLanguage}
        lastConversationSnippet={tutorContextSnippet}
        onSaveToPhrasebook={(item) =>
          setPhrasebook((prev) => [{ ...item, timestamp: Date.now() }, ...prev])
        }
        soundEnabled={soundEnabled}
      />

      {/* Interactive Curriculum Lesson Drill Modal */}
      {activeLessonModal && (
        <InteractiveDrillModal
          lesson={activeLessonModal.lesson}
          unit={activeLessonModal.unit}
          targetLanguage={objectiveState.targetLanguage}
          onClose={() => setActiveLessonModal(null)}
          onComplete={(xp) => {
            handleLessonComplete(xp);
            setActiveLessonModal(null);
          }}
          soundEnabled={soundEnabled}
        />
      )}
    </div>
  );
}
