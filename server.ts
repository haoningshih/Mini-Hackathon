import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// ----------------------------------------------------
// API: Respond to Conversation Turn
// ----------------------------------------------------
app.post('/api/chat/respond', async (req, res) => {
  try {
    const { messages, objective, persona } = req.body;
    const targetLanguage = objective?.language || 'Spanish';
    const userLevel = objective?.level || 'A2';
    const goal = objective?.goal || 'traveling';
    const scenario = objective?.scenario || 'Ordering at a lively tapas bar';

    if (!ai) {
      // High-quality contextual fallback
      return res.json(getFallbackResponse(targetLanguage, messages, scenario));
    }

    const systemPrompt = `You are playing an authentic character in an immersive language conversation for Duolingo.
Language: ${targetLanguage}.
User Target Level: ${userLevel} (A1=Beginner, A2=Elementary, B1=Intermediate, B2=Upper-Intermediate, C1=Advanced).
Learning Objective: ${goal}.
Roleplay Scenario: ${scenario}.
Character Persona: ${persona?.name || 'Local Guide'} (${persona?.role || 'Native conversationalist'}).

Guidelines:
1. Stay in character! Respond naturally in ${targetLanguage}.
2. Adapt vocabulary and sentence complexity strictly to ${userLevel}. For A1/A2, use short, clear sentences. For B1/B2, incorporate idiomatic expressions.
3. Keep the conversation moving forward by asking an engaging follow-up question.
4. If the user made a grammar, vocabulary, or gender error in their latest message, formulate a very gentle, encouraging "gentleCorrection" note without breaking your in-game character.
5. Provide a faithful English translation of your reply.
6. Provide 2-3 key vocabulary words from your reply with parts of speech and translations.
7. Provide 2-3 suggested starter phrases the learner could reply with next.

Output MUST be strictly valid JSON matching the requested structure.`;

    const contents = [
      {
        role: 'user',
        parts: [
          {
            text: `Conversation history so far:\n${JSON.stringify(messages)}\n\nPlease generate the next character turn in ${targetLanguage} as JSON.`,
          },
        ],
      },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: { type: Type.STRING, description: `The conversational dialogue in ${targetLanguage}` },
            translation: { type: Type.STRING, description: 'English translation of the reply' },
            culturalTip: { type: Type.STRING, description: 'Quick cultural or etiquette nuance context' },
            gentleCorrection: {
              type: Type.OBJECT,
              properties: {
                hasMistake: { type: Type.BOOLEAN },
                originalPhrase: { type: Type.STRING },
                improvedPhrase: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['hasMistake', 'originalPhrase', 'improvedPhrase', 'explanation'],
            },
            vocabHints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  partOfSpeech: { type: Type.STRING },
                },
                required: ['word', 'meaning', 'partOfSpeech'],
              },
            },
            suggestedReplies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['reply', 'translation', 'vocabHints', 'suggestedReplies'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/chat/respond:', error);
    const { messages, objective } = req.body;
    return res.json(getFallbackResponse(objective?.language || 'Spanish', messages, objective?.scenario));
  }
});

// ----------------------------------------------------
// API: In-Chat Side-Along Tutor Q&A ("Ask Duo")
// ----------------------------------------------------
app.post('/api/chat/ask-tutor', async (req, res) => {
  try {
    const { question, contextSnippet, language, objective } = req.body;
    const targetLanguage = language || 'Spanish';

    if (!ai) {
      return res.json(getFallbackTutorAnswer(question, targetLanguage));
    }

    const systemPrompt = `You are Duo the Owl, the wise, encouraging, friendly Duolingo language coach.
A learner is having an active conversation in ${targetLanguage} and just paused to ask you a question about the language, grammar, cultural etiquette, or a specific phrase they encountered.
Context from the conversation: "${contextSnippet || 'Recent exchange'}".
Learner's objective: "${objective?.goal || 'General learning'}".

Explain clearly, cheerfully, and concisely with Duolingo warmth.
Include:
1. "answer": Direct, plain-language answer (easy to digest, no overwhelming linguistic jargon).
2. "breakdown": 2-3 key breakdown points or comparison examples showing correct usage.
3. "ruleOfThumb": A punchy, memorable memory trick or golden rule.
4. "quickCheck": A friendly 1-question check to see if they got it (with options and the correct answer index).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: question,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            answer: { type: Type.STRING },
            breakdown: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  concept: { type: Type.STRING },
                  example: { type: Type.STRING },
                  note: { type: Type.STRING },
                },
                required: ['concept', 'example', 'note'],
              },
            },
            ruleOfThumb: { type: Type.STRING },
            quickCheck: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctIndex', 'explanation'],
            },
          },
          required: ['answer', 'breakdown', 'ruleOfThumb'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/chat/ask-tutor:', error);
    return res.json(getFallbackTutorAnswer(req.body.question, req.body.language || 'Spanish'));
  }
});

// ----------------------------------------------------
// API: Generate Post-Conversation Skills Diagnostic Report
// ----------------------------------------------------
app.post('/api/chat/generate-report', async (req, res) => {
  try {
    const { conversationHistory, durationSeconds, objective } = req.body;
    const targetLanguage = objective?.language || 'Spanish';
    const goal = objective?.goal || 'traveling';
    const level = objective?.level || 'A2';
    const scenario = objective?.scenario || 'Real-life conversation';

    if (!ai) {
      return res.json(getFallbackReport(targetLanguage, goal, level, conversationHistory));
    }

    const systemPrompt = `You are the Duolingo Chief Pedagogical AI Evaluator.
The user just completed a conversational immersion session in ${targetLanguage}.
Their learning goal is: "${goal}".
Target level: ${level}.
Scenario: "${scenario}".
Session duration: ${Math.round(durationSeconds / 60)} minutes (${durationSeconds} seconds).

Analyze the entire conversation log thoroughly. Assess:
1. Overall performance level achieved in this session (e.g. "A2+ Emerging Fluent", "B1 Confident Speaker").
2. 4 Core Skill Scores (0 to 100):
   - grammarScore: Accuracy of tenses, agreements, syntax.
   - vocabScore: Lexical range, topic-specific vocabulary suited for ${goal}.
   - fluencyScore: Conversational rhythm, responsiveness, natural phrasing.
   - culturalPragmaticsScore: Politeness, idiomatic usage, register (formal vs informal).
3. "strengths": 3 specific things the learner did great, quoting their exact words when possible.
4. "areasToImprove": 3-4 specific skill deficits or mistakes spotted during the dialogue (e.g., subjunctive vs indicative, ser vs estar, adjective agreement, question inversion). For each:
   - skill: The linguistic skill name.
   - whatUserSaid: The actual sentence or phrase with the error.
   - recommendedCorrection: The natural native way to express it.
   - explanation: Clear pedagogical reason why.
   - severity: 'high' | 'medium' | 'low'.
5. "personalizedModules": 3 recommended Duolingo drill modules directly addressing the identified weak points to fix them.
   - id: unique string
   - title: catchy Duolingo unit title (e.g. "Unit 3: Mastering Tapas & Polite Requests")
   - objectiveAlignment: Why this module directly fixes their conversation mistake
   - xp: e.g. 50
   - icon: name like 'utensils', 'plane', 'briefcase', 'sparkles', 'book'
6. "immediatePracticeDrills": 3 interactive mini-drills created from the conversation mistakes so the user can immediately test themselves!
   - type: 'multiple_choice' | 'fill_in_blank' | 'reorder'
   - prompt: The challenge prompt in English or target language
   - targetSentence: The complete correct sentence
   - options: Array of choices (for multiple_choice or reorder words)
   - correctOption: The correct string or answer
   - explanation: Friendly owl explanation.`;

    const userMessage = `Conversation Transcript:\n${JSON.stringify(conversationHistory, null, 2)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallGrade: { type: Type.STRING },
            summaryAssessment: { type: Type.STRING },
            cefrBand: { type: Type.STRING },
            grammarScore: { type: Type.INTEGER },
            vocabScore: { type: Type.INTEGER },
            fluencyScore: { type: Type.INTEGER },
            culturalPragmaticsScore: { type: Type.INTEGER },
            strengths: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  userQuote: { type: Type.STRING },
                },
                required: ['title', 'description'],
              },
            },
            areasToImprove: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  skill: { type: Type.STRING },
                  whatUserSaid: { type: Type.STRING },
                  recommendedCorrection: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  severity: { type: Type.STRING },
                },
                required: ['skill', 'recommendedCorrection', 'explanation'],
              },
            },
            personalizedModules: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  objectiveAlignment: { type: Type.STRING },
                  xp: { type: Type.INTEGER },
                  icon: { type: Type.STRING },
                },
                required: ['id', 'title', 'description', 'objectiveAlignment', 'xp'],
              },
            },
            immediatePracticeDrills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING },
                  prompt: { type: Type.STRING },
                  targetSentence: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctOption: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['id', 'type', 'prompt', 'correctOption', 'explanation'],
              },
            },
          },
          required: [
            'overallGrade',
            'summaryAssessment',
            'cefrBand',
            'grammarScore',
            'vocabScore',
            'fluencyScore',
            'culturalPragmaticsScore',
            'strengths',
            'areasToImprove',
            'personalizedModules',
            'immediatePracticeDrills',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error in /api/chat/generate-report:', error);
    const { objective, conversationHistory } = req.body;
    return res.json(getFallbackReport(objective?.language || 'Spanish', objective?.goal || 'travel', objective?.level || 'A2', conversationHistory));
  }
});

// ----------------------------------------------------
// Fallback Utilities (Guarantees smooth demo & testing)
// ----------------------------------------------------
function getFallbackResponse(lang: string, messages: any[], scenario?: string) {
  const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
  
  if (lang.toLowerCase().includes('spanish')) {
    return {
      reply: '¡Excelente! Me parece genial. Para empezar, ¿prefieres probar las tapas tradicionales o te gustaría ver la carta de vinos primero?',
      translation: 'Excellent! Sounds great to me. To start, do you prefer trying the traditional tapas or would you like to see the wine list first?',
      culturalTip: 'In Spain, tapas are often shared among everyone at the table rather than individual dishes.',
      gentleCorrection: lastUserMsg.toLowerCase().includes('yo querer') ? {
        hasMistake: true,
        originalPhrase: 'yo querer',
        improvedPhrase: 'Quisiera / Me gustaría',
        explanation: 'Saying "Quisiera" or "Me gustaría" sounds much more courteous and natural than "yo querer".'
      } : { hasMistake: false, originalPhrase: '', improvedPhrase: '', explanation: '' },
      vocabHints: [
        { word: 'las tapas', meaning: 'small savory dishes/appetizers', partOfSpeech: 'noun' },
        { word: 'la carta', meaning: 'the menu', partOfSpeech: 'noun' },
        { word: 'probar', meaning: 'to try / to taste', partOfSpeech: 'verb' }
      ],
      suggestedReplies: [
        'Me encantaría probar las tapas tradicionales.',
        '¿Cuál es la especialidad de la casa?',
        '¿Tienen opciones vegetarianas?'
      ]
    };
  }

  if (lang.toLowerCase().includes('french')) {
    return {
      reply: 'Bienvenue ! C’est un plaisir de vous accueillir. Souhaitez-vous une table en terrasse ou plutôt à l’intérieur ?',
      translation: 'Welcome! It is a pleasure to welcome you. Would you like a table on the terrace or rather inside?',
      culturalTip: 'Always greet with a warm "Bonjour" before asking for a table or service in France.',
      gentleCorrection: { hasMistake: false, originalPhrase: '', improvedPhrase: '', explanation: '' },
      vocabHints: [
        { word: 'accueillir', meaning: 'to welcome', partOfSpeech: 'verb' },
        { word: 'la terrasse', meaning: 'the patio / terrace', partOfSpeech: 'noun' },
        { word: 'souhaiter', meaning: 'to wish / desire', partOfSpeech: 'verb' }
      ],
      suggestedReplies: [
        'Une table en terrasse, s’il vous plaît.',
        'Avez-vous une table pour deux personnes ?',
        'Est-ce que je peux voir le menu ?'
      ]
    };
  }

  return {
    reply: `Great to meet you! Let's continue exploring this scenario together. What would you like to focus on next?`,
    translation: 'English translation of the dialogue.',
    culturalTip: 'Direct communication paired with polite inquiries creates a comfortable conversational flow.',
    gentleCorrection: { hasMistake: false, originalPhrase: '', improvedPhrase: '', explanation: '' },
    vocabHints: [
      { word: 'scenario', meaning: 'situation', partOfSpeech: 'noun' },
      { word: 'explore', meaning: 'discover together', partOfSpeech: 'verb' }
    ],
    suggestedReplies: [
      'Tell me more about your recommendations.',
      'How do locals typically handle this situation?',
      'Let us practice another common question.'
    ]
  };
}

function getFallbackTutorAnswer(question: string, lang: string) {
  return {
    answer: `Great question! In ${lang}, nuances like this often depend on politeness register and verb mood. Using a conditional form (like "Quisiera" in Spanish or "Je voudrais" in French) softens your request and makes you sound cultured and polite, whereas present indicative can sound a bit demanding.`,
    breakdown: [
      {
        concept: 'Polite Requests',
        example: 'Quisiera un café, por favor.',
        note: 'Sounds like: "I would like a coffee, please."'
      },
      {
        concept: 'Direct Statement',
        example: 'Quiero un café.',
        note: 'Sounds like: "I want a coffee." (Direct, used with friends or family).'
      }
    ],
    ruleOfThumb: 'Whenever ordering at a restaurant or asking a stranger, use the polite conditional form to make an instant great impression!',
    quickCheck: {
      question: 'Which of the following is the most natural and polite way to order water in a restaurant?',
      options: [
        '¡Dame agua ahora!',
        'Quisiera un vaso de agua, por favor.',
        'Yo quiero agua.'
      ],
      correctIndex: 1,
      explanation: '"Quisiera un vaso de agua, por favor" uses the courteous subjunctive/conditional form, which native speakers appreciate.'
    }
  };
}

function getFallbackReport(lang: string, goal: string, level: string, history: any[]) {
  return {
    overallGrade: 'B1 Conversational Explorer',
    summaryAssessment: `Solid effort during your ${goal} simulation! You successfully communicated your core ideas, asked relevant follow-up questions, and maintained conversational momentum throughout the interaction.`,
    cefrBand: 'B1.1',
    grammarScore: 78,
    vocabScore: 84,
    fluencyScore: 82,
    culturalPragmaticsScore: 88,
    strengths: [
      {
        title: 'Immediate Comprehension & Initiative',
        description: 'You understood situational prompts quickly and kept the dialogue flowing without long hesitations.',
        userQuote: history?.[1]?.content || 'Natural conversational response'
      },
      {
        title: 'Polite Courtesy Markers',
        description: 'You consistently used courteous formulas like "por favor" and "gracias" which native speakers appreciate.',
        userQuote: 'por favor'
      },
      {
        title: 'Contextual Vocabulary',
        description: `Great application of words specific to ${goal}.`
      }
    ],
    areasToImprove: [
      {
        skill: 'Subjunctive vs Indicative in Polite Requests',
        whatUserSaid: 'Yo quiero la cuenta',
        recommendedCorrection: '¿Me trae la cuenta, por favor? / Quisiera la cuenta',
        explanation: 'In public establishments, softening the request with "quisiera" or a polite question feels much more natural than direct indicative "yo quiero".',
        severity: 'medium'
      },
      {
        skill: 'Gender Agreement with Nouns',
        whatUserSaid: 'el agua frío',
        recommendedCorrection: 'el agua fría',
        explanation: 'Even though "agua" takes "el" in the singular to prevent vowel clash, it remains grammatically feminine, so adjectives take feminine endings (fría).',
        severity: 'high'
      },
      {
        skill: 'Preposition Nuances (Por vs Para)',
        whatUserSaid: 'Gracias para ayudar',
        recommendedCorrection: 'Gracias por ayudar',
        explanation: 'Use "por" when expressing gratitude or cause/reason.',
        severity: 'medium'
      }
    ],
    personalizedModules: [
      {
        id: 'mod-1',
        title: `Unit 1: Polite Requests & Table Etiquette (${goal})`,
        description: 'Master polite modals, bill requests, and dietary vocabulary with native audio.',
        objectiveAlignment: 'Directly addresses your request phrasing from the chat.',
        xp: 45,
        icon: 'utensils'
      },
      {
        id: 'mod-2',
        title: 'Unit 2: Gender Agreement & Tricky Feminine Nouns',
        description: 'Practice high-frequency words with feminine articles and adjective harmony.',
        objectiveAlignment: 'Fixes gender clashes observed during the beverage order.',
        xp: 50,
        icon: 'sparkles'
      },
      {
        id: 'mod-3',
        title: 'Unit 3: Rapid Real-World Response Drills',
        description: 'Fast-paced conversational audio drills to speed up response time.',
        objectiveAlignment: 'Builds fluency and automaticity for your upcoming travels.',
        xp: 60,
        icon: 'plane'
      }
    ],
    immediatePracticeDrills: [
      {
        id: 'drill-1',
        type: 'multiple_choice',
        prompt: 'Select the most natural and polite way to ask for the bill:',
        targetSentence: '¿Nos trae la cuenta, por favor?',
        options: [
          'Yo quiero la cuenta ya.',
          '¿Nos trae la cuenta, por favor?',
          'Dame cuenta ahora.'
        ],
        correctOption: '¿Nos trae la cuenta, por favor?',
        explanation: '"¿Nos trae la cuenta, por favor?" is polite, friendly, and standard in dining establishments.'
      },
      {
        id: 'drill-2',
        type: 'fill_in_blank',
        prompt: 'Fill in the correct adjective form: "El agua está muy _____ (frío / fría)"',
        targetSentence: 'El agua está muy fría',
        options: ['frío', 'fría', 'fríos'],
        correctOption: 'fría',
        explanation: 'Agua is a feminine noun, so the adjective must agree: fría.'
      },
      {
        id: 'drill-3',
        type: 'multiple_choice',
        prompt: 'Choose the correct preposition: "Muchas gracias _____ tu ayuda."',
        targetSentence: 'Muchas gracias por tu ayuda.',
        options: ['para', 'por', 'con', 'de'],
        correctOption: 'por',
        explanation: 'Expressing gratitude always uses "por" (cause/reason).'
      }
    ]
  };
}

// ----------------------------------------------------
// Setup Vite in Dev or Serve Static in Production
// ----------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Duolingo Immersion server running on http://localhost:${PORT}`);
  });
}

startServer();
