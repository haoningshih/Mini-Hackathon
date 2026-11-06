import React, { useState } from 'react';
import { DuoMascot } from './DuoMascot';
import { TutorExplanation, TargetLanguage } from '../types/duo';
import {
  HelpCircle,
  Sparkles,
  Send,
  X,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Bookmark,
  ChevronRight,
} from 'lucide-react';
import { audioService } from '../utils/audio';

interface AskTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  targetLanguage: TargetLanguage;
  lastConversationSnippet: string;
  onSaveToPhrasebook?: (item: { question: string; answer: string }) => void;
  soundEnabled: boolean;
}

export const AskTutorDrawer: React.FC<AskTutorDrawerProps> = ({
  isOpen,
  onClose,
  targetLanguage,
  lastConversationSnippet,
  onSaveToPhrasebook,
  soundEnabled,
}) => {
  const [question, setQuestion] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [explanation, setExplanation] = useState<TutorExplanation | null>(null);
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [hasSaved, setHasSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const quickQuestions = [
    `Why did you use that verb form in the last sentence?`,
    `Is there a more polite or formal way to phrase this in ${targetLanguage}?`,
    `Explain the difference between formal and informal address here.`,
    `What is the literal vs idiomatic meaning of that phrase?`,
  ];

  const handleAsk = async (queryText?: string) => {
    const q = queryText || question;
    if (!q.trim() || loading) return;

    setLoading(true);
    setExplanation(null);
    setSelectedQuizAnswer(null);
    setHasSaved(false);

    try {
      const res = await fetch('/api/chat/ask-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          contextSnippet: lastConversationSnippet,
          language: targetLanguage,
        }),
      });

      if (!res.ok) throw new Error('Failed to ask tutor');
      const data: TutorExplanation = await res.json();
      setExplanation(data);
      if (soundEnabled) audioService.playSuccess();
    } catch (err) {
      console.error(err);
      setExplanation({
        answer: `In ${targetLanguage}, this nuance depends on cultural context and politeness. Using conditional structures softens your requests, making them pleasant and respectful.`,
        breakdown: [
          {
            concept: 'Polite Requests',
            example: 'Quisiera / Je voudrais...',
            note: 'Standard courteous formula when ordering or asking for assistance.',
          },
        ],
        ruleOfThumb: 'When talking to service staff or strangers, lean on courteous conditionals!',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuiz = (index: number) => {
    setSelectedQuizAnswer(index);
    if (explanation?.quickCheck) {
      if (index === explanation.quickCheck.correctIndex) {
        if (soundEnabled) audioService.playSuccess();
      } else {
        if (soundEnabled) audioService.playError();
      }
    }
  };

  const handleSave = () => {
    if (!explanation) return;
    if (onSaveToPhrasebook) {
      onSaveToPhrasebook({
        question: question || 'Language Grammar Breakdown',
        answer: explanation.answer,
      });
    }
    setHasSaved(true);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#1b2b33] border-l-2 border-[#37464f] shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 bg-[#131f24] border-b border-[#37464f] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DuoMascot mood="coaching" size="sm" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-['Fredoka',sans-serif] font-bold text-lg text-white">
                Duo Language Coach
              </span>
              <span className="bg-[#1cb0f6]/20 text-[#1cb0f6] text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                Live Q&A
              </span>
            </div>
            <p className="text-[11px] text-[#8495a0] font-semibold">
              Ask anything about grammar, phrasing, or culture
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#8495a0] hover:text-white p-1.5 rounded-xl hover:bg-[#20343f] transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Context banner */}
        {lastConversationSnippet && (
          <div className="bg-[#131f24] border border-[#37464f] rounded-2xl p-3">
            <div className="text-[10px] font-black uppercase text-[#8495a0] mb-1 flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-[#58cc02]" />
              Recent Dialogue Context
            </div>
            <p className="text-xs text-[#a0b1bc] italic line-clamp-2">
              "{lastConversationSnippet}"
            </p>
          </div>
        )}

        {/* Quick Suggestion Chips */}
        <div>
          <div className="text-[11px] font-black uppercase text-[#8495a0] mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#ffd900]" />
            Common In-Conversation Questions
          </div>
          <div className="space-y-1.5">
            {quickQuestions.map((qText, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuestion(qText);
                  handleAsk(qText);
                }}
                disabled={loading}
                className="w-full text-left p-2.5 rounded-xl bg-[#131f24] hover:bg-[#20343f] border border-[#37464f] hover:border-[#1cb0f6]/60 text-xs font-semibold text-white transition flex items-center justify-between group cursor-pointer"
              >
                <span>{qText}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#8495a0] group-hover:text-[#1cb0f6] transition shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="py-8 flex flex-col items-center justify-center text-center">
            <DuoMascot mood="thinking" size="md" className="animate-spin mb-3" />
            <p className="text-xs font-bold text-[#8495a0]">
              Duo is analyzing grammar rules and nuance...
            </p>
          </div>
        )}

        {/* Explanation Result Card */}
        {explanation && !loading && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Answer banner */}
            <div className="bg-[#131f24] border-2 border-[#1cb0f6] rounded-2xl p-4 shadow-lg">
              <div className="flex items-center gap-2 text-xs font-black text-[#1cb0f6] uppercase mb-2">
                <Lightbulb className="w-4 h-4 fill-[#1cb0f6]" />
                Duo's Explanation
              </div>
              <p className="text-sm font-semibold text-white leading-relaxed mb-3">
                {explanation.answer}
              </p>

              {/* Breakdown Points */}
              {explanation.breakdown && explanation.breakdown.length > 0 && (
                <div className="space-y-2 mt-3 pt-3 border-t border-[#37464f]">
                  <div className="text-[11px] font-black uppercase text-[#8495a0]">
                    Key Comparison & Patterns:
                  </div>
                  {explanation.breakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-[#1b2b33] border border-[#37464f] text-xs"
                    >
                      <div className="font-extrabold text-[#58cc02] mb-0.5">
                        {item.concept}
                      </div>
                      <div className="font-mono text-white text-xs mb-1 bg-black/30 p-1.5 rounded-lg">
                        {item.example}
                      </div>
                      <div className="text-[#8495a0] text-[11px] font-semibold">
                        {item.note}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rule of Thumb Mnemonic */}
              {explanation.ruleOfThumb && (
                <div className="mt-4 p-3 rounded-xl bg-[#ffd900]/15 border border-[#ffd900]/40 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#ffd900] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-black text-[#ffd900] uppercase">
                      Golden Rule of Thumb
                    </div>
                    <div className="text-xs font-bold text-white mt-0.5">
                      {explanation.ruleOfThumb}
                    </div>
                  </div>
                </div>
              )}

              {/* Bookmark Save */}
              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={hasSaved}
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                    hasSaved
                      ? 'bg-[#58cc02]/20 border-[#58cc02] text-[#58cc02]'
                      : 'bg-[#1b2b33] border-[#37464f] text-[#8495a0] hover:text-white'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{hasSaved ? 'Saved to Pocket Guide!' : 'Save Explanation'}</span>
                </button>
              </div>
            </div>

            {/* Micro-Quiz Check */}
            {explanation.quickCheck && (
              <div className="bg-[#131f24] border-2 border-[#58cc02]/60 rounded-2xl p-4 shadow-md">
                <div className="text-xs font-black uppercase text-[#58cc02] mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Quick Check: Did You Get It?
                </div>
                <p className="text-xs font-bold text-white mb-3">
                  {explanation.quickCheck.question}
                </p>

                <div className="space-y-2">
                  {explanation.quickCheck.options.map((option, idx) => {
                    const isSelected = selectedQuizAnswer === idx;
                    const isCorrect = idx === explanation.quickCheck?.correctIndex;
                    let style = 'bg-[#1b2b33] border-[#37464f] text-white hover:border-[#58cc02]';

                    if (selectedQuizAnswer !== null) {
                      if (isCorrect) {
                        style = 'bg-[#58cc02]/20 border-[#58cc02] text-[#58cc02] font-black';
                      } else if (isSelected) {
                        style = 'bg-[#ff4b4b]/20 border-[#ff4b4b] text-[#ff4b4b]';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelectQuiz(idx)}
                        disabled={selectedQuizAnswer !== null}
                        className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer flex items-center justify-between ${style}`}
                      >
                        <span>{option}</span>
                        {selectedQuizAnswer !== null && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-[#58cc02]" />
                        )}
                        {selectedQuizAnswer !== null && isSelected && !isCorrect && (
                          <AlertCircle className="w-4 h-4 text-[#ff4b4b]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {selectedQuizAnswer !== null && (
                  <p className="mt-3 text-[11px] text-[#a0b1bc] font-semibold bg-[#1b2b33] p-2.5 rounded-xl border border-[#37464f]">
                    💡 {explanation.quickCheck.explanation}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Question Input */}
      <div className="p-4 bg-[#131f24] border-t border-[#37464f]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask Duo anything in English or ${targetLanguage}...`}
            className="flex-1 bg-[#1b2b33] border-2 border-[#37464f] focus:border-[#1cb0f6] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#8495a0] outline-none transition"
          />
          <button
            type="submit"
            disabled={!question.trim() || loading}
            className="bg-[#1cb0f6] hover:bg-[#0482c8] disabled:opacity-40 text-white font-black p-2.5 rounded-xl transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
