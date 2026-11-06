export type TargetLanguage = 'Spanish' | 'French' | 'German' | 'Italian' | 'Japanese' | 'Portuguese' | 'Mandarin';

export type ProficiencyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export type LearningGoal = 'travel' | 'work' | 'relocation' | 'culture' | 'exam' | 'social';

export interface LanguageOption {
  code: string;
  name: TargetLanguage;
  nativeName: string;
  flag: string;
  locale: string;
  popularGreeting: string;
  accentColor: string;
}

export interface GoalOption {
  id: LearningGoal;
  title: string;
  subtitle: string;
  icon: string;
  description: string;
  color: string;
  scenarios: {
    id: string;
    title: string;
    description: string;
    personaName: string;
    personaRole: string;
    initialGreeting: string;
  }[];
}

export interface UserObjectiveState {
  targetLanguage: TargetLanguage;
  nativeLanguage: string;
  goal: LearningGoal;
  level: ProficiencyLevel;
  selectedScenarioId: string;
  customNotes?: string;
  targetDurationMinutes: number; // 5, 10, 15, 20
  hasCompletedQuestionnaire: boolean;
}

export interface VocabHint {
  word: string;
  meaning: string;
  partOfSpeech: string;
}

export interface GentleCorrection {
  hasMistake: boolean;
  originalPhrase: string;
  improvedPhrase: string;
  explanation: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  translation?: string;
  timestamp: number;
  vocabHints?: VocabHint[];
  culturalTip?: string;
  gentleCorrection?: GentleCorrection;
  suggestedReplies?: string[];
  isTutorExplanation?: boolean;
}

export interface TutorExplanation {
  answer: string;
  breakdown: {
    concept: string;
    example: string;
    note: string;
  }[];
  ruleOfThumb: string;
  quickCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export interface AreaToImprove {
  skill: string;
  whatUserSaid: string;
  recommendedCorrection: string;
  explanation: string;
  severity: 'high' | 'medium' | 'low';
}

export interface StrengthItem {
  title: string;
  description: string;
  userQuote?: string;
}

export interface RecommendedModule {
  id: string;
  title: string;
  description: string;
  objectiveAlignment: string;
  xp: number;
  icon: string;
  completed?: boolean;
}

export interface PracticeDrill {
  id: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'reorder';
  prompt: string;
  targetSentence: string;
  options: string[];
  correctOption: string;
  explanation: string;
}

export interface SkillsReport {
  id: string;
  date: string;
  language: TargetLanguage;
  goal: LearningGoal;
  level: ProficiencyLevel;
  scenarioTitle: string;
  durationSeconds: number;
  overallGrade: string;
  summaryAssessment: string;
  cefrBand: string;
  grammarScore: number;
  vocabScore: number;
  fluencyScore: number;
  culturalPragmaticsScore: number;
  strengths: StrengthItem[];
  areasToImprove: AreaToImprove[];
  personalizedModules: RecommendedModule[];
  immediatePracticeDrills: PracticeDrill[];
}

export interface CurriculumLessonNode {
  id: string;
  title: string;
  type: 'lesson' | 'story' | 'chest' | 'checkpoint' | 'tutor';
  stars: number; // 0 to 3
  isCompleted: boolean;
  isUnlocked: boolean;
  isRecommendedByAI?: boolean;
  xp: number;
  description: string;
}

export interface CurriculumUnit {
  id: string;
  unitNumber: number;
  title: string;
  description: string;
  colorScheme: 'green' | 'blue' | 'purple' | 'amber' | 'rose';
  guidebookTopic: string;
  guidebookKeyPhrases: { phrase: string; translation: string }[];
  nodes: CurriculumLessonNode[];
}
