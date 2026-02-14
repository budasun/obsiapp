import { GlossaryTerm, MiracleQuestion, CommunityPost } from './types';

// Based on Chapter 12 of the book
export const GLOSSARY_DATA: GlossaryTerm[] = [
  {
    term: "Adenomiosis",
    definition: "El tejido que normalmente recubre el útero (endometrio) crece en la pared muscular del útero.",
    obsidianPerspective: "Se asocia con la necesidad de sanación profunda del útero y la liberación de 'memorias' o energía estancada en el músculo uterino. La obsidiana trabaja las sombras y el dolor crónico.",
    wikiUrl: "https://es.wikipedia.org/wiki/Adenomiosis",
    keywords: ["dolor", "sangrado", "endometrio", "pared muscular", "cólicos"]
  },
  {
    term: "Amenorrea Secundaria",
    definition: "Ausencia del periodo menstrual por tres o más ciclos consecutivos.",
    obsidianPerspective: "Ayuda a la mujer a 'recordar' su ciclo natural, reactivando la energía del centro reproductivo. Se vincula a la sanación de bloqueos emocionales profundos.",
    wikiUrl: "https://es.wikipedia.org/wiki/Amenorrea",
    keywords: ["ausencia", "regla", "menstruación", "ciclo", "bloqueo"]
  },
  {
    term: "Displasia Cervical (NIC)",
    definition: "Presencia de células anormales en el cuello uterino, a menudo causada por VPH (Virus del Papiloma Humano), que pueden ser precancerosas.",
    obsidianPerspective: "Generalmente asintomático. Se detecta con Papanicolau. La obsidiana actúa como una fuerte protectora y limpiadora de la energía negativa y tóxica. Se usa para apoyar la regeneración celular.",
    wikiUrl: "https://es.wikipedia.org/wiki/Neoplasia_intraepitelial_cervical",
    keywords: ["VPH", "virus", "papiloma", "cáncer", "cuello uterino", "cervix", "papanicolau"]
  },
  {
    term: "Dispareunia",
    definition: "Dolor persistente o recurrente en la zona genital antes, durante o después de la relación sexual.",
    obsidianPerspective: "Al ayudar a relajar el suelo pélvico y aumentar la conciencia corporal, puede facilitar la liberación de la tensión muscular y emocional asociada al dolor.",
    wikiUrl: "https://es.wikipedia.org/wiki/Dispareunia",
    keywords: ["dolor sexual", "coito", "sexo", "penetración", "tensión"]
  },
  {
    term: "Endometriosis",
    definition: "Crecimiento de tejido similar al endometrio fuera del útero.",
    obsidianPerspective: "El uso de la obsidiana se asocia con la liberación de dolor y memorias traumáticas, ayudando a 'desenraizar' la causa emocional de la inflamación.",
    wikiUrl: "https://es.wikipedia.org/wiki/Endometriosis",
    keywords: ["inflamación", "tejido", "fuera del útero", "dolor pélvico", "trauma"]
  },
  {
    term: "Mioma Uterino",
    definition: "Tumores benignos que crecen en la pared del útero.",
    obsidianPerspective: "La obsidiana se asocia con la disolución de 'nudos' emocionales y físicos. Se utiliza para ayudar a reducir o mantener a raya el crecimiento de estas masas.",
    wikiUrl: "https://es.wikipedia.org/wiki/Mioma_uterino",
    keywords: ["fibromas", "tumores", "benignos", "bultos", "masas", "nudos"]
  },
  {
    term: "SOP (Síndrome de Ovario Poliquístico)",
    definition: "Trastorno hormonal común caracterizado por niveles elevados de andrógenos y quistes en los ovarios.",
    obsidianPerspective: "La obsidiana puede ayudar a la mujer a reconectar con su ciclo y aceptar su poder creativo, equilibrando la energía hormonal.",
    wikiUrl: "https://es.wikipedia.org/wiki/S%C3%ADndrome_de_ovario_poliqu%C3%ADstico",
    keywords: ["quistes", "hormonas", "acné", "vello", "irregular", "infertilidad"]
  },
  {
    term: "Vaginismo",
    definition: "Contracción involuntaria de los músculos del suelo pélvico alrededor de la vagina, impidiendo la penetración.",
    obsidianPerspective: "Se asocia a miedo inconsciente. El huevo ayuda a ganar control y relajar progresivamente la musculatura del suelo pélvico, rompiendo el ciclo de miedo-contracción.",
    wikiUrl: "https://es.wikipedia.org/wiki/Vaginismo",
    keywords: ["contracción", "miedo", "penetración", "cerrado", "dolor", "imposible"]
  }
];

// Based on Milton Erickson technique mentioned in requirements
export const MIRACLE_QUESTIONS: MiracleQuestion[] = [
  {
    question: "Si esta noche, mientras duermes, ocurriera un milagro y tu dolor desapareciera, ¿qué harías diferente mañana?",
    theme: "Proyección de Sanación"
  },
  {
    question: "Imagina que tu útero pudiera hablarte claramente sin dolor. ¿Qué crees que te estaría pidiendo que cambies en tu rutina?",
    theme: "Escucha Somática"
  },
  {
    question: "Si tu energía creativa fluyera sin bloqueos, ¿qué proyecto estarías empezando hoy mismo?",
    theme: "Creatividad Fértil"
  },
  {
    question: "Si pudieras ver tu síntoma como un maestro y no como un enemigo, ¿qué lección crees que te trae?",
    theme: "Reencuadre Sistémico"
  }
];

// Based on Chapter 11
export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: '1',
    author: 'Ana M.',
    content: '¡Adiós, cólicos! Llevo usándolo casi un mes y, ¡sorpresa!, cuando me bajó la regla, los cólicos desaparecieron. Es magia.',
    tags: ['Testimonio', 'Físico', 'Cólicos'],
    likes: 24,
    timestamp: 'Hace 2 horas',
    comments: [
      { id: 'c1', author: 'Maria L.', content: '¡Qué maravilla! A mí me pasó igual al tercer mes.', timestamp: 'Hace 1 hora' },
      { id: 'c2', author: 'Sofía G.', content: 'Gracias por compartir, me das esperanza.', timestamp: 'Hace 30 min' }
    ]
  },
  {
    id: '2',
    author: 'Lucía R.',
    content: 'Tuve un sueño muy lúcido donde entraba a una cueva llena de cristales. Sentí que recuperaba una parte de mí que había perdido.',
    tags: ['Sueños', 'Inconsciente'],
    likes: 15,
    timestamp: 'Hace 5 horas',
    comments: []
  },
  {
    id: '3',
    author: 'Carla S.',
    content: 'Mi humor cambió un montón. Antes andaba enojadísima, ahora siento más paciencia y tolerancia. ¡Me encanta!',
    tags: ['Emocional', 'Equilibrio'],
    likes: 32,
    timestamp: 'Ayer',
    comments: [
      { id: 'c3', author: 'Elena P.', content: 'La obsidiana mueve todo eso, ¡sigue así!', timestamp: 'Ayer' }
    ]
  }
];

// Based on Chapter 5 (Archetypes)
export const CHATBOT_SYSTEM_INSTRUCTION = `
Eres la "Consejera Osiris", una terapeuta virtual experta en psicología femenina, arquetipos jungianos y el uso del huevo de obsidiana.
Tu base de conocimiento proviene del libro "Cómo usar el Huevo de Obsidiana".

Instrucciones de Personalidad:
1.  **Enfoque:** Terapia Breve, Jungiana y Sistémica.
2.  **Tono:** Empático, místico, acogedor pero profesional.
3.  **Arquetipos (Capítulo 5):**
    *   Si la usuaria está ovulando: Háblale desde el arquetipo de la **Madre** (nutrición, creación).
    *   Si está pre-menstrual: Háblale desde la **Hechicera/Chamana** (verdad, corte, sombra).
    *   Si está menstruando: Háblale desde la **Bruja/Anciana** (retiro, sabiduría, descanso).
    *   Si está pre-ovulatoria: Háblale desde la **Doncella** (energía, inicios, acción).

Objetivos:
- Ayudar a integrar la "Sombra" (aquello reprimido en el inconsciente).
- Guiar en el uso seguro del huevo de obsidiana (limpieza, tiempos de uso).
- Interpretar emociones como mensajes del cuerpo/útero.
- NUNCA des consejos médicos estrictos. Siempre deriva al ginecólogo ante síntomas físicos graves.

Si te preguntan por riesgos, menciona la importancia de la limpieza y el acompañamiento profesional si hay traumas fuertes (Capítulo 6).
`;

// Based on Chapter 7 (Dreams)
export const DREAM_ANALYSIS_SYSTEM_INSTRUCTION = `
Actúa como una experta en interpretación de sueños basada en el Capítulo 7 del libro "Cómo usar el Huevo de Obsidiana".
Tu objetivo NO es dar significados de diccionario, sino encontrar la relación con el **Inconsciente Uterino**.

Puntos clave a analizar:
1.  **Símbolos de la Sombra:** Animales subterráneos, figuras oscuras, persecuciones (representan lo que se está liberando).
2.  **Espacios:** Cuevas, sótanos, casas viejas (representación del útero).
3.  **Colores:** Especialmente rojo (vida/sangre), negro (vacío fértil/obsidiana).
4.  **Agua:** Estado de las emociones.

Estructura tu respuesta:
- **Espejo del Inconsciente:** ¿Qué está tratando de mostrarte tu sombra?
- **Mensaje del Útero:** ¿Qué emoción reprimida se está moviendo?
- **Acción Sugerida:** Una pequeña meditación o pregunta para reflexionar.
`;

export const MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION = `
Actúa como una Terapeuta Holística Avanzada. Tu objetivo es tomar la respuesta del usuario a la "Pregunta Milagro" y crear un plan de acción transformador.
Debes integrar tres escuelas de pensamiento:
1. **Psicomagia (Alejandro Jodorowsky):** Actos simbólicos, teatrales y poéticos para hablarle al inconsciente.
2. **Bioenergética (Alexander Lowen):** Ejercicios corporales para liberar la "coraza muscular" y la tensión pélvica.
3. **Terapia Cognitivo Conductual (TCC):** Pasos conductuales pequeños, lógicos y reforzables.

Estructura tu respuesta en este formato exacto (usa Markdown):

### 🎯 Objetivo Cristalizado
(Resume en una frase la esencia de lo que el usuario desea lograr, ej: "Pasar del dolor a la libertad de movimiento").

### 🔮 Acto Psicomágico (Inconsciente)
(Describe un acto simbólico creativo. Ej: "Escribe tu dolor en un papel, átalo a una piedra y entiérralo", o "Pinta tu útero con acuarelas doradas").

### ⚡ Cuerpo y Bioenergética (Soma)
(Describe un ejercicio breve basado en Lowen. Ej: "Arco Bioenergético", "Golpear un cojín para sacar la rabia", o "Grounding/Enraizamiento descalza").

### 📋 Pasos Conductuales (Mente)
1. (Paso pequeño 1)
2. (Paso pequeño 2)
3. (Paso pequeño 3)

Mantén el tono inspirador, sanador y empoderante.
`;

// Menstrual Cycle Phase Details (Based on Chapter 4 & 5)
export const PHASE_DETAILS = {
  menstrual: {
    title: 'Fase Menstrual',
    archetype: 'La Anciana / Bruja',
    summary: 'Tiempo de introspección profunda y renovación.',
    description: 'Tu energía está volcada hacia adentro. Es el momento del "invierno personal" donde el cuerpo se limpia físicamente y el alma se vacía de lo que ya no sirve.',
    recommendations: {
      exercise: 'Evita ejercicios de alto impacto. Opta por estiramientos suaves, Yoga Nidra o simplemente descansar. Tu cuerpo necesita conservar energía.',
      energy: 'Nivel bajo. Prioriza el sueño y momentos de silencio.',
      practice: 'Limpieza del huevo de obsidiana y meditación de vacío.'
    }
  },
  follicular: {
    title: 'Fase Folicular',
    archetype: 'La Doncella',
    summary: 'Renacimiento, claridad y nuevos comienzos.',
    description: 'La energía comienza a subir. Te sientes más dinámica, analítica y lista para planificar e iniciar proyectos. Es la "primavera" de tu ciclo.',
    recommendations: {
      exercise: 'Excelente momento para cardio, fuerza y aprender nuevas rutinas deportivas. Tienes mayor resistencia.',
      energy: 'Nivel alto y enfocado. Buena capacidad de concentración.',
      practice: 'Establecimiento de propósitos con la obsidiana.'
    }
  },
  ovulatory: {
    title: 'Fase Ovulatoria',
    archetype: 'La Madre',
    summary: 'Plenitud, comunicación y magnetismo.',
    description: 'Momento de máxima apertura hacia el exterior. Te sientes más empática y con ganas de socializar. Es el "verano" radiante de tu ciclo.',
    recommendations: {
      exercise: 'Actividades grupales, baile o deportes sociales. Te sientes flexible y con energía expansiva.',
      energy: 'Nivel máximo. Magnetismo personal incrementado.',
      practice: 'Meditación de gratitud y conexión con la fertilidad (creativa o biológica).'
    }
  },
  luteal: {
    title: 'Fase Lútea',
    archetype: 'La Hechicera',
    summary: 'Intuición, Verdad y Preparación.',
    description: 'La energía se vuelve crítica e intuitiva. Es el momento de identificar qué ajustes necesitas en tu vida. La creatividad es más libre y salvaje.',
    recommendations: {
      exercise: 'Baja la intensidad. Pilates, largas caminatas o natación suave. Puedes sentirte más pesada.',
      energy: 'Nivel descendente e introspectivo. Posible irritabilidad si no se escucha la necesidad de soledad.',
      practice: 'Trabajo de sombra con la obsidiana para liberar tensiones.'
    }
  }
};