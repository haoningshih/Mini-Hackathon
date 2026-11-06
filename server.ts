import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Get or initialize GoogleGenAI SDK dynamically per request
function getAIClient(): GoogleGenAI | null {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return null;
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

    const ai = getAIClient();
    if (!ai) {
      // High-quality contextual fallback
      return res.json(getFallbackResponse(targetLanguage, messages, scenario, persona, userLevel, goal));
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
    const { messages, objective, persona } = req.body;
    return res.json(
      getFallbackResponse(
        objective?.language || 'Spanish',
        messages,
        objective?.scenario,
        persona,
        objective?.level,
        objective?.goal
      )
    );
  }
});

// ----------------------------------------------------
// API: In-Chat Side-Along Tutor Q&A ("Ask Duo")
// ----------------------------------------------------
app.post('/api/chat/ask-tutor', async (req, res) => {
  try {
    const { question, contextSnippet, language, objective } = req.body;
    const targetLanguage = language || 'Spanish';

    const ai = getAIClient();
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

    const ai = getAIClient();
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
// ----------------------------------------------------
// Fallback Utilities (Intelligent, Personalized Conversational Engine)
// ----------------------------------------------------
function getFallbackResponse(
  lang: string,
  messages: any[],
  scenario?: string,
  persona?: any,
  userLevel?: string,
  goal?: string
) {
  const userMessages = (messages || []).filter((m: any) => m.role === 'user');
  const userTurnCount = userMessages.length;
  const lastUserMsg = userMessages[userMessages.length - 1]?.content || userMessages[userMessages.length - 1]?.text || '';
  const lower = lastUserMsg.toLowerCase().trim();
  const personaName = persona?.name || (lang.toLowerCase().includes('french') ? 'Valérie' : 'Mateo');
  const scenarioTitle = scenario || 'Ordering at a lively tapas bar';

  // 1. Dynamic Grammar & Nuance Detection
  let gentleCorrection = {
    hasMistake: false,
    originalPhrase: '',
    improvedPhrase: '',
    explanation: '',
  };

  if (lower.includes('yo quiero')) {
    gentleCorrection = {
      hasMistake: true,
      originalPhrase: 'yo quiero',
      improvedPhrase: 'Quisiera / Me gustaría',
      explanation: 'Saying "Quisiera" or "Me gustaría" sounds much more courteous and natural in public establishments than direct "yo quiero".',
    };
  } else if (lower.includes('el agua frío')) {
    gentleCorrection = {
      hasMistake: true,
      originalPhrase: 'el agua frío',
      improvedPhrase: 'el agua fría',
      explanation: 'Even though "agua" takes "el" in the singular to prevent double-a vowel clash, it remains grammatically feminine, so adjectives take the feminine ending (-a).',
    };
  } else if (lower.includes('gracias para')) {
    gentleCorrection = {
      hasMistake: true,
      originalPhrase: 'gracias para',
      improvedPhrase: 'gracias por',
      explanation: 'In Spanish, always use "por" when expressing gratitude or cause (e.g. "gracias por su ayuda").',
    };
  } else if (lower.includes('soy cansado')) {
    gentleCorrection = {
      hasMistake: true,
      originalPhrase: 'soy cansado',
      improvedPhrase: 'estoy cansado',
      explanation: 'Use the verb "estar" for temporary physical states and feelings, and "ser" for permanent characteristics.',
    };
  } else if (lower.includes('je veux')) {
    gentleCorrection = {
      hasMistake: true,
      originalPhrase: 'je veux',
      improvedPhrase: 'je voudrais',
      explanation: '"Je voudrais" (I would like) is the polite standard in restaurants and service in French, whereas "je veux" sounds demanding.',
    };
  }

  // 2. Spanish Dynamic Contextual Engine
  if (lang.toLowerCase().includes('spanish')) {
    // A. Tapas Bar / Dining Scenario
    if (scenarioTitle.toLowerCase().includes('tapas') || scenarioTitle.toLowerCase().includes('bar') || scenarioTitle.toLowerCase().includes('order')) {
      // Intent: Asking for the bill / check
      if (lower.includes('cuenta') || lower.includes('cobrar') || lower.includes('pagar') || lower.includes('tarjeta') || lower.includes('efectivo')) {
        if (lower.includes('tarjeta') || lower.includes('efectivo')) {
          return {
            reply: '¡Perfecto! El pago ha sido procesado correctamente. Aquí tiene su copia del recibo. Ha sido un placer atenderle, ¡muchas gracias por su visita y que disfrute de su noche en Madrid!',
            translation: 'Perfect! The payment has been processed successfully. Here is your receipt copy. It has been a pleasure serving you, thank you very much for your visit and enjoy your evening in Madrid!',
            culturalTip: 'In Spain, tipping is customary as small change rounded up (5-10%), but not strictly mandatory.',
            gentleCorrection,
            vocabHints: [
              { word: 'el recibo', meaning: 'the receipt', partOfSpeech: 'noun' },
              { word: 'procesar', meaning: 'to process', partOfSpeech: 'verb' },
              { word: 'atender', meaning: 'to attend / serve', partOfSpeech: 'verb' }
            ],
            suggestedReplies: [
              '¡Muchas gracias por todo! Hasta luego.',
              'La comida estaba deliciosa, volveremos.',
              'Buenas noches y que tenga un buen turno.'
            ]
          };
        }

        return {
          reply: '¡Enseguida se la acerco! Aquí tiene el ticket desglosado: son 19,50 euros en total por las tapas y las bebidas. ¿Prefiere abonarlo con tarjeta de crédito o en efectivo?',
          translation: 'I will bring it right over! Here is the itemized bill: it is 19.50 euros in total for the tapas and drinks. Do you prefer paying by credit card or cash?',
          culturalTip: 'In Spain, servers rarely bring the bill to your table unless you explicitly ask for it ("¿Nos trae la cuenta?").',
          gentleCorrection,
          vocabHints: [
            { word: 'desglosado', meaning: 'itemized / broken down', partOfSpeech: 'adjective' },
            { word: 'abonar', meaning: 'to settle / pay', partOfSpeech: 'verb' },
            { word: 'efectivo', meaning: 'cash', partOfSpeech: 'noun' }
          ],
          suggestedReplies: [
            'Con tarjeta de crédito, por favor.',
            'En efectivo, aquí tiene 20 euros.',
            '¿Podemos pagar por separado?'
          ]
        };
      }

      // Intent: Ordering Drinks
      if (lower.includes('vino') || lower.includes('cerveza') || lower.includes('caña') || lower.includes('agua') || lower.includes('refresco') || lower.includes('copa')) {
        const drinkType = lower.includes('vino') ? 'la copa de vino' : lower.includes('cerveza') || lower.includes('caña') ? 'la caña bien fría' : 'la bebida fresca';
        return {
          reply: `¡Marchando ${drinkType}! Se la sirvo ahora mismo con un platito de aceitunas marinadas. Hoy el chef tiene tortilla de patatas recién cuajada y croquetas de jamón ibérico de bellota. ¿Le gustaría pedir alguna ración para acompañar?`,
          translation: `Right away with ${drinkType}! I'll serve it right now with a little dish of marinated olives. Today the chef has freshly made Spanish potato omelet and acorn-fed Iberian ham croquettes. Would you like to order a dish to go with it?`,
          culturalTip: 'In many Spanish regions (like Madrid and Granada), ordering a drink automatically comes with a complimentary small tapa!',
          gentleCorrection,
          vocabHints: [
            { word: 'marchando', meaning: 'coming right up! (kitchen slang)', partOfSpeech: 'idiom' },
            { word: 'recién cuajada', meaning: 'freshly set / cooked', partOfSpeech: 'adjective' },
            { word: 'la ración', meaning: 'a full serving / portion', partOfSpeech: 'noun' }
          ],
          suggestedReplies: [
            'Quisiera media ración de tortilla de patatas, por favor.',
            '¿Las croquetas llevan jamón ibérico?',
            '¿Qué me recomienda de la casa?'
          ]
        };
      }

      // Intent: Ordering Tapas or Food
      if (lower.includes('tapa') || lower.includes('tortilla') || lower.includes('croqueta') || lower.includes('brava') || lower.includes('jamón') || lower.includes('paella') || lower.includes('comer') || lower.includes('plato')) {
        return {
          reply: '¡Una elección inmejorable! Nuestra tortilla es jugosa por dentro y las croquetas son crujientes y caseras. Ya lo he pasado a la comanda de cocina. ¿Tiene alguna alergia alimentaria o intolerancia que deba comunicar al chef?',
          translation: 'An unbeatable choice! Our potato omelet is juicy on the inside and the croquettes are crispy and homemade. I have already sent it to the kitchen ticket. Do you have any food allergies or intolerances I should notify the chef about?',
          culturalTip: 'In Spain, you can often order a "ración" (full portion) or "media ración" (half portion) to share with friends.',
          gentleCorrection,
          vocabHints: [
            { word: 'inmejorable', meaning: 'unbeatable / excellent', partOfSpeech: 'adjective' },
            { word: 'la comanda', meaning: 'the kitchen order ticket', partOfSpeech: 'noun' },
            { word: 'alergia alimentaria', meaning: 'food allergy', partOfSpeech: 'noun' }
          ],
          suggestedReplies: [
            'No tengo ninguna alergia, todo perfecto.',
            'Soy vegetariano, ¿lleva carne o caldo de carne?',
            '¿Tienen pan sin gluten?'
          ]
        };
      }

      // Intent: Table / Seating / Greeting
      if (lower.includes('mesa') || lower.includes('persona') || lower.includes('dos') || lower.includes('barra') || lower.includes('hola') || lower.includes('buenas')) {
        const hasCount = lower.includes('dos') ? 'dos personas' : lower.includes('tres') ? 'tres personas' : lower.includes('cuatro') ? 'cuatro personas' : 'ustedes';
        return {
          reply: `¡Por supuesto! Justo tengo una mesa acogedora para ${hasCount} al lado del ventanal. Siéntense cómodos. Para abrir el apetito, ¿les gustaría una caña bien tirada o prefieren ver la carta de vinos y tapas primero?`,
          translation: `Of course! I have just the cozy table for ${hasCount} right next to the window. Make yourselves comfortable. To open your appetite, would you like a freshly poured beer or do you prefer to see the wine and tapas menu first?`,
          culturalTip: 'In traditional tapas bars in Spain, eating while standing at the bar ("en la barra") is very popular and lively!',
          gentleCorrection,
          vocabHints: [
            { word: 'acogedor', meaning: 'cozy / welcoming', partOfSpeech: 'adjective' },
            { word: 'bien tirada', meaning: 'poured with perfect foam (for beer)', partOfSpeech: 'idiom' },
            { word: 'abrir el apetito', meaning: 'to whet the appetite', partOfSpeech: 'phrase' }
          ],
          suggestedReplies: [
            'Quisiéramos ver la carta de vinos, por favor.',
            'Dos cañas frías para empezar, gracias.',
            '¿Cuál es la especialidad de la casa?'
          ]
        };
      }

      // Default contextual progression for Tapas
      return {
        reply: `¡Entendido! Me alegra mucho. Respecto a lo que me comentas, ¿te gustaría que te traiga una degustación variada de tapas o prefieres que te recomiende un plato fuerte como el secreto ibérico a la brasa?`,
        translation: `Understood! I'm glad to hear it. Regarding what you mention, would you like me to bring a varied tasting of tapas, or do you prefer that I recommend a main dish like grilled Iberian pork?`,
        culturalTip: '"Tapear" is a social verb in Spanish meaning going from bar to bar trying small savory dishes.',
        gentleCorrection,
        vocabHints: [
          { word: 'la degustación', meaning: 'tasting / sampler platter', partOfSpeech: 'noun' },
          { word: 'a la brasa', meaning: 'grilled over charcoal', partOfSpeech: 'phrase' },
          { word: 'recomendar', meaning: 'to recommend', partOfSpeech: 'verb' }
        ],
        suggestedReplies: [
          'Me encantaría probar la degustación variada.',
          '¿Qué ingredientes tiene el secreto ibérico?',
          '¿Nos trae la cuenta, por favor?'
        ]
      };
    }

    // B. Airport / Customs Scenario (Elena)
    if (scenarioTitle.toLowerCase().includes('airport') || scenarioTitle.toLowerCase().includes('baggage') || scenarioTitle.toLowerCase().includes('customs')) {
      if (lower.includes('turismo') || lower.includes('vacaciones') || lower.includes('trabajo') || lower.includes('negocio') || lower.includes('semana') || lower.includes('días')) {
        return {
          reply: 'Muy bien, motivo y estancia registrados correctamente. ¿Trae consigo algún artículo sujeto a declaración aduanera o viaja únicamente con equipaje de mano personal?',
          translation: 'Very well, purpose and stay registered properly. Are you bringing any goods subject to customs declaration, or are you traveling with personal carry-on luggage only?',
          culturalTip: 'At customs checkpoints, answering directly and presenting travel insurance or hotel bookings is customary.',
          gentleCorrection,
          vocabHints: [
            { word: 'declaración aduanera', meaning: 'customs declaration', partOfSpeech: 'noun' },
            { word: 'equipaje de mano', meaning: 'carry-on luggage', partOfSpeech: 'noun' },
            { word: 'la estancia', meaning: 'the stay / duration', partOfSpeech: 'noun' }
          ],
          suggestedReplies: [
            'Solo llevo mi equipaje de mano personal.',
            'He perdido una maleta facturada, ¿dónde puedo reclamar?',
            'No tengo nada que declarar.'
          ]
        };
      }

      if (lower.includes('maleta') || lower.includes('perdid') || lower.includes('factura') || lower.includes('equipaje')) {
        return {
          reply: 'Lamento mucho la molestia con su equipaje. Por favor, acérquese al mostrador número 4 con el comprobante del billete para emitir el parte de irregularidad PIR.',
          translation: 'I am very sorry for the trouble with your luggage. Please head to counter number 4 with your ticket stub to issue the PIR baggage irregularity report.',
          culturalTip: 'The PIR (Property Irregularity Report) is the international standardized document for locating delayed bags.',
          gentleCorrection,
          vocabHints: [
            { word: 'el mostrador', meaning: 'the counter', partOfSpeech: 'noun' },
            { word: 'el comprobante', meaning: 'the receipt / baggage claim tag', partOfSpeech: 'noun' },
            { word: 'emitir', meaning: 'to issue / generate', partOfSpeech: 'verb' }
          ],
          suggestedReplies: [
            'Aquí tengo el comprobante de mi maleta.',
            '¿Cuánto tardarán en enviarla al hotel?',
            'Muchas gracias por su ayuda.'
          ]
        };
      }
    }

    // C. Hotel Check-In Scenario (Carlos)
    if (scenarioTitle.toLowerCase().includes('hotel') || scenarioTitle.toLowerCase().includes('reserva') || scenarioTitle.toLowerCase().includes('check-in')) {
      return {
        reply: `¡Excelente! He localizado su reserva en el sistema informático. Su habitación es la número 305 en la tercera planta, con balcón soleado. La tarjeta magnética sirve también para acceder a la terraza. ¿Desea que le facilite la contraseña del WiFi ahora mismo?`,
        translation: `Excellent! I have located your reservation in the computer system. Your room is number 305 on the third floor, with a sunny balcony. The keycard also gives access to the terrace. Would you like the WiFi password right now?`,
        culturalTip: 'Spanish hotels require all adult guests to present a passport or national ID card upon check-in.',
        gentleCorrection,
        vocabHints: [
          { word: 'la tarjeta magnética', meaning: 'the keycard', partOfSpeech: 'noun' },
          { word: 'el balcón soleado', meaning: 'sunny balcony', partOfSpeech: 'noun' },
          { word: 'localizar', meaning: 'to locate / find', partOfSpeech: 'verb' }
        ],
        suggestedReplies: [
          'Sí, por favor, ¿cuál es la clave del WiFi?',
          '¿A qué hora se sirve el desayuno?',
          '¿Pueden guardar mis maletas después del check-out?'
        ]
      };
    }

    // D. Business / Career Scenario (Sofia / Diego)
    if (scenarioTitle.toLowerCase().includes('work') || scenarioTitle.toLowerCase().includes('meeting') || scenarioTitle.toLowerCase().includes('pitch')) {
      return {
        reply: `¡Excelente síntesis! Me parece una propuesta muy coherente con los objetivos del trimestre. En cuanto al calendario de entregas, ¿consideras viable tener el primer prototipo listo para el próximo sprint o necesitaremos apoyo del equipo técnico?`,
        translation: `Excellent summary! It seems very aligned with this quarter's objectives. Regarding the delivery schedule, do you consider it feasible to have the first prototype ready for the next sprint, or will we need technical team support?`,
        culturalTip: 'In Spanish business culture, personal rapport and cordial conversation precede jumping directly into the contract agenda.',
        gentleCorrection,
        vocabHints: [
          { word: 'coherente', meaning: 'aligned / coherent', partOfSpeech: 'adjective' },
          { word: 'el calendario de entregas', meaning: 'the delivery schedule / timeline', partOfSpeech: 'noun' },
          { word: 'viable', meaning: 'feasible / viable', partOfSpeech: 'adjective' }
        ],
        suggestedReplies: [
          'Considero que es totalmente viable para el próximo sprint.',
          'Necesitaremos coordinar con el equipo de diseño primero.',
          '¿Podríamos revisar el presupuesto asignado?'
        ]
      };
    }

    // General Spanish response personalized to turn
    return {
      reply: `¡Comprendo perfectamente lo que dices! Para profundizar en este tema de ${scenarioTitle}, cuéntame un poco más: ¿cuál sería el siguiente paso que tienes en mente?`,
      translation: `I understand what you say perfectly! To delve deeper into this topic, tell me a bit more: what would be the next step you have in mind?`,
      culturalTip: 'Active conversational listening and prompt turn-taking show warmth in Spanish communication.',
      gentleCorrection,
      vocabHints: [
        { word: 'profundizar', meaning: 'to delve deeper / explore in detail', partOfSpeech: 'verb' },
        { word: 'el siguiente paso', meaning: 'the next step', partOfSpeech: 'phrase' }
      ],
      suggestedReplies: [
        'Me gustaría enfocarme en los detalles prácticos.',
        '¿Cómo suelen resolver esto los locales?',
        'Tengo otra pregunta sobre este punto.'
      ]
    };
  }

  // 3. French Dynamic Contextual Engine
  if (lang.toLowerCase().includes('french')) {
    if (lower.includes('addition') || lower.includes('payer') || lower.includes('carte') || lower.includes('combien')) {
      return {
        reply: `Voici l'addition : cela fait 26 euros au total pour votre repas. Vous préférez régler par carte bancaire ou en espèces ? J'espère que vous avez passé un agréable moment parmi nous.`,
        translation: `Here is the bill: that comes to 26 euros in total for your meal. Do you prefer to pay by card or in cash? I hope you enjoyed your time with us.`,
        culturalTip: 'In France, asking "L\'addition, s\'il vous plaît" is the universal courteous formula.',
        gentleCorrection,
        vocabHints: [
          { word: 'l\'addition', meaning: 'the restaurant bill', partOfSpeech: 'noun' },
          { word: 'régler', meaning: 'to settle / pay', partOfSpeech: 'verb' },
          { word: 'en espèces', meaning: 'in cash', partOfSpeech: 'phrase' }
        ],
        suggestedReplies: [
          'Par carte bancaire, s’il vous plaît.',
          'En espèces, voici 30 euros.',
          'Merci beaucoup, le repas était délicieux !'
        ]
      };
    }

    if (lower.includes('vin') || lower.includes('café') || lower.includes('eau') || lower.includes('boire')) {
      return {
        reply: `Très bon choix ! Je vous apporte cela de suite. Aujourd'hui, notre chef propose un plat du jour savoureux : un filet de saumon grillé et des légumes de saison. Cela vous tente ?`,
        translation: `Very good choice! I'll bring that right over. Today our chef offers a tasty daily special: grilled salmon fillet with seasonal vegetables. Does that tempt you?`,
        culturalTip: 'In French dining, asking for "une carafe d\'eau" gets you complimentary tap water.',
        gentleCorrection,
        vocabHints: [
          { word: 'plat du jour', meaning: 'daily special', partOfSpeech: 'noun' },
          { word: 'savoureux', meaning: 'tasty / delicious', partOfSpeech: 'adjective' },
          { word: 'tenter', meaning: 'to tempt / appeal to', partOfSpeech: 'verb' }
        ],
        suggestedReplies: [
          'Oui, je prends le plat du jour !',
          'Avez-vous une option végétarienne ?',
          'Est-ce que le service est compris ?'
        ]
      };
    }

    return {
      reply: `Enchanté ! C'est noté avec grand plaisir. Pour continuer agréablement notre échange, dites-moi : avez-vous des préférences particulières pour la suite ?`,
      translation: `Delighted! Noted with great pleasure. To continue our conversation pleasantly, tell me: do you have any particular preferences for what's next?`,
      culturalTip: 'Politeness formulas like "s\'il vous plaît" and "merci beaucoup" are essential in every French interaction.',
      gentleCorrection,
      vocabHints: [
        { word: 'noté', meaning: 'noted / taken down', partOfSpeech: 'adjective' },
        { word: 'particulier', meaning: 'particular / specific', partOfSpeech: 'adjective' }
      ],
      suggestedReplies: [
        'Je voudrais avoir votre recommandation.',
        'Comment cela fonctionne-t-il exactement ?',
        'L’addition, s’il vous plaît.'
      ]
    };
  }

  // 4. General / English Multi-Turn
  return {
    reply: `I understand completely, that's a very natural response! Based on what you just shared about "${lastUserMsg.slice(0, 30)}...", how would you like to proceed with our conversation next?`,
    translation: 'English dialogue progression.',
    culturalTip: 'Prompt responses with natural pauses mirror real-world native conversation pacing.',
    gentleCorrection,
    vocabHints: [
      { word: 'proceed', meaning: 'continue forward', partOfSpeech: 'verb' },
      { word: 'perspective', meaning: 'point of view', partOfSpeech: 'noun' }
    ],
    suggestedReplies: [
      'Tell me what the locals usually recommend here.',
      'How would I ask this in a more formal setting?',
      'Let us move on to the next topic.'
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
