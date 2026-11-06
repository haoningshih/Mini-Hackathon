import React, { useState } from 'react';
import { CurriculumLessonNode, CurriculumUnit, TargetLanguage } from '../types/duo';
import { DuoMascot } from './DuoMascot';
import { X, Check, ArrowRight, Volume2, Sparkles, Heart } from 'lucide-react';
import { audioService } from '../utils/audio';

interface InteractiveDrillModalProps {
  lesson: CurriculumLessonNode | null;
  unit: CurriculumUnit | null;
  targetLanguage: TargetLanguage;
  onClose: () => void;
  onComplete: (earnedXp: number) => void;
  soundEnabled: boolean;
}

export const InteractiveDrillModal: React.FC<InteractiveDrillModalProps> = ({
  lesson,
  unit,
  targetLanguage,
  onClose,
  onComplete,
  soundEnabled,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [heartsLeft, setHeartsLeft] = useState<number>(3);
  const [earnedXpTotal, setEarnedXpTotal] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  if (!lesson || !unit) return null;

  // Tailored question bank based on unit topic
  const questions = [
    {
      prompt: `Select the most natural polite request in ${targetLanguage}:`,
      targetSentence:
        targetLanguage === 'French'
          ? 'Je voudrais une table en terrasse, s’il vous plaît.'
          : 'Quisiera una mesa cerca de la ventana, por favor.',
      options:
        targetLanguage === 'French'
          ? [
              'Je veux table maintenant.',
              'Je voudrais une table en terrasse, s’il vous plaît.',
              'Donne moi la nourriture.',
            ]
          : [
              'Yo quiero mesa ahora.',
              'Quisiera una mesa cerca de la ventana, por favor.',
              'Dame comida rápido.',
            ],
      correct:
        targetLanguage === 'French'
          ? 'Je voudrais une table en terrasse, s’il vous plaît.'
          : 'Quisiera una mesa cerca de la ventana, por favor.',
      tip: 'Using the polite conditional form softens your request and makes an excellent impression.',
    },
    {
      prompt: `Choose the correct grammatical agreement:`,
      targetSentence:
        targetLanguage === 'French'
          ? 'L’addition est correcte.'
          : 'El agua está muy fría.',
      options:
        targetLanguage === 'French'
          ? ['L’addition est correct', 'L’addition est correcte', 'L’addition sont corrects']
          : ['El agua está muy frío', 'El agua está muy fría', 'El agua están fríos'],
      correct:
        targetLanguage === 'French' ? 'L’addition est correcte' : 'El agua está muy fría',
      tip: 'Pay attention to feminine noun agreement with adjectives.',
    },
    {
      prompt: `How do you ask for the bill at the end of the meal?`,
      targetSentence:
        targetLanguage === 'French'
          ? 'L’addition, s’il vous plaît.'
          : '¿Nos trae la cuenta, por favor?',
      options:
        targetLanguage === 'French'
          ? ['Combien d’argent ?', 'L’addition, s’il vous plaît.', 'Je pars maintenant.']
          : ['¿Nos trae la cuenta, por favor?', 'Cobrar rápido.', 'Quiero pagar ya.'],
      correct:
        targetLanguage === 'French'
          ? 'L’addition, s’il vous plaît.'
          : '¿Nos trae la cuenta, por favor?',
      tip: 'Always maintain courteous table phrasing.',
    },
  ];

  const currentQ = questions[currentQuestionIndex];

  const handlePlayAudio = (text: string) => {
    audioService.speak(text, targetLanguage === 'French' ? 'fr-FR' : 'es-ES');
  };

  const handleCheck = () => {
    if (!selectedOption || isAnswered) return;
    setIsAnswered(true);

    const isCorrect = selectedOption === currentQ.correct;
    if (isCorrect) {
      if (soundEnabled) audioService.playSuccess();
      setEarnedXpTotal((prev) => prev + 15);
    } else {
      if (soundEnabled) audioService.playError();
      setHeartsLeft((prev) => Math.max(0, prev - 1));
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsFinished(true);
      if (soundEnabled) audioService.playFanfare();
      onComplete(lesson.xp);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-[#1b2b33] border-2 border-[#37464f] rounded-3xl p-6 shadow-2xl relative flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#37464f] mb-4">
          <button
            onClick={onClose}
            className="text-[#8495a0] hover:text-white p-1 rounded-xl hover:bg-[#20343f]"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Progress bar */}
          <div className="flex-1 mx-4 bg-[#131f24] h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#58cc02] transition-all duration-300"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            />
          </div>

          {/* Hearts */}
          <div className="flex items-center gap-1 text-[#ff4b4b] font-black text-sm">
            <Heart className="w-4 h-4 fill-[#ff4b4b]" />
            <span>{heartsLeft}</span>
          </div>
        </div>

        {/* Content */}
        {!isFinished ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <DuoMascot mood="talking" size="sm" />
              <div>
                <span className="text-[10px] font-black uppercase text-[#58cc02] block">
                  {unit.title} • {lesson.title}
                </span>
                <h3 className="font-black text-white text-base">
                  {currentQ.prompt}
                </h3>
              </div>
            </div>

            {/* Target sentence display */}
            <div className="p-3.5 rounded-2xl bg-[#131f24] border border-[#37464f] mb-4 flex items-center justify-between">
              <span className="font-extrabold text-white text-sm">
                "{currentQ.targetSentence}"
              </span>
              <button
                onClick={() => handlePlayAudio(currentQ.targetSentence)}
                className="p-1.5 rounded-lg text-[#58cc02] hover:bg-[#58cc02]/20 transition"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            {/* Options */}
            <div className="space-y-2.5 mb-6">
              {currentQ.options.map((opt, oIdx) => {
                const isSelected = selectedOption === opt;
                let optStyle =
                  'bg-[#131f24] border-[#37464f] text-white hover:border-[#58cc02]';

                if (isAnswered) {
                  if (opt === currentQ.correct) {
                    optStyle = 'bg-[#58cc02]/20 border-[#58cc02] text-[#58cc02] font-black';
                  } else if (isSelected) {
                    optStyle = 'bg-[#ff4b4b]/20 border-[#ff4b4b] text-[#ff4b4b]';
                  }
                } else if (isSelected) {
                  optStyle = 'bg-[#58cc02]/20 border-[#58cc02] text-white';
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => !isAnswered && setSelectedOption(opt)}
                    className={`w-full text-left p-3.5 rounded-2xl border-2 text-sm font-bold transition flex items-center justify-between cursor-pointer ${optStyle}`}
                  >
                    <span>{opt}</span>
                    {isAnswered && opt === currentQ.correct && (
                      <Check className="w-5 h-5 text-[#58cc02] stroke-[3]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Feedback footer */}
            {isAnswered && (
              <div
                className={`p-3.5 rounded-2xl mb-4 text-xs font-semibold ${
                  selectedOption === currentQ.correct
                    ? 'bg-[#58cc02]/15 text-[#58cc02] border border-[#58cc02]/40'
                    : 'bg-[#ff4b4b]/15 text-[#ff4b4b] border border-[#ff4b4b]/40'
                }`}
              >
                {selectedOption === currentQ.correct ? (
                  <div>
                    <div className="font-black text-sm uppercase mb-0.5">
                      Nicely done!
                    </div>
                    <div>{currentQ.tip}</div>
                  </div>
                ) : (
                  <div>
                    <div className="font-black text-sm uppercase mb-0.5">
                      Correct solution:
                    </div>
                    <div className="font-bold underline">{currentQ.correct}</div>
                    <div className="mt-1 text-[#a0b1bc]">{currentQ.tip}</div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              {!isAnswered ? (
                <button
                  onClick={handleCheck}
                  disabled={!selectedOption}
                  className="bg-[#58cc02] hover:bg-[#46a302] disabled:opacity-40 text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-[0_4px_0_0_#398402] transition cursor-pointer"
                >
                  Check
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="bg-[#1cb0f6] hover:bg-[#0482c8] text-white font-black text-xs uppercase px-6 py-3 rounded-2xl shadow-[0_4px_0_0_#0369a1] transition cursor-pointer flex items-center gap-2"
                >
                  <span>{currentQuestionIndex < questions.length - 1 ? 'Continue' : 'Finish Lesson'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <DuoMascot mood="cheering" size="xl" className="animate-bounce mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">
              Lesson Complete!
            </h2>
            <p className="text-[#8495a0] text-xs font-semibold mb-6">
              You reinforced critical phrases and addressed your conversational target.
            </p>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="bg-[#131f24] px-4 py-3 rounded-2xl border border-[#37464f]">
                <div className="text-[10px] font-black uppercase text-[#ffd900]">
                  XP Earned
                </div>
                <div className="text-xl font-black text-white">+{lesson.xp} XP</div>
              </div>
              <div className="bg-[#131f24] px-4 py-3 rounded-2xl border border-[#37464f]">
                <div className="text-[10px] font-black uppercase text-[#58cc02]">
                  Accuracy
                </div>
                <div className="text-xl font-black text-white">100%</div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="bg-[#58cc02] hover:bg-[#46a302] text-white font-black text-sm uppercase px-8 py-3.5 rounded-2xl shadow-[0_4px_0_0_#398402] transition cursor-pointer"
            >
              Back to Course Path
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
