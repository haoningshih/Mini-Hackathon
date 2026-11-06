import { LanguageOption, GoalOption, CurriculumUnit, TargetLanguage, LearningGoal, ChatMessage } from '../types/duo';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    locale: 'es-ES',
    popularGreeting: '¡Hola! ¿Cómo estás?',
    accentColor: '#58cc02',
  },
  {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    locale: 'fr-FR',
    popularGreeting: 'Bonjour ! Comment ça va ?',
    accentColor: '#1cb0f6',
  },
  {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    locale: 'de-DE',
    popularGreeting: 'Guten Tag! Wie geht es Ihnen?',
    accentColor: '#ff9600',
  },
  {
    code: 'it',
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    locale: 'it-IT',
    popularGreeting: 'Ciao! Come stai?',
    accentColor: '#2ce080',
  },
  {
    code: 'ja',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    locale: 'ja-JP',
    popularGreeting: 'こんにちは！お元気ですか？',
    accentColor: '#ff4b4b',
  },
  {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇧🇷',
    locale: 'pt-BR',
    popularGreeting: 'Olá! Tudo bem?',
    accentColor: '#ce82ff',
  },
  {
    code: 'zh',
    name: 'Mandarin',
    nativeName: '中文',
    flag: '🇨🇳',
    locale: 'zh-CN',
    popularGreeting: '你好！最近怎么样？',
    accentColor: '#e02424',
  },
];

export interface ScenarioDefinition {
  id: string;
  title: string;
  description: string;
  personaName: string;
  personaRole: string;
  initialGreeting: string;
  initialTranslation: string;
  vocabHints: { word: string; meaning: string; partOfSpeech: string }[];
  suggestedReplies: string[];
}

// Full multilingual scenario dictionary indexed by [TargetLanguage][LearningGoal]
const SCENARIO_CATALOG: Record<TargetLanguage, Record<LearningGoal, ScenarioDefinition[]>> = {
  Spanish: {
    travel: [
      {
        id: 'travel-tapas',
        title: 'Ordering at a Lively Tapas Bar',
        description: 'Practice requesting recommendations, specifying dietary needs, and asking for the check.',
        personaName: 'Mateo',
        personaRole: 'Madrid Tapas Barista & Local Host',
        initialGreeting: '¡Buenas noches! Bienvenidos al Rincón del Sabor. ¿Tienen mesa reservada o buscan algo rápido en la barra?',
        initialTranslation: 'Good evening! Welcome to Rincón del Sabor. Do you have a table reserved or are you looking for a quick bite at the bar?',
        vocabHints: [
          { word: 'bienvenidos', meaning: 'welcome', partOfSpeech: 'adjective' },
          { word: 'la barra', meaning: 'the bar counter', partOfSpeech: 'noun' },
          { word: 'reservar', meaning: 'to reserve', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          '¡Buenas noches! Una mesa para dos personas, por favor.',
          'Buscamos algo rápido en la barra, gracias.',
          '¿Cuál es la especialidad de la casa hoy?',
        ],
      },
      {
        id: 'travel-airport',
        title: 'Airport Customs & Lost Baggage',
        description: 'Explain lost luggage, confirm boarding gate, and navigate terminal connections.',
        personaName: 'Elena',
        personaRole: 'Terminal Customs Officer',
        initialGreeting: 'Hola, buenas tardes. Su pasaporte y tarjeta de embarque, por favor. ¿Cuál es el motivo de su visita?',
        initialTranslation: 'Hello, good afternoon. Your passport and boarding pass, please. What is the reason for your visit?',
        vocabHints: [
          { word: 'tarjeta de embarque', meaning: 'boarding pass', partOfSpeech: 'noun' },
          { word: 'el motivo', meaning: 'reason / purpose', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Viajo por turismo durante dos semanas.',
          'Vengo por un viaje de negocios.',
          'He perdido mi maleta facturada, ¿dónde puedo reclamar?',
        ],
      },
      {
        id: 'travel-hotel',
        title: 'Boutique Hotel Check-in & Inquiries',
        description: 'Ask for early check-in, wifi passwords, extra pillows, and city map advice.',
        personaName: 'Carlos',
        personaRole: 'Front Desk Concierge',
        initialGreeting: '¡Bienvenido al Hotel Bella Vista! ¿Tiene una reserva a su nombre para esta noche?',
        initialTranslation: 'Welcome to Hotel Bella Vista! Do you have a reservation under your name for tonight?',
        vocabHints: [
          { word: 'la reserva', meaning: 'the reservation', partOfSpeech: 'noun' },
          { word: 'a su nombre', meaning: 'under your name', partOfSpeech: 'phrase' },
        ],
        suggestedReplies: [
          'Sí, tengo una reserva a nombre de Smith.',
          '¿A qué hora se sirve el desayuno por la mañana?',
          '¿Podría darme la contraseña del WiFi, por favor?',
        ],
      },
    ],
    work: [
      {
        id: 'work-meeting',
        title: 'Kickoff Meeting & Sprint Pitch',
        description: 'Introduce yourself to team leads, outline your quarterly goals, and answer questions.',
        personaName: 'Sofia',
        personaRole: 'Product VP & Project Lead',
        initialGreeting: 'Hola a todos. Gracias por unirse a la reunión de sincronización. ¿Podrías comenzar presentándote y compartiendo tus prioridades del sprint?',
        initialTranslation: 'Hello everyone. Thank you for joining the sync meeting. Could you start by introducing yourself and sharing your sprint priorities?',
        vocabHints: [
          { word: 'sincronización', meaning: 'sync / alignment', partOfSpeech: 'noun' },
          { word: 'las prioridades', meaning: 'priorities', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Hola Sofia, soy el nuevo desarrollador y mis prioridades son el lanzamiento.',
          'Gracias por la bienvenida, estoy listo para presentar el reporte.',
          '¿Podemos revisar primero el calendario de entregas?',
        ],
      },
      {
        id: 'work-coffee',
        title: 'Watercooler Coffee Chat with Coworkers',
        description: 'Engage in natural small talk about weekend plans, workload, and company culture.',
        personaName: 'Diego',
        personaRole: 'Senior Software Engineer Colleague',
        initialGreeting: '¡Hola! ¿Un café? Menuda semana llevamos con el lanzamiento. ¿Cómo va tu proyecto?',
        initialTranslation: 'Hey! Coffee? What a week we have had with the launch. How is your project going?',
        vocabHints: [
          { word: 'menuda semana', meaning: 'what a week! (idiom)', partOfSpeech: 'phrase' },
          { word: 'el lanzamiento', meaning: 'the launch / release', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          '¡Sí, por favor, necesito cafeína! Todo va sobre ruedas.',
          'Bastante ocupado, pero estamos listos para mañana.',
          '¿Tienes planes divertidos para este fin de semana?',
        ],
      },
    ],
    relocation: [
      {
        id: 'relo-apartment',
        title: 'Viewing an Apartment with Landlord',
        description: 'Ask about monthly bills, security deposit, contract duration, and pet rules.',
        personaName: 'Don Alberto',
        personaRole: 'Apartment Owner & Landlord',
        initialGreeting: 'Pase adelante, mire el salón. Tiene muchísima luz natural. ¿Para cuándo estaría buscando mudarse?',
        initialTranslation: 'Come on in, look at the living room. It has tons of natural light. When would you be looking to move in?',
        vocabHints: [
          { word: 'pase adelante', meaning: 'come right in', partOfSpeech: 'phrase' },
          { word: 'mudarse', meaning: 'to move (residence)', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          'Estaría buscando mudarme a principios del próximo mes.',
          '¿Los gastos de luz y agua están incluidos en el alquiler?',
          '¿Cuánto piden de fianza o depósito?',
        ],
      },
    ],
    culture: [
      {
        id: 'culture-dinner',
        title: 'Sunday Family Lunch & Recipe Secrets',
        description: 'Compliment the meal, ask how the secret sauce is prepared, and discuss family news.',
        personaName: 'Abuela Carmen',
        personaRole: 'Loving Family Matriarch',
        initialGreeting: '¡Mi amor! Pasa, pasa a la mesa, que la paella ya está lista. ¿Tienes mucha hambre? Cuéntame cómo te ha ido la semana.',
        initialTranslation: 'My dear! Come, come sit at the table, the paella is ready. Are you very hungry? Tell me how your week went.',
        vocabHints: [
          { word: 'mi amor', meaning: 'my dear / darling', partOfSpeech: 'noun' },
          { word: 'listo', meaning: 'ready', partOfSpeech: 'adjective' },
        ],
        suggestedReplies: [
          '¡Huele espectacular, abuela! Me ha ido genial la semana.',
          '¡Muchas gracias! ¿Me enseñas tu receta secreta?',
          'He estado trabajando mucho, pero muy feliz de ver a todos.',
        ],
      },
    ],
    exam: [
      {
        id: 'exam-oral',
        title: 'CEFR Official Oral Exam Simulation (DELE/SIELE)',
        description: 'Present an argumentative thesis, synthesize two perspectives, and defend your conclusion.',
        personaName: 'Prof. Navarro',
        personaRole: 'Certified CEFR Oral Examiner',
        initialGreeting: 'Buenos días, candidato. En esta prueba evaluaremos su fluidez y uso de conectores discursivos. Por favor, presente su postura sobre el impacto de la tecnología.',
        initialTranslation: 'Good morning, candidate. In this test we will evaluate your fluency and discourse connectors. Please present your stance on the impact of technology.',
        vocabHints: [
          { word: 'conectores discursivos', meaning: 'discourse connectors', partOfSpeech: 'noun' },
          { word: 'la postura', meaning: 'stance / viewpoint', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'En primer lugar, considero que la tecnología impulsa la conectividad global.',
          'Desde mi punto de vista, existen ventajas y desafíos clave.',
          'Para empezar, me gustaría estructurar mi argumento en dos vertientes.',
        ],
      },
    ],
    social: [
      {
        id: 'social-party',
        title: 'Neighborhood Rooftop Party',
        description: 'Mingle with locals, exchange social media handles, and talk about music and food.',
        personaName: 'Lucía',
        personaRole: 'Friendly Local Friend',
        initialGreeting: '¡Hola! ¡Qué bueno que pudiste venir a la fiesta en la terraza! ¿Ya conoces a la gente de aquí o te presento?',
        initialTranslation: 'Hi! So glad you could come to the rooftop party! Do you already know people here, or should I introduce you?',
        vocabHints: [
          { word: 'la terraza', meaning: 'rooftop / terrace', partOfSpeech: 'noun' },
          { word: 'presentar', meaning: 'to introduce', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          '¡Hola Lucía! Qué vista tan increíble. Por favor, preséntame a tus amigos.',
          'Encantado de estar aquí. ¿Qué música tan buena, quién es el DJ?',
          'Recién acabo de llegar, ¡me encantaría una bebida fresca!',
        ],
      },
    ],
  },

  French: {
    travel: [
      {
        id: 'travel-bistro',
        title: 'Ordering at a Classic Paris Bistro',
        description: 'Order regional French specialties, ask for wine pairings, and request the check courteously.',
        personaName: 'Valérie',
        personaRole: 'Parisian Bistro Host & Server',
        initialGreeting: 'Bonsoir et bienvenue au Bistro des Amis ! Avez-vous une réservation ou cherchez-vous une table pour dîner ?',
        initialTranslation: 'Good evening and welcome to Bistro des Amis! Do you have a reservation or are you looking for a dinner table?',
        vocabHints: [
          { word: 'bienvenue', meaning: 'welcome', partOfSpeech: 'noun' },
          { word: 'une réservation', meaning: 'a reservation', partOfSpeech: 'noun' },
          { word: 'dîner', meaning: 'to have dinner', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          'Bonsoir ! Une table pour deux personnes, s’il vous plaît.',
          'Avez-vous une table libre en terrasse ?',
          'Quel est le plat du jour recommandé par le chef ?',
        ],
      },
      {
        id: 'travel-airport',
        title: 'CDG Airport Border Control & Lost Baggage',
        description: 'Present travel documents, describe missing luggage, and navigate train connections.',
        personaName: 'Julien',
        personaRole: 'Border Control & Transit Officer',
        initialGreeting: 'Bonjour, vos billets et pièces d’identité s’il vous plaît. Quel est le motif de votre séjour en France ?',
        initialTranslation: 'Hello, your tickets and identification documents please. What is the purpose of your stay in France?',
        vocabHints: [
          { word: 'pièces d’identité', meaning: 'ID documents', partOfSpeech: 'noun' },
          { word: 'le motif', meaning: 'purpose / reason', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Je voyage pour le tourisme pendant deux semaines.',
          'Je viens pour une conférence professionnelle à Paris.',
          'J’ai perdu ma valise enregistrée, où puis-je la réclamer ?',
        ],
      },
      {
        id: 'travel-hotel',
        title: 'Boutique Hotel Check-in in Montmartre',
        description: 'Confirm room reservations, request city maps, and ask about French breakfast hours.',
        personaName: 'Antoine',
        personaRole: 'Hotel Reception Concierge',
        initialGreeting: 'Bienvenue à l’Hôtel Belle Époque ! Avez-vous une réservation à votre nom pour ce soir ?',
        initialTranslation: 'Welcome to Hotel Belle Époque! Do you have a reservation under your name for tonight?',
        vocabHints: [
          { word: 'à votre nom', meaning: 'under your name', partOfSpeech: 'phrase' },
          { word: 'le séjour', meaning: 'the stay', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Oui, j’ai une réservation au nom de Martin.',
          'À quelle heure est servi le petit-déjeuner demain matin ?',
          'Pouvez-vous me donner le mot de passe du WiFi ?',
        ],
      },
    ],
    work: [
      {
        id: 'work-meeting',
        title: 'Project Kickoff & Team Sprint Alignment',
        description: 'Introduce yourself in corporate French, present quarterly milestones, and answer inquiries.',
        personaName: 'Camille',
        personaRole: 'Product Director & Project Lead',
        initialGreeting: 'Bonjour à tous, merci d’être présents à notre point d’équipe. Pourriez-vous commencer par présenter vos priorités pour ce sprint ?',
        initialTranslation: 'Hello everyone, thank you for being here for our team sync. Could you start by presenting your priorities for this sprint?',
        vocabHints: [
          { word: 'point d’équipe', meaning: 'team sync meeting', partOfSpeech: 'noun' },
          { word: 'les priorités', meaning: 'priorities', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Bonjour Camille, mes priorités sont le déploiement de la nouvelle interface.',
          'Merci pour l’accueil, je suis prêt à partager mon écran.',
          'Pouvons-nous d’abord valider le calendrier des livrables ?',
        ],
      },
      {
        id: 'work-coffee',
        title: 'Coffee Break Chat with Colleagues',
        description: 'Exchange polite small talk about projects, weekend excursions, and office life.',
        personaName: 'Lucas',
        personaRole: 'Senior Data Engineer',
        initialGreeting: 'Salut ! Tu prends un café ? Quelle semaine intense avec les déploiements ! Comment avance ton dossier ?',
        initialTranslation: 'Hi! Grabbing a coffee? What an intense week with the deployments! How is your project coming along?',
        vocabHints: [
          { word: 'intense', meaning: 'intense / busy', partOfSpeech: 'adjective' },
          { word: 'le dossier', meaning: 'the file / project', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Salut Lucas ! Avec plaisir pour le café, tout avance très bien.',
          'Un peu chargé en ce moment, mais nous serons prêts pour vendredi.',
          'Tu as des projets prévus pour ce week-end ?',
        ],
      },
    ],
    relocation: [
      {
        id: 'relo-apartment',
        title: 'Apartment Visit with Paris Landlord',
        description: 'Inquire about monthly charges, lease duration, security deposit, and neighborhood amenities.',
        personaName: 'Mme. Laurent',
        personaRole: 'Apartment Owner & Landlord',
        initialGreeting: 'Entrez donc, je vous en prie ! Voici le séjour, très lumineux comme vous pouvez le constater. Pour quand cherchez-vous à emménager ?',
        initialTranslation: 'Please come in! Here is the living room, very bright as you can see. When are you looking to move in?',
        vocabHints: [
          { word: 'le séjour', meaning: 'living room', partOfSpeech: 'noun' },
          { word: 'emménager', meaning: 'to move in', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          'Je souhaite emménager au premier du mois prochain.',
          'Est-ce que les charges d’eau et de chauffage sont comprises ?',
          'Quel est le montant de la caution demandée ?',
        ],
      },
    ],
    culture: [
      {
        id: 'culture-dinner',
        title: 'Sunday Family Dinner in the Countryside',
        description: 'Compliment the culinary preparations, ask about secret recipes, and share family updates.',
        personaName: 'Grand-mère Monique',
        personaRole: 'Affectionate Family Matriarch',
        initialGreeting: 'Mon cher ! Entre vite, le rôti est presque prêt et la table est dressée. As-tu fait bon voyage ? Raconte-moi ta semaine !',
        initialTranslation: 'My dear! Come in quickly, the roast is almost ready and the table is set. Did you have a good trip? Tell me about your week!',
        vocabHints: [
          { word: 'la table est dressée', meaning: 'the table is set', partOfSpeech: 'phrase' },
          { word: 'bon voyage', meaning: 'safe / good trip', partOfSpeech: 'phrase' },
        ],
        suggestedReplies: [
          'Bonjour Grand-mère ! Ça sent incroyablement bon.',
          'Le voyage s’est très bien passé, je suis ravi d’être ici.',
          'Tu m’apprendras à cuisiner ce plat un jour ?',
        ],
      },
    ],
    exam: [
      {
        id: 'exam-oral',
        title: 'Official DELF / DALF Oral Defense',
        description: 'Present a structured exposé, use formal transitions, and defend an analytical thesis.',
        personaName: 'Prof. Dubois',
        personaRole: 'Certified DELF/DALF Examiner',
        initialGreeting: 'Bonjour. Pour cette épreuve orale, nous évaluerons votre capacité à argumenter et à nuancer votre pensée. Veuillez exposer votre thèse sur le télétravail.',
        initialTranslation: 'Good morning. For this oral test, we will evaluate your ability to argue and nuance your thoughts. Please present your thesis on remote work.',
        vocabHints: [
          { word: 'argumenter', meaning: 'to argue / make a case', partOfSpeech: 'verb' },
          { word: 'nuancer', meaning: 'to nuance / balance', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          'Tout d’abord, il convient de souligner les bénéfices du télétravail sur la flexibilité.',
          'Cependant, il est essentiel d’examiner également les risques d’isolement.',
          'En conclusion, un modèle hybride semble être le compromis le plus équilibré.',
        ],
      },
    ],
    social: [
      {
        id: 'social-evening',
        title: 'Parisian Rooftop Gathering',
        description: 'Socialize with locals, discuss cinema and music, and exchange social contacts.',
        personaName: 'Chloé',
        personaRole: 'Local Host & Friend',
        initialGreeting: 'Salut ! Trop contente que tu aies pu venir ce soir ! Tu as déjà rencontré les autres ou je te présente le groupe ?',
        initialTranslation: 'Hi! So happy you could come tonight! Have you met the others yet or should I introduce you to the group?',
        vocabHints: [
          { word: 'content(e)', meaning: 'happy / pleased', partOfSpeech: 'adjective' },
          { word: 'présenter', meaning: 'to introduce', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          'Salut Chloé ! La vue sur Paris est magnifique, présente-moi tout le monde !',
          'Enchanté d’être ici ! Quelle est cette musique géniale ?',
          'Je viens tout juste d’arriver, je veux bien un verre d’eau fraîche.',
        ],
      },
    ],
  },

  German: {
    travel: [
      {
        id: 'travel-gasthaus',
        title: 'Ordering at a Traditional Berlin Gasthaus',
        description: 'Order hearty German classics, ask for regional beers on tap, and settle the bill.',
        personaName: 'Lukas',
        personaRole: 'Berliner Wirt & Gastfreund',
        initialGreeting: 'Guten Abend! Herzlich willkommen im Brauhaus. Haben Sie reserviert oder suchen Sie einen gemütlichen Tisch für das Abendessen?',
        initialTranslation: 'Good evening! Warm welcome to the brewhouse. Do you have a reservation or are you looking for a cozy table for dinner?',
        vocabHints: [
          { word: 'herzlich willkommen', meaning: 'warm welcome', partOfSpeech: 'phrase' },
          { word: 'der Tisch', meaning: 'the table', partOfSpeech: 'noun' },
          { word: 'das Abendessen', meaning: 'dinner', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Guten Abend! Einen Tisch für zwei Personen bitte.',
          'Wir hätten gerne zwei frisch gezapfte Biere für den Anfang.',
          'Was ist die Spezialität des Hauses heute?',
        ],
      },
      {
        id: 'travel-airport',
        title: 'Frankfurt Airport & Train Connections',
        description: 'Navigate security declarations, luggage claim counters, and ICE train connections.',
        personaName: 'Anna',
        personaRole: 'Transit Officer & Travel Advisor',
        initialGreeting: 'Guten Tag! Ihren Reisepass und die Bordkarte bitte. Was ist der Hauptgrund Ihrer Reise nach Deutschland?',
        initialTranslation: 'Good day! Your passport and boarding pass please. What is the main purpose of your trip to Germany?',
        vocabHints: [
          { word: 'der Reisepass', meaning: 'passport', partOfSpeech: 'noun' },
          { word: 'die Bordkarte', meaning: 'boarding pass', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Ich reise für zwei Wochen Urlaub und Tourismus.',
          'Ich bin geschäftlich für eine Konferenz hier.',
          'Mein Koffer ist leider verloren gegangen. Wo kann ich das melden?',
        ],
      },
      {
        id: 'travel-hotel',
        title: 'Boutique Hotel Check-in in Munich',
        description: 'Confirm reservations, ask about breakfast times, and get local city center advice.',
        personaName: 'Markus',
        personaRole: 'Front Desk Concierge',
        initialGreeting: 'Guten Tag und herzlich willkommen im Hotel Stadtmitte! Haben Sie eine Zimmerreservierung auf Ihren Namen?',
        initialTranslation: 'Good day and welcome to Hotel Stadtmitte! Do you have a room reservation under your name?',
        vocabHints: [
          { word: 'die Zimmerreservierung', meaning: 'room reservation', partOfSpeech: 'noun' },
          { word: 'auf Ihren Namen', meaning: 'under your name', partOfSpeech: 'phrase' },
        ],
        suggestedReplies: [
          'Ja, eine Reservierung auf den Namen Weber.',
          'Um wie viel Uhr gibt es morgen Früh Frühstück?',
          'Könnten Sie mir bitte das WLAN-Passwort geben?',
        ],
      },
    ],
    work: [
      {
        id: 'work-meeting',
        title: 'Project Kickoff & Sprint Planning',
        description: 'Present status updates in professional German, outline deliverables, and answer questions.',
        personaName: 'Stefan',
        personaRole: 'Projektleiter & Team Lead',
        initialGreeting: 'Guten Morgen zusammen! Willkommen zu unserem Sprint-Kickoff. Könntest du bitte mit einem kurzen Update zu deinen Prioritäten beginnen?',
        initialTranslation: 'Good morning everyone! Welcome to our sprint kickoff. Could you please start with a brief update on your priorities?',
        vocabHints: [
          { word: 'das Update', meaning: 'status update', partOfSpeech: 'noun' },
          { word: 'die Prioritäten', meaning: 'priorities', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Guten Morgen Stefan, meine Hauptpriorität ist der Release der neuen Plattform.',
          'Vielen Dank! Ich bin bereit, meine Folien zu präsentieren.',
          'Lassen Sie uns zuerst den Zeitplan für die Meilensteine abstimmen.',
        ],
      },
    ],
    relocation: [
      {
        id: 'relo-apartment',
        title: 'Wohnungsbesichtigung with Landlord',
        description: 'Ask about Nebenkosten (utilities), Kaution (deposit), and contract terms.',
        personaName: 'Herr Müller',
        personaRole: 'Vermieter & Eigentümer',
        initialGreeting: 'Treten Sie gerne ein! Das ist das helle Wohnzimmer mit Blick auf den Park. Ab wann planen Sie Ihren Einzug?',
        initialTranslation: 'Please step inside! This is the bright living room overlooking the park. Starting when are you planning your move-in?',
        vocabHints: [
          { word: 'das Wohnzimmer', meaning: 'living room', partOfSpeech: 'noun' },
          { word: 'der Einzug', meaning: 'move-in', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Ich würde gerne zum Ersten des nächsten Monats einziehen.',
          'Sind die Nebenkosten wie Heizung und Wasser in der Miete enthalten?',
          'Wie hoch ist die Kaution für diese Wohnung?',
        ],
      },
    ],
    culture: [
      {
        id: 'culture-dinner',
        title: 'Sunday Family Coffee & Kuchen',
        description: 'Enjoy homemade pastries, compliment the host, and discuss family traditions.',
        personaName: 'Oma Hilde',
        personaRole: 'Herzliche Großmutter',
        initialGreeting: 'Komm herein, mein Kind! Der Apfelkuchen ist frisch aus dem Ofen und der Kaffee ist fertig. Wie war deine Woche?',
        initialTranslation: 'Come inside, my child! The apple pie is fresh out of the oven and the coffee is ready. How was your week?',
        vocabHints: [
          { word: 'frisch aus dem Ofen', meaning: 'fresh out of the oven', partOfSpeech: 'phrase' },
          { word: 'der Kuchen', meaning: 'cake / pastry', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Hallo Oma! Es riecht absolut fantastisch.',
          'Die Woche war gut, aber ich habe mich sehr auf diesen Besuch gefreut.',
          'Verrätst du mir heute dein Geheimrezept für den Kuchen?',
        ],
      },
    ],
    exam: [
      {
        id: 'exam-oral',
        title: 'Goethe-Zertifikat / TestDaF Mündliche Prüfung',
        description: 'Structure an academic argument, use formal connectors, and respond to examiner questions.',
        personaName: 'Prof. Wagner',
        personaRole: 'Zertifizierter Prüfer',
        initialGreeting: 'Guten Tag. In dieser Prüfung bewerten wir Ihre Ausdrucksfähigkeit und Argumentation. Bitte stellen Sie Ihren Standpunkt zum Thema Nachhaltigkeit dar.',
        initialTranslation: 'Good day. In this exam we evaluate your expressive capability and argumentation. Please present your standpoint on sustainability.',
        vocabHints: [
          { word: 'der Standpunkt', meaning: 'standpoint / viewpoint', partOfSpeech: 'noun' },
          { word: 'die Nachhaltigkeit', meaning: 'sustainability', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Zunächst möchte ich auf die wirtschaftlichen Aspekte eingehen.',
          'Einerseits gibt es klare Chancen, andererseits bestehen regulatorische Hürden.',
          'Zusammenfassend lässt sich sagen, dass ein ausgewogener Ansatz nötig ist.',
        ],
      },
    ],
    social: [
      {
        id: 'social-biergarten',
        title: 'Evening at a Munich Biergarten',
        description: 'Socialize with locals, share pretzels, and chat about sports, travel, and city life.',
        personaName: 'Felix',
        personaRole: 'Münchner Freund',
        initialGreeting: 'Servus! Schön, dass du es geschafft hast! Setz dich zu uns an den Tisch. Möchtest du eine Maß Bier oder eine Schorle?',
        initialTranslation: 'Servus! Great that you made it! Sit down with us at the table. Would you like a liter of beer or a spritzer?',
        vocabHints: [
          { word: 'Servus', meaning: 'Hello / Greetings (Bavarian)', partOfSpeech: 'greeting' },
          { word: 'die Maß', meaning: 'one-liter beer mug', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Servus Felix! Eine Apfelschorle bitte für mich.',
          'Tolle Atmosphäre hier! Wer spielt denn heute Abend?',
          'Vielen Dank! Ich bestelle gleich eine Brezel dazu.',
        ],
      },
    ],
  },

  Italian: {
    travel: [
      {
        id: 'travel-trattoria',
        title: 'Ordering at a Traditional Rome Trattoria',
        description: 'Order authentic pasta specialties, ask for house wine, and request the check politely.',
        personaName: 'Marco',
        personaRole: 'Cameriere & Oste Romano',
        initialGreeting: 'Buonasera e benvenuti alla Trattoria Romana! Avete già un tavolo prenotato o cercate un posto per due persone?',
        initialTranslation: 'Good evening and welcome to Trattoria Romana! Do you already have a reserved table or are you looking for a spot for two?',
        vocabHints: [
          { word: 'benvenuti', meaning: 'welcome', partOfSpeech: 'adjective' },
          { word: 'il tavolo', meaning: 'the table', partOfSpeech: 'noun' },
          { word: 'prenotato', meaning: 'reserved', partOfSpeech: 'adjective' },
        ],
        suggestedReplies: [
          'Buonasera! Un tavolo per due persone, per favore.',
          'Ci piacerebbe sederci fuori all’aperto.',
          'Qual è la pasta del giorno consigliata dallo chef?',
        ],
      },
      {
        id: 'travel-airport',
        title: 'Rome Fiumicino Airport & Lost Luggage',
        description: 'Inquire about connecting gates, train to Termini, and report delayed baggage.',
        personaName: 'Giulia',
        personaRole: 'Airport Passenger Assistant',
        initialGreeting: 'Buongiorno! Passaporto e carta d’imbarco, per favore. Qual è il motivo del vostro soggiorno in Italia?',
        initialTranslation: 'Good morning! Passport and boarding pass, please. What is the reason for your stay in Italy?',
        vocabHints: [
          { word: 'il soggiorno', meaning: 'the stay / visit', partOfSpeech: 'noun' },
          { word: 'la carta d’imbarco', meaning: 'boarding pass', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Siamo in vacanza per due settimane.',
          'Il mio bagaglio registrato non è arrivato, dove posso fare reclamo?',
          'Come arrivo al treno Leonardo Express per Roma Termini?',
        ],
      },
    ],
    work: [
      {
        id: 'work-meeting',
        title: 'Corporate Alignment & Product Kickoff',
        description: 'Present project timelines, coordinate sprint milestones, and engage with Italian partners.',
        personaName: 'Alessandro',
        personaRole: 'Responsabile di Progetto',
        initialGreeting: 'Buongiorno a tutti e benvenuti al nostro allineamento. Potresti iniziare presentando le tue priorità per questo sprint?',
        initialTranslation: 'Good morning everyone and welcome to our sync. Could you start by presenting your priorities for this sprint?',
        vocabHints: [
          { word: 'allineamento', meaning: 'sync / alignment', partOfSpeech: 'noun' },
          { word: 'le priorità', meaning: 'priorities', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Buongiorno Alessandro, le mie priorità sono il lancio della nuova versione.',
          'Grazie per l’accoglienza, condivido subito la presentazione.',
          'Possiamo verificare prima il calendario delle consegne?',
        ],
      },
    ],
    relocation: [
      {
        id: 'relo-apartment',
        title: 'Apartment Viewing in Florence',
        description: 'Ask about monthly condominium expenses, lease contracts, and neighborhood life.',
        personaName: 'Sig. Bianchi',
        personaRole: 'Proprietario dell’Appartamento',
        initialGreeting: 'Prego, entrate pure! Questo è il salotto, molto luminoso. Per quando vorreste trasferirvi?',
        initialTranslation: 'Please, come right in! This is the living room, very bright. When would you like to move in?',
        vocabHints: [
          { word: 'prego, entrate pure', meaning: 'please, come right in', partOfSpeech: 'phrase' },
          { word: 'trasferirsi', meaning: 'to relocate / move in', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          'Vorrei trasferirmi all’inizio del prossimo mese.',
          'Le spese condominiali sono incluse nell’affitto?',
          'A quanto ammonta la caparra confirmatoria?',
        ],
      },
    ],
    culture: [
      {
        id: 'culture-dinner',
        title: 'Sunday Family Pranzo in Tuscany',
        description: 'Savor homemade ragù, compliment Nonna, and engage in hearty lively conversation.',
        personaName: 'Nonna Rosa',
        personaRole: 'Affettuosa Matriarca',
        initialGreeting: 'Amore mio! Vieni a tavola, la pasta è già pronta e calda! Hai fame? Raccontami tutto della tua settimana!',
        initialTranslation: 'My love! Come to the table, the pasta is ready and hot! Are you hungry? Tell me everything about your week!',
        vocabHints: [
          { word: 'pronto', meaning: 'ready', partOfSpeech: 'adjective' },
          { word: 'raccontami', meaning: 'tell me', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          'Ciao Nonna! Ha un profumo straordinario.',
          'Ho tantissima fame, nessuno cucina come te!',
          'Mi insegni la tua ricetta segreta per il sugo?',
        ],
      },
    ],
    exam: [
      {
        id: 'exam-oral',
        title: 'CEFR CILS / CELI Oral Simulation',
        description: 'Structure an argumentative presentation in formal Italian with connectors.',
        personaName: 'Prof. Rossi',
        personaRole: 'Esaminatore Certificato',
        initialGreeting: 'Buongiorno. In questa prova orale valuteremo la sua scioltezza espressiva. Per favore, esponga la sua riflessione sul turismo sostenibile.',
        initialTranslation: 'Good morning. In this oral exam we will evaluate your fluency. Please present your reflection on sustainable tourism.',
        vocabHints: [
          { word: 'la scioltezza', meaning: 'fluency / ease', partOfSpeech: 'noun' },
          { word: 'sostenibile', meaning: 'sustainable', partOfSpeech: 'adjective' },
        ],
        suggestedReplies: [
          'Innanzitutto, ritengo fondamentale valorizzare i borghi storici.',
          'Da un lato ci sono opportunità economiche, dall’altro sfide ambientali.',
          'In conclusione, serve un equilibrio tra accoglienza e tutela del territorio.',
        ],
      },
    ],
    social: [
      {
        id: 'social-aperitivo',
        title: 'Milanese Navigli Aperitivo',
        description: 'Order spritz, sample buffet bites, and chat with local friends.',
        personaName: 'Matteo',
        personaRole: 'Amico Milanese',
        initialGreeting: 'Ciao! Fantastico che tu sia qui sui Navigli! Prendiamo uno spritz per iniziare? Ci sono tantissime cose buone al buffet!',
        initialTranslation: 'Hi! Fantastic that you are here by the canals! Shall we get a spritz to start? There are so many great bites at the buffet!',
        vocabHints: [
          { word: 'l’aperitivo', meaning: 'pre-dinner drinks & bites', partOfSpeech: 'noun' },
          { word: 'fantastico', meaning: 'fantastic', partOfSpeech: 'adjective' },
        ],
        suggestedReplies: [
          'Ciao Matteo! Uno spritz Aperol per me, grazie.',
          'L’atmosfera qui è meravigliosa, adoro questo posto.',
          'Cosa mi consigli di assaggiare al buffet?',
        ],
      },
    ],
  },

  Japanese: {
    travel: [
      {
        id: 'travel-izakaya',
        title: '居酒屋での注文 (Ordering at an Izakaya)',
        description: 'Order drinks, ask for chef specialties, state dietary preferences, and ask for the bill.',
        personaName: 'Kenji',
        personaRole: '居酒屋の店長 (Izakaya Master)',
        initialGreeting: 'いらっしゃいませ！何名様でしょうか？カウンター席へどうぞ！最初にお飲み物はいかがいたしましょうか？',
        initialTranslation: 'Welcome! How many guests? Please take a seat at the counter! What can I get you to drink first?',
        vocabHints: [
          { word: 'いらっしゃいませ', meaning: 'welcome (store greeting)', partOfSpeech: 'expression' },
          { word: '何名様', meaning: 'how many people', partOfSpeech: 'phrase' },
          { word: 'お飲み物', meaning: 'drinks', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'こんばんは！二人です。生ビールを二つお願いします。',
          'おすすめの料理は何ですか？',
          'お水を一杯いただけますか？',
        ],
      },
      {
        id: 'travel-airport',
        title: '成田・羽田空港での案内 (Airport & Luggage Assistance)',
        description: 'Confirm transit trains, report delayed luggage, and ask for directions.',
        personaName: 'Yuki',
        personaRole: '空港案内スタッフ (Airport Concierge)',
        initialGreeting: 'こんにちは！何かお困りですか？パスポートと航空券を拝見できますでしょうか？',
        initialTranslation: 'Hello! Can I help you with anything? May I see your passport and flight ticket?',
        vocabHints: [
          { word: '航空券', meaning: 'airline ticket', partOfSpeech: 'noun' },
          { word: 'お困り', meaning: 'in need of help', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          '東京駅行きの成田エクスプレスはどこから乗れますか？',
          '預けたスーツケースが見つかりません。',
          '観光で二週間滞在する予定です。',
        ],
      },
    ],
    work: [
      {
        id: 'work-meeting',
        title: 'ビジネス朝会・進捗報告 (Morning Standup Alignment)',
        description: 'Introduce your project priorities using polite business Japanese (Keigo).',
        personaName: 'Sato',
        personaRole: 'プロジェクトリーダー (Project Manager)',
        initialGreeting: 'お疲れ様です。本日の定例ミーティングを始めましょう。今週の進捗状況とタスクを共有していただけますか？',
        initialTranslation: 'Thank you for your hard work. Let us start today’s sync meeting. Could you share this week’s progress and priorities?',
        vocabHints: [
          { word: 'お疲れ様です', meaning: 'thank you for your hard work', partOfSpeech: 'greeting' },
          { word: '進捗状況', meaning: 'progress status', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'お疲れ様です。今週は新機能の実装を担当しております。',
          '資料を画面共有いたしますので、ご確認をお願いします。',
          'スケジュールの調整についてご相談がございます。',
        ],
      },
    ],
    relocation: [
      {
        id: 'relo-apartment',
        title: '不動産屋での内見 (Apartment Viewing in Tokyo)',
        description: 'Ask about rent, key money (Reikin), security deposit (Shikikin), and moving dates.',
        personaName: 'Takahashi',
        personaRole: '不動産エージェント (Real Estate Agent)',
        initialGreeting: 'こちらへどうぞ！南向きで日当たりがとても良いお部屋です。お引越しはいつ頃をご希望でしょうか？',
        initialTranslation: 'Please step this way! It is south-facing with great sunlight. Around when are you hoping to move in?',
        vocabHints: [
          { word: '日当たり', meaning: 'sunlight exposure', partOfSpeech: 'noun' },
          { word: 'お引越し', meaning: 'moving residence', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          '来月の初め頃に入居を希望しています。',
          '敷金と礼金はいくらになりますか？',
          '最寄りの駅までは歩いて何分くらいですか？',
        ],
      },
    ],
    culture: [
      {
        id: 'culture-dinner',
        title: '日本のお茶の間での食事 (Traditional Family Meal)',
        description: 'Politely praise home-cooked Japanese dishes, ask about preparation, and chat.',
        personaName: 'Obasan',
        personaRole: '温かいお母さん (Host Family Mother)',
        initialGreeting: 'おかえりなさい！今日のご飯はできたてのお鍋ですよ。たくさん召し上がってくださいね！今日はどんな一日でしたか？',
        initialTranslation: 'Welcome home! Today dinner is freshly prepared hot pot. Please eat lots! How was your day today?',
        vocabHints: [
          { word: 'おかえりなさい', meaning: 'welcome back', partOfSpeech: 'greeting' },
          { word: 'できたて', meaning: 'freshly made', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'ただいま戻りました！とてもいい匂いがしますね。',
          'いただきます！お出汁が本当に美味しいです。',
          '今日は街を散策して、とても楽しい一日でした。',
        ],
      },
    ],
    exam: [
      {
        id: 'exam-oral',
        title: 'JLPT N2/N1 & BJT 口頭表現対策 (Academic Interview)',
        description: 'Present logical viewpoints using formal conjunctions and polite speech.',
        personaName: 'Suzuki Sensei',
        personaRole: '日本語試験面接官 (Certified Examiner)',
        initialGreeting: 'それでは面接を始めます。現代社会におけるAIの活用について、ご自身の意見を述べてください。',
        initialTranslation: 'We will now begin the interview. Please state your personal opinion regarding the use of AI in modern society.',
        vocabHints: [
          { word: '面接', meaning: 'interview', partOfSpeech: 'noun' },
          { word: '活用', meaning: 'practical utilization', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'まず第一に、業務効率化の面で非常に有効だと考えます。',
          '一方で、個人のプライバシー保護という課題も存在します。',
          '結論として、適切なガイドラインを策定することが重要です。',
        ],
      },
    ],
    social: [
      {
        id: 'social-cafe',
        title: '渋谷のカフェでの雑談 (Tokyo Cafe Small Talk)',
        description: 'Chat about hobbies, anime, music, and weekend adventures with Japanese friends.',
        personaName: 'Daiki',
        personaRole: '東京の友人 (Local Friend)',
        initialGreeting: 'お待たせ！席空いててよかったね。何飲む？最近ハマってることとかある？',
        initialTranslation: 'Sorry to keep you waiting! Glad there was an open table. What are you drinking? Have you been into anything lately?',
        vocabHints: [
          { word: 'お待たせ', meaning: 'sorry to keep you waiting', partOfSpeech: 'phrase' },
          { word: 'ハマってる', meaning: 'really into / obsessed with', partOfSpeech: 'slang' },
        ],
        suggestedReplies: [
          'アイスラテにするよ！最近は日本語の勉強を頑張ってるんだ。',
          '先週末に京都へ旅行に行ってきたんだよ。すごく綺麗だった！',
          'おすすめの映画やアニメがあったら教えて！',
        ],
      },
    ],
  },

  Portuguese: {
    travel: [
      {
        id: 'travel-tasca',
        title: 'Ordering at a Traditional Lisbon Tasca',
        description: 'Order fresh seafood, pastel de nata, vinho verde, and ask for the bill.',
        personaName: 'Tiago',
        personaRole: 'Garçom & Anfitrião Alfacinha',
        initialGreeting: 'Boa noite e sejam bem-vindos à nossa Tasca! Têm mesa reservada ou procuram uma mesa para jantar esta noite?',
        initialTranslation: 'Good evening and welcome to our Tasca! Do you have a table reserved or are you looking for a dinner table tonight?',
        vocabHints: [
          { word: 'sejam bem-vindos', meaning: 'welcome', partOfSpeech: 'phrase' },
          { word: 'a mesa', meaning: 'the table', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Boa noite! Uma mesa para duas pessoas, por favor.',
          'Gostaríamos de sentar na esplanada ao ar livre.',
          'Qual é o prato do dia recomendado pelo chefe?',
        ],
      },
      {
        id: 'travel-airport',
        title: 'Lisbon Airport & Customs Assistance',
        description: 'Confirm transit gates, metro to center, and locate luggage claim.',
        personaName: 'Beatriz',
        personaRole: 'Agente de Bordo & Apoio ao Passageiro',
        initialGreeting: 'Olá, boa tarde! O seu passaporte e cartão de embarque, por favor. Qual é o motivo da sua viagem a Portugal?',
        initialTranslation: 'Hello, good afternoon! Your passport and boarding pass, please. What is the reason for your trip to Portugal?',
        vocabHints: [
          { word: 'cartão de embarque', meaning: 'boarding pass', partOfSpeech: 'noun' },
          { word: 'a viagem', meaning: 'the trip', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Estou a viajar a turismo durante duas semanas.',
          'A minha mala não apareceu no tapete, onde posso reclamar?',
          'Como posso apanhar o metro para o centro de Lisboa?',
        ],
      },
    ],
    work: [
      {
        id: 'work-meeting',
        title: 'Sprint Sync & Project Kickoff',
        description: 'Introduce your sprint commitments and deliverables in professional Portuguese.',
        personaName: 'Rodrigo',
        personaRole: 'Gerente de Produto & Lead',
        initialGreeting: 'Olá a todos e bem-vindos à nossa reunião de alinhamento. Poderias começar por apresentar as tuas prioridades para este sprint?',
        initialTranslation: 'Hello everyone and welcome to our alignment meeting. Could you start by presenting your priorities for this sprint?',
        vocabHints: [
          { word: 'alinhamento', meaning: 'sync / alignment', partOfSpeech: 'noun' },
          { word: 'as prioridades', meaning: 'priorities', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          'Olá Rodrigo, as minhas prioridades são o lançamento da nova funcionalidade.',
          'Obrigado pelo acolhimento, estou pronto para partilhar o meu ecrã.',
          'Podemos rever primeiro o cronograma de entregas?',
        ],
      },
    ],
    relocation: [
      {
        id: 'relo-apartment',
        title: 'Apartment Visit in Porto',
        description: 'Ask about lease terms, fiador (guarantor), security deposits, and utilities.',
        personaName: 'Sr. Silva',
        personaRole: 'Proprietário do Imóvel',
        initialGreeting: 'Entre, faça favor! Esta é a sala de estar, tem muita luz natural. Para quando estaria a pensar mudar-se?',
        initialTranslation: 'Come in, please! This is the living room, with lots of natural light. For when would you be planning to move in?',
        vocabHints: [
          { word: 'faça favor', meaning: 'please / go right ahead', partOfSpeech: 'phrase' },
          { word: 'mudar-se', meaning: 'to move residence', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          'Gostaria de mudar-me no início do próximo mês.',
          'As despesas de água e luz estão incluídas no valor da renda?',
          'Quantos meses de caução são necessários?',
        ],
      },
    ],
    culture: [
      {
        id: 'culture-dinner',
        title: 'Sunday Family Almoço',
        description: 'Compliment the bacalhau dish, ask for recipe secrets, and share stories.',
        personaName: 'Vovó Maria',
        personaRole: 'Matriarca Carinhosa',
        initialGreeting: 'Meu querido! Senta-te à mesa, o bacalhau com natas acabou de sair do forno! Tens muita fome? Conta-me como correu a semana!',
        initialTranslation: 'My dear! Sit at the table, the cream codfish just came out of the oven! Are you very hungry? Tell me how your week went!',
        vocabHints: [
          { word: 'acabou de sair', meaning: 'just came out of', partOfSpeech: 'phrase' },
          { word: 'conta-me', meaning: 'tell me', partOfSpeech: 'verb' },
        ],
        suggestedReplies: [
          'Olá Vovó! O cheiro está maravilhoso.',
          'Estou com muito apetite, a tua comida é a melhor do mundo!',
          'A semana correu muito bem, que bom estar aqui com a família.',
        ],
      },
    ],
    exam: [
      {
        id: 'exam-oral',
        title: 'CAPLE / Celpe-Bras Oral Defense',
        description: 'Argue a structured thesis using formal connectors and nuanced vocabulary.',
        personaName: 'Prof. Pereira',
        personaRole: 'Examinador Certificado',
        initialGreeting: 'Bom dia. Nesta prova oral avaliaremos a sua fluência e capacidade argumentativa. Por favor, apresente a sua opinião sobre energias renováveis.',
        initialTranslation: 'Good day. In this oral test we will evaluate your fluency and argumentative ability. Please present your view on renewable energy.',
        vocabHints: [
          { word: 'a fluência', meaning: 'fluency', partOfSpeech: 'noun' },
          { word: 'argumentativa', meaning: 'argumentative', partOfSpeech: 'adjective' },
        ],
        suggestedReplies: [
          'Em primeiro lugar, considero a transição energética indispensável.',
          'Por um lado temos desafios de investimento, por outro grandes benefícios ecológicos.',
          'Em conclusão, as políticas públicas desempenham um papel decisivo.',
        ],
      },
    ],
    social: [
      {
        id: 'social-miradouro',
        title: 'Sunset at Miradouro de Santa Catarina',
        description: 'Enjoy panoramic sunset views, drink a cold beverage, and chat with local friends.',
        personaName: 'Gonçalo',
        personaRole: 'Amigo Lisboeta',
        initialGreeting: 'Boas! Que bom que vieste ao Miradouro! Olha este pôr do sol sobre o Tejo. Queres uma cerveja fresca ou um sumo?',
        initialTranslation: 'Hey! So good that you came to the viewpoint! Look at this sunset over the Tagus river. Would you like a cold beer or a juice?',
        vocabHints: [
          { word: 'o pôr do sol', meaning: 'the sunset', partOfSpeech: 'noun' },
          { word: 'fresca', meaning: 'cold / chilled', partOfSpeech: 'adjective' },
        ],
        suggestedReplies: [
          'Boas Gonçalo! Uma cerveja fresca para mim, por favor.',
          'A vista daqui é absolutamente deslumbrante!',
          'É a minha primeira vez neste miradouro, adorei a recomendação.',
        ],
      },
    ],
  },

  Mandarin: {
    travel: [
      {
        id: 'travel-restaurant',
        title: '地道餐馆点餐 (Ordering at a Traditional Restaurant)',
        description: 'Order regional dishes, specify spiciness level, ask for drinks, and request the bill.',
        personaName: 'Wang',
        personaRole: '餐馆领班服务员 (Restaurant Server & Host)',
        initialGreeting: '您好，欢迎光临！请问几位？里面请坐，这是我们的特色菜单。请问先喝点什么茶水或饮料？',
        initialTranslation: 'Hello, welcome! How many in your party? Please have a seat inside, here is our specialty menu. What tea or drinks would you like to start with?',
        vocabHints: [
          { word: '欢迎光临', meaning: 'welcome', partOfSpeech: 'greeting' },
          { word: '特色菜单', meaning: 'specialty menu', partOfSpeech: 'noun' },
          { word: '茶水', meaning: 'tea water / refreshments', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          '您好！两位，请给我们来一壶普洱茶，谢谢。',
          '请问你们店里的招牌菜是什么？',
          '请问这道菜辣不辣？我们少放一点辣。',
        ],
      },
      {
        id: 'travel-airport',
        title: '机场与高铁换乘服务 (Airport & High-Speed Rail Transit)',
        description: 'Check ticket connections, locate luggage retrieval, and confirm gate departure times.',
        personaName: 'Lin',
        personaRole: '客运服务人员 (Transit Customer Service)',
        initialGreeting: '您好！请出示您的证件和行程单。请问您需要办理行李托运还是咨询换乘路线？',
        initialTranslation: 'Hello! Please show your ID and itinerary. Do you need luggage check-in or transit direction inquiries?',
        vocabHints: [
          { word: '证件', meaning: 'identification documents', partOfSpeech: 'noun' },
          { word: '行李托运', meaning: 'checked baggage', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          '您好，我需要在北京换乘高铁，请问从哪里出站？',
          '我的托运行李没有在转盘上找到，请问哪里能登记？',
          '我来中国旅游两周，请问去市区怎么坐机场大巴最方便？',
        ],
      },
    ],
    work: [
      {
        id: 'work-meeting',
        title: '项目周会与工作汇报 (Sprint Alignment Meeting)',
        description: 'Share project updates, clarify deliverables, and coordinate across functional teams.',
        personaName: 'Chen',
        personaRole: '项目总监 (Project Director)',
        initialGreeting: '大家下午好，感谢准时参加我们的项目周会。请问今天先由哪位同事汇报本周的重点进展和交付节点？',
        initialTranslation: 'Good afternoon everyone, thank you for joining our project weekly meeting on time. Who would like to start reporting this week’s key progress and delivery milestones?',
        vocabHints: [
          { word: '周会', meaning: 'weekly meeting', partOfSpeech: 'noun' },
          { word: '交付节点', meaning: 'delivery milestones', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          '陈总下午好，我先来汇报一下新版核心功能的上线准备情况。',
          '我们团队这周已经完成了全部测试，随时可以进行联调。',
          '关于上线排期，我想和技术团队再确认一下具体时间表。',
        ],
      },
    ],
    relocation: [
      {
        id: 'relo-apartment',
        title: '小区看房与租赁咨询 (Apartment Rental Viewing)',
        description: 'Inquire about monthly rent, utility bills, lease duration, and neighborhood subway access.',
        personaName: 'Lao Wang',
        personaRole: '热心房东 (Property Landlord)',
        initialGreeting: '请进请进！这就是客厅，南北通透，采光特别好。请问你打算什么时候搬进来入住？',
        initialTranslation: 'Please come in! This is the living room, north-south ventilated with great natural light. When are you planning to move in?',
        vocabHints: [
          { word: '南北通透', meaning: 'well-ventilated north to south', partOfSpeech: 'idiom' },
          { word: '采光', meaning: 'natural lighting', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          '房东您好，我打算下个月初搬进来。',
          '请问水电费和物业费是怎么收取的？',
          '押金一般交多少个月？租期可以签一年吗？',
        ],
      },
    ],
    culture: [
      {
        id: 'culture-dinner',
        title: '温馨家庭聚餐 (Heartwarming Family Dinner)',
        description: 'Enjoy home cooking, compliment signature dishes, and share everyday life updates.',
        personaName: 'Nainai',
        personaRole: '慈祥的奶奶 (Loving Grandmother)',
        initialGreeting: '孩子快进来坐！红烧肉和清蒸鱼刚出锅，热气腾腾的。这星期工作累不累？快多吃点！',
        initialTranslation: 'Come on in and sit down! The braised pork and steamed fish just came out of the pot, piping hot. Were you tired from work this week? Eat plenty!',
        vocabHints: [
          { word: '刚出锅', meaning: 'just finished cooking', partOfSpeech: 'phrase' },
          { word: '热气腾腾', meaning: 'steaming hot', partOfSpeech: 'idiom' },
        ],
        suggestedReplies: [
          '奶奶好！闻起来太香了，最想念您做的红烧肉了！',
          '这星期挺充实的，看到您身体这么健康真开心。',
          '奶奶您也多吃点，回头您一定得教教我这道菜怎么做。',
        ],
      },
    ],
    exam: [
      {
        id: 'exam-oral',
        title: 'HSK 高等口语考试模拟 (HSK Oral Exam)',
        description: 'Deliver structured arguments, use advanced discourse connectors, and express clear conclusions.',
        personaName: 'Prof. Liu',
        personaRole: 'HSK 官方主考官 (Certified HSK Examiner)',
        initialGreeting: '考生你好。在本次口语考试中，我们将重点考察你的语言表达能力与逻辑连贯性。请谈谈你对人工智能如何改变现代生活的看法。',
        initialTranslation: 'Hello candidate. In this oral exam, we will focus on evaluating your expressive ability and logical coherence. Please discuss your view on how artificial intelligence changes modern life.',
        vocabHints: [
          { word: '逻辑连贯性', meaning: 'logical coherence', partOfSpeech: 'noun' },
          { word: '看法', meaning: 'view / perspective', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          '首先，我认为人工智能在很大程度上提高了各行各业的工作效率。',
          '然而，在带来便利的同时，我们也需要妥善应对数据安全等挑战。',
          '总而言之，科技应当服务于人类的共同福祉。',
        ],
      },
    ],
    social: [
      {
        id: 'social-tea',
        title: '新式茶饮店下午茶 (Tea House Afternoon Chat)',
        description: 'Try fruit tea, talk about modern urban life, movies, and travel recommendations.',
        personaName: 'Xiao Li',
        personaRole: '本地好友 (Urban Local Friend)',
        initialGreeting: '嗨！你到啦！我已经帮你占好窗边的位置了。他们家招牌芝士多肉葡萄特别好喝，你想喝点什么？',
        initialTranslation: 'Hey! You made it! I saved a window seat for you. Their signature cheese grape fruit tea is amazing, what would you like to drink?',
        vocabHints: [
          { word: '占座', meaning: 'save a seat', partOfSpeech: 'verb' },
          { word: '招牌', meaning: 'signature / house special', partOfSpeech: 'noun' },
        ],
        suggestedReplies: [
          '太棒了！我也想试一下你推荐的这款芝士多肉葡萄，半糖去冰！',
          '这家店环境真不错，周末人还挺多的。',
          '你最近在追什么好看的电视剧或电影吗？',
        ],
      },
    ],
  },
};

// Generic fallback list of goals
export const GOAL_OPTIONS: GoalOption[] = [
  {
    id: 'travel',
    title: 'Traveling & Hospitality',
    subtitle: 'Order food, navigate transit, book hotels & ask locals for directions',
    icon: 'Plane',
    description: 'Focus on high-utility spoken phrases, dining etiquette, hotel check-ins, and emergency navigation.',
    color: '#ff9600',
    scenarios: SCENARIO_CATALOG.Spanish.travel,
  },
  {
    id: 'work',
    title: 'Career & Professional Life',
    subtitle: 'Client meetings, project updates, salary negotiations & networking',
    icon: 'Briefcase',
    description: 'Learn executive business vocabulary, professional email etiquette, presentation phrasing, and corporate diplomacy.',
    color: '#1cb0f6',
    scenarios: SCENARIO_CATALOG.Spanish.work,
  },
  {
    id: 'relocation',
    title: 'Relocation & Everyday Living',
    subtitle: 'Renting apartments, opening bank accounts, groceries & healthcare',
    icon: 'Home',
    description: 'Master everyday bureaucracy, utility setups, neighborhood socializing, and doctor consultations.',
    color: '#2ce080',
    scenarios: SCENARIO_CATALOG.Spanish.relocation,
  },
  {
    id: 'culture',
    title: 'Family, Heritage & Culture',
    subtitle: 'Connect with family members, family dinners & cultural traditions',
    icon: 'Heart',
    description: 'Deepen emotional connections, talk about memories, family recipes, and local festival celebrations.',
    color: '#ce82ff',
    scenarios: SCENARIO_CATALOG.Spanish.culture,
  },
  {
    id: 'exam',
    title: 'Exams & Academic Mastery',
    subtitle: 'DELE, DELF, JLPT, Goethe oral prep, essay defense & formal debate',
    icon: 'GraduationCap',
    description: 'Sharpen grammatical precision, connectors, argumentative structures, and formal registers for official certificates.',
    color: '#ff4b4b',
    scenarios: SCENARIO_CATALOG.Spanish.exam,
  },
  {
    id: 'social',
    title: 'Socializing & Making Friends',
    subtitle: 'Parties, cafes, hobbies, sports talk & building close friendships',
    icon: 'Sparkles',
    description: 'Learn contemporary slang, natural conversation rhythms, humor, and casual banter.',
    color: '#2ce080',
    scenarios: SCENARIO_CATALOG.Spanish.social,
  },
];

/**
 * Retrieves the scenarios localized specifically to the chosen TargetLanguage and LearningGoal
 */
export function getScenariosForLanguageAndGoal(
  lang: TargetLanguage,
  goal: LearningGoal
): ScenarioDefinition[] {
  const langKey = (lang in SCENARIO_CATALOG ? lang : 'Spanish') as TargetLanguage;
  const goalCatalog = SCENARIO_CATALOG[langKey] || SCENARIO_CATALOG.Spanish;
  const scenarios = goalCatalog[goal] || goalCatalog.travel || SCENARIO_CATALOG.Spanish.travel;
  return scenarios;
}

/**
 * Retrieves a single localized scenario by id
 */
export function getScenarioById(
  lang: TargetLanguage,
  goal: LearningGoal,
  scenarioId?: string
): ScenarioDefinition {
  const scenarios = getScenariosForLanguageAndGoal(lang, goal);
  if (!scenarioId) return scenarios[0];
  const found = scenarios.find((s) => s.id === scenarioId);
  return found || scenarios[0];
}

/**
 * Builds the authentic initial ChatMessage in the target language
 */
export function getInitialMessageForScenario(
  lang: TargetLanguage,
  goal: LearningGoal,
  scenarioId?: string
): ChatMessage {
  const scenario = getScenarioById(lang, goal, scenarioId);
  return {
    id: 'msg-0',
    role: 'assistant',
    content: scenario.initialGreeting,
    translation: scenario.initialTranslation,
    timestamp: Date.now(),
    vocabHints: scenario.vocabHints,
    suggestedReplies: scenario.suggestedReplies,
  };
}

/**
 * Generates Duolingo curriculum units localized to the target language and goal
 */
export function generateCurriculumForObjective(
  lang: TargetLanguage,
  goal: LearningGoal,
  recommendedModuleIds: string[] = []
): CurriculumUnit[] {
  // Key phrases per language for Guidebook
  const guidePhrases: Record<TargetLanguage, { phrase1: string; t1: string; phrase2: string; t2: string; phrase3: string; t3: string }> = {
    Spanish: {
      phrase1: '¿Dónde está la puerta de embarque?',
      t1: 'Where is the boarding gate?',
      phrase2: '¿Me trae la cuenta, por favor?',
      t2: 'Could you bring me the bill, please?',
      phrase3: 'Quisiera probar la especialidad.',
      t3: 'I would like to try the specialty.',
    },
    French: {
      phrase1: 'Où se trouve la porte d’embarquement ?',
      t1: 'Where is the boarding gate?',
      phrase2: 'L’addition, s’il vous plaît.',
      t2: 'The bill, please.',
      phrase3: 'Je voudrais essayer le plat du jour.',
      t3: 'I would like to try the daily special.',
    },
    German: {
      phrase1: 'Wo ist der Flugsteig / das Gate?',
      t1: 'Where is the boarding gate?',
      phrase2: 'Die Rechnung bitte.',
      t2: 'The bill please.',
      phrase3: 'Ich möchte die Spezialität des Hauses probieren.',
      t3: 'I would like to try the house specialty.',
    },
    Italian: {
      phrase1: 'Dov’è il gate d’imbarco?',
      t1: 'Where is the boarding gate?',
      phrase2: 'Ci porta il conto, per favore?',
      t2: 'Could you bring us the bill, please?',
      phrase3: 'Vorrei provare la specialità della casa.',
      t3: 'I would like to try the house specialty.',
    },
    Japanese: {
      phrase1: '搭乗口はどちらですか？',
      t1: 'Which way is the boarding gate?',
      phrase2: 'お会計をお願いします。',
      t2: 'Check please.',
      phrase3: '本日のおすすめをお願いします。',
      t3: 'I would like the daily recommendation.',
    },
    Portuguese: {
      phrase1: 'Onde fica a porta de embarque?',
      t1: 'Where is the boarding gate?',
      phrase2: 'Pode trazer a conta, por favor?',
      t2: 'Could you bring the bill, please?',
      phrase3: 'Gostaria de experimentar a especialidade.',
      t3: 'I would like to try the specialty.',
    },
    Mandarin: {
      phrase1: '请问登机口在哪个方向？',
      t1: 'Which direction is the boarding gate?',
      phrase2: '服务员，请帮我们结一下账。',
      t2: 'Server, please bring us the bill.',
      phrase3: '我想尝一下你们的特色招牌菜。',
      t3: 'I would like to try your signature specialty.',
    },
  };

  const p = guidePhrases[lang] || guidePhrases.Spanish;

  if (goal === 'travel') {
    return [
      {
        id: 'unit-travel-1',
        unitNumber: 1,
        title: `${lang} Airport Transit & Navigation`,
        description: `Navigate airport customs, baggage claim, and train terminals in ${lang}.`,
        colorScheme: 'green',
        guidebookTopic: `Essential ${lang} Transit Phrases`,
        guidebookKeyPhrases: [
          { phrase: p.phrase1, translation: p.t1 },
          { phrase: p.phrase3, translation: p.t3 },
        ],
        nodes: [
          {
            id: 'node-t1',
            title: 'Passport & Security Checks',
            type: 'lesson',
            stars: 3,
            isCompleted: true,
            isUnlocked: true,
            xp: 20,
            description: `Vocabulary for passport control and declarations in ${lang}.`,
          },
          {
            id: 'node-t2',
            title: 'Baggage Claim Dilemmas',
            type: 'lesson',
            stars: 2,
            isCompleted: true,
            isUnlocked: true,
            xp: 25,
            description: 'Reporting missing luggage tags and describing bag colors.',
          },
          {
            id: 'node-t3',
            title: 'Airport Roleplay Story',
            type: 'story',
            stars: 1,
            isCompleted: false,
            isUnlocked: true,
            xp: 30,
            description: `Interactive terminal drama with the ${lang} transit inspector.`,
          },
          {
            id: 'node-t4',
            title: 'Unit 1 Milestone Chest',
            type: 'chest',
            stars: 0,
            isCompleted: false,
            isUnlocked: false,
            xp: 50,
            description: 'Claim 50 bonus gems and unlock next transit unit.',
          },
        ],
      },
      {
        id: 'unit-travel-2',
        unitNumber: 2,
        title: `${lang} Dining & The Perfect Order`,
        description: `Order specialties, ask for drinks, and handle the check seamlessly in ${lang}.`,
        colorScheme: 'amber',
        guidebookTopic: `${lang} Restaurant Etiquette & Polite Requests`,
        guidebookKeyPhrases: [
          { phrase: p.phrase2, translation: p.t2 },
          { phrase: p.phrase3, translation: p.t3 },
        ],
        nodes: [
          {
            id: 'node-t5',
            title: 'Polite Requests & Softening Modals',
            type: 'lesson',
            stars: 1,
            isCompleted: false,
            isUnlocked: true,
            isRecommendedByAI: recommendedModuleIds.includes('mod-1') || true,
            xp: 30,
            description: `Polite conditional vs direct requests in ${lang}.`,
          },
          {
            id: 'node-t6',
            title: 'Dietary Needs & Allergies',
            type: 'lesson',
            stars: 0,
            isCompleted: false,
            isUnlocked: true,
            xp: 25,
            description: 'Vegetarian, gluten-free, and nut allergy phrasing.',
          },
          {
            id: 'node-t7',
            title: `AI ${lang} Host Immersion`,
            type: 'tutor',
            stars: 0,
            isCompleted: false,
            isUnlocked: true,
            xp: 40,
            description: `Live verbal conversation in ${lang} with the local host.`,
          },
          {
            id: 'node-t8',
            title: 'Splitting the Bill & Tipping',
            type: 'checkpoint',
            stars: 0,
            isCompleted: false,
            isUnlocked: false,
            xp: 45,
            description: 'End-of-unit comprehensive restaurant checkpoint.',
          },
        ],
      },
    ];
  }

  if (goal === 'work') {
    return [
      {
        id: 'unit-work-1',
        unitNumber: 1,
        title: `${lang} Professional Introductions & Culture`,
        description: `Make a commanding first impression in ${lang} and join standup meetings.`,
        colorScheme: 'blue',
        guidebookTopic: `Formal Corporate Phrasing in ${lang}`,
        guidebookKeyPhrases: [
          { phrase: p.phrase3, translation: p.t3 },
        ],
        nodes: [
          {
            id: 'node-w1',
            title: 'Elevator Pitch & Role Overview',
            type: 'lesson',
            stars: 3,
            isCompleted: true,
            isUnlocked: true,
            xp: 25,
            description: `State responsibilities, department, and past experience in ${lang}.`,
          },
          {
            id: 'node-w2',
            title: 'Watercooler Coffee Chat',
            type: 'lesson',
            stars: 1,
            isCompleted: false,
            isUnlocked: true,
            xp: 25,
            description: 'Natural small talk with colleagues about sprints and weekends.',
          },
          {
            id: 'node-w3',
            title: 'AI Standup Simulation',
            type: 'tutor',
            stars: 0,
            isCompleted: false,
            isUnlocked: true,
            isRecommendedByAI: true,
            xp: 40,
            description: `Present your deliverables and blockers in ${lang}.`,
          },
        ],
      },
    ];
  }

  // Default relocation & everyday living
  return [
    {
      id: 'unit-relo-1',
      unitNumber: 1,
      title: `${lang} Everyday Living & Community`,
      description: `Decipher leases, speak with neighbors, and handle daily errands in ${lang}.`,
      colorScheme: 'green',
      guidebookTopic: `Everyday Living in ${lang}`,
      guidebookKeyPhrases: [
        { phrase: p.phrase2, translation: p.t2 },
      ],
      nodes: [
        {
          id: 'node-r1',
          title: 'Apartment Viewing & Lease Questions',
          type: 'lesson',
          stars: 2,
          isCompleted: true,
          isUnlocked: true,
          xp: 25,
          description: `Key rental inquiries and contract details in ${lang}.`,
        },
        {
          id: 'node-r2',
          title: 'AI Landlord Simulation',
          type: 'tutor',
          stars: 0,
          isCompleted: false,
          isUnlocked: true,
          xp: 40,
          description: `Interactive conversation with the local landlord in ${lang}.`,
        },
      ],
    },
  ];
}
