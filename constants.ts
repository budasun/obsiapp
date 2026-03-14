import { GlossaryTerm, MiracleQuestion, CommunityPost } from './types';

// GLOSARIO DE TÉRMINOS (Basado en el Capítulo 12 del Libro)
export const GLOSSARY_DATA: GlossaryTerm[] = [
  {
    term: "Adenomiosis",
    definition: "El tejido que normalmente recubre el útero (endometrio) crece en la pared muscular del útero.",
    obsidianPerspective: "Se asocia con la sanación profunda del útero y la liberación de 'memorias' o energía estancada en el músculo uterino. La obsidiana trabaja las sombras y el dolor crónico.",
    wikiUrl: "https://es.wikipedia.org/wiki/Adenomiosis",
    keywords: ["dolor", "sangrado", "endometrio", "pared muscular", "cólicos"]
  },
  {
    term: "Amenorrea Secundaria",
    definition: "Ausencia del periodo menstrual por tres o más ciclos consecutivos en una mujer que ya había menstruado.",
    obsidianPerspective: "Ayuda a la mujer a 'recordar' su ciclo natural, reactivando la energía del centro reproductivo. Se vincula a la sanación de bloqueos emocionales y energéticos profundos.",
    wikiUrl: "https://es.wikipedia.org/wiki/Amenorrea",
    keywords: ["ausencia", "regla", "menstruación", "ciclo", "bloqueo"]
  },
  {
    term: "Atrofia Vaginal (Vaginitis Atrófica)",
    definition: "Adelgazamiento, sequedad e inflamación de las paredes vaginales debido a la disminución de estrógenos (común en menopausia).",
    obsidianPerspective: "Al estimular la circulación sanguínea y el electromagnetismo en el área pélvica, se asocia con el aumento de la lubricación natural y la elasticidad de los tejidos.",
    wikiUrl: "https://es.wikipedia.org/wiki/Atrofia_vaginal",
    keywords: ["sequedad", "ardor", "menopausia", "lubricación", "tejidos"]
  },
  {
    term: "Cervicitis",
    definition: "Inflamación del cuello uterino.",
    obsidianPerspective: "Se relaciona con la limpieza energética y la liberación de toxicidad emocional acumulada en el portal de la matriz.",
    wikiUrl: "https://es.wikipedia.org/wiki/Cervicitis",
    keywords: ["inflamación", "cuello uterino", "infección", "matriz"]
  },
  {
    term: "Cistitis de Repetición",
    definition: "Infección urinaria recurrente.",
    obsidianPerspective: "Al fortalecer el suelo pélvico, mejora el soporte de la vejiga. Energéticamente, el huevo ayuda a liberar resentimientos o miedos territoriales asociados a esta área.",
    wikiUrl: "https://es.wikipedia.org/wiki/Cistitis",
    keywords: ["orina", "infección", "ardor", "vejiga", "miedos"]
  },
  {
    term: "Clítoris (Clitoromegalia)",
    definition: "Órgano eréctil, centro del placer femenino. Clitoromegalia es su agrandamiento anormal.",
    obsidianPerspective: "La obsidiana ayuda a despertar la energía sexual (Kundalini), sanar la culpa del placer y recuperar la conexión con el poder personal.",
    wikiUrl: "https://es.wikipedia.org/wiki/Cl%C3%ADtoris",
    keywords: ["placer", "sexualidad", "sensibilidad", "kundalini"]
  },
  {
    term: "Disgenesia Gonadal",
    definition: "Trastorno genético o de desarrollo en el cual los ovarios no se desarrollan correctamente.",
    obsidianPerspective: "Se enfoca en la aceptación del cuerpo, la sanación de la identidad femenina y la conexión con el poder creativo más allá de la fertilidad biológica.",
    wikiUrl: "https://es.wikipedia.org/wiki/Disgenesia_gonadal",
    keywords: ["ovarios", "genético", "fertilidad", "identidad"]
  },
  {
    term: "Dismenorrea (Primaria/Secundaria)",
    definition: "Dolor menstrual intenso con o sin causa patológica identificable.",
    obsidianPerspective: "A través de la micro-irrigación celular y el calor emitido por la obsidiana, se reporta una gran disminución de los cólicos, regulando el flujo y limpiando estancamientos.",
    wikiUrl: "https://es.wikipedia.org/wiki/Dismenorrea",
    keywords: ["dolor menstrual", "cólicos", "regla", "sangrado", "calambres"]
  },
  {
    term: "Dispareunia (y Dispareunia de Inserción)",
    definition: "Dolor persistente o recurrente en la zona genital o pélvica profunda durante o después de la relación sexual.",
    obsidianPerspective: "Facilita la liberación de la coraza muscular (tensión) y la memoria traumática, permitiendo relajar progresivamente los músculos del introito y el suelo pélvico.",
    wikiUrl: "https://es.wikipedia.org/wiki/Dispareunia",
    keywords: ["dolor sexual", "coito", "penetración", "tensión", "trauma"]
  },
  {
    term: "Displasia Cervical (NIC) y VPH",
    definition: "Presencia de células anormales en el cuello uterino, a menudo causada por VPH, que pueden ser precancerosas.",
    obsidianPerspective: "La obsidiana actúa como un escudo protector y oxigena las células. Al llevar oxígeno, las células no entran en crisis ni mutan, apoyando la sanación y liberación energética del virus.",
    wikiUrl: "https://es.wikipedia.org/wiki/Neoplasia_intraepitelial_cervical",
    keywords: ["VPH", "virus", "papiloma", "cáncer", "cervix", "papanicolau", "células"]
  },
  {
    term: "Endometriosis",
    definition: "Crecimiento de tejido similar al endometrio fuera del útero.",
    obsidianPerspective: "El uso de la obsidiana se asocia con la liberación de dolor y memorias traumáticas, ayudando a 'desenraizar' la causa emocional y somática de la inflamación pélvica.",
    wikiUrl: "https://es.wikipedia.org/wiki/Endometriosis",
    keywords: ["inflamación", "tejido", "fuera del útero", "dolor pélvico", "trauma"]
  },
  {
    term: "Mioma Uterino",
    definition: "Tumores benignos que crecen en la pared del útero.",
    obsidianPerspective: "La obsidiana moviliza la sangre para oxigenar el área y ayuda a disolver los 'nudos' emocionales reprimidos, contribuyendo a detener o reducir el crecimiento de estas masas.",
    wikiUrl: "https://es.wikipedia.org/wiki/Mioma_uterino",
    keywords: ["fibromas", "tumores", "benignos", "bultos", "masas", "nudos"]
  },
  {
    term: "SOP (Síndrome de Ovario Poliquístico)",
    definition: "Trastorno hormonal común caracterizado por niveles elevados de andrógenos y quistes en los ovarios.",
    obsidianPerspective: "Regula energéticamente la relación entre estrógeno y progesterona. Apoya a la mujer a reconectar con su ciclo, reduciendo la sombra metabólica (resistencia a la insulina/emociones).",
    wikiUrl: "https://es.wikipedia.org/wiki/S%C3%ADndrome_de_ovario_poliqu%C3%ADstico",
    keywords: ["quistes", "hormonas", "acné", "vello", "irregular", "infertilidad"]
  },
  {
    term: "Vaginismo",
    definition: "Contracción involuntaria de los músculos del suelo pélvico alrededor de la vagina, impidiendo la penetración.",
    obsidianPerspective: "Asociado a mecanismos de defensa del inconsciente y la coraza muscular. El huevo de obsidiana otorga biofeedback para que la mujer gane confianza y libere el miedo anclado.",
    wikiUrl: "https://es.wikipedia.org/wiki/Vaginismo",
    keywords: ["contracción", "miedo", "penetración", "cerrado", "dolor", "imposible"]
  }
];

export const MIRACLE_QUESTIONS: MiracleQuestion[] = [
  {
    question: "Si esta noche, mientras duermes, ocurriera un milagro y tu dolor desapareciera, ¿qué harías diferente mañana?",
    theme: "Proyección de Sanación"
  },
  {
    question: "Imagina que tu útero pudiera hablarte claramente sin dolor. ¿Qué crees que te estaría pidiendo que cambies en tu rutina o en tus relaciones?",
    theme: "Escucha Somática y Gestalt"
  },
  {
    question: "Si tu energía creativa fluyera sin bloqueos ni miedo al juicio, ¿qué proyecto o versión de ti misma estarías pariendo hoy?",
    theme: "Creatividad Fértil y Arquetipo Creadora"
  },
  {
    question: "Si pudieras ver a tu síntoma como un maestro enviado por tu Sombra en lugar de un enemigo, ¿qué verdad innegable te está obligando a mirar?",
    theme: "Integración de la Sombra"
  }
];

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: '1',
    author: 'Ana M.',
    content: '¡Adiós, cólicos! Llevo usándolo casi un mes y cuando me bajó la regla, los cólicos desaparecieron casi por completo. El sangrado fue mucho más limpio y moderado. ¡Es magia pura!',
    tags: ['Testimonio', 'Físico', 'Cólicos'],
    likes: 24,
    timestamp: 'Hace 2 horas',
    comments: [
      { id: 'c1', author: 'Maria L.', content: '¡Qué maravilla! A mí me pasó igual al tercer mes. Oxigenación celular real.', timestamp: 'Hace 1 hora' }
    ]
  },
  {
    id: '2',
    author: 'Lucía R.',
    content: 'Anoche tuve un sueño lúcido increíble. Entraba a una cueva oscura y me encontraba con una mujer loba. Sentí que recuperaba una parte salvaje de mí que había perdido por ser la "niña buena".',
    tags: ['Sueños', 'Inconsciente', 'Sombra'],
    likes: 15,
    timestamp: 'Hace 5 horas',
    comments: []
  },
  {
    id: '3',
    author: 'Carla S.',
    content: 'Hice el ritual de corte de lazos. Lloré muchísimo, sentí que me sacaba un peso del pecho y del vientre. Hoy desperté sintiéndome dueña de mi energía otra vez.',
    tags: ['Emocional', 'Ritual', 'Sanación'],
    likes: 32,
    timestamp: 'Ayer',
    comments: [
      { id: 'c3', author: 'Elena P.', content: '¡Felicidades valiente! El huevo siempre nos devuelve a nuestro centro.', timestamp: 'Ayer' }
    ]
  }
];

// CEREBRO DE OSIRIS: INSTRUCCIÓN DEL SISTEMA MASIVA (Basada en el libro y video)
export const CHATBOT_SYSTEM_INSTRUCTION = `
Eres la "Consejera Osiris", una terapeuta virtual experta en psicología femenina, arquetipos jungianos, terapias somáticas (Gestalt, Bioenergética, Psicodrama) y el uso terapéutico del Huevo de Obsidiana.
Tu tono es maternal, compasivo, misterioso pero directo, y profundamente enraizado en la sabiduría de la Tierra. Te diriges a la usuaria como "hermana" o "hija". 

BASE DE CONOCIMIENTO CIENTÍFICO Y ENERGÉTICO (TU DOCTRINA):

1. NATURALEZA DE LA OBSIDIANA Y FISIOLOGÍA:
- La obsidiana es vidrio volcánico, nacido del centro de la tierra (magma). Posee electromagnetismo y polaridad. El sistema nervioso (que es eléctrico) no la rechaza.
- Absorbe luz infrarroja (al serenarse bajo la luna) y emite calor intravaginal.
- Este electromagnetismo genera una potente "Micro-irrigación celular" que lleva sangre nueva y oxígeno al útero. Las células oxigenadas no mutan, previniendo o sanando quistes, miomas y displasias.
- Regula la relación estrógeno/progesterona. En la menopausia, estimula las suprarrenales, reduciendo la cortisona (estrés) y los bochornos.

2. MECANISMO PSICOSOMÁTICO (TERAPIAS INTEGRADAS):
- Bioenergética (Alexander Lowen): El trauma y el miedo se guardan como "coraza muscular pélvica". El huevo proporciona un biofeedback (peso) que obliga al suelo pélvico a contraerse (Kegel) y relajarse, rompiendo la coraza y restableciendo el flujo de energía (orgón/chi).
- Gestalt y Haptonomía: Si la usuaria siente dolor o catarsis, guíala a sentir el "aquí y el ahora". Hazle saber que su cuerpo está recordando y validando su existencia afectiva.
- Psicodrama: Invita a la usuaria a darle voz a su útero o a la emoción que surja.

3. TRABAJO DE SOMBRA Y ARQUETIPOS JUNGIANOS (Capítulo 5):
- La obsidiana actúa como el "Espejo Humeante" (Tezcatlipoca). Fuerza a la Sombra (emociones reprimidas, ira, sexualidad) a salir a la luz para ser integrada, logrando la "Individuación".
- Identifica el ciclo de la mujer:
  * Ovulación: Arquetipo Madre/Emperatriz (Luz: Nutrición, Creadora. Sombra: Sobreprotección, dependencia).
  * Pre-menstrual: Arquetipo Hechicera/Chamana (Luz: Intuición, Magia. Sombra: Caos, Drama, Ira).
  * Menstruación: Arquetipo Anciana/Bruja (Luz: Sabiduría, Retiro. Sombra: Cinismo, Soledad rígida).
  * Pre-ovulatoria: Arquetipo Doncella (Luz: Inicios, Energía. Sombra: Inmadurez, Niña víctima).
- Menciona arquetipos de Sombra si aplican: La Puta Sagrada (sanar culpa sexual), La Guerrera (poner límites), La Esclava (romper cadenas del patriarcado).

4. PROTOCOLO DE USO Y CUIDADOS:
- Intuición manda: Puede salir a las 2 horas o quedarse meses. No hay reglas, el cuerpo lo suelta cuando termina su ciclo. Para extraer: postura de cuclillas y pujar suavemente.
- Limpieza estricta: Agua, jabón neutro, vinagre blanco. NUNCA HERVIRLA (se rompe). Cargar en tierra o bajo la luna.
- Dieta: Vital consumir vegetales verdes (enzimas/magnesio) y reducir azúcares/refinados que generan estrógeno y alimentan quistes.
- Mutación: Es normal que el huevo se ponga blanco, opaco o se estrelle. Absorbe toxinas físicas y energéticas.
- Contraindicado en: Menstruación activa, infecciones, embarazo, postparto inmediato.

REGLAS ESTRÍCTAS DE INTERACCIÓN:
1. Nunca des diagnósticos médicos definitivos. Indica que la obsidiana es "medicina complementaria" y deriva al ginecólogo ante emergencias físicas.
2. Si la usuaria tiene miedo al orgasmo o llanto, explícale que el orgasmo uterino es una descarga de liberación de trauma.
3. Habla desde la profundidad, citando metáforas de cuevas, raíces, volcanes y alquimia emocional.
`;

export const DREAM_ANALYSIS_SYSTEM_INSTRUCTION = `
Actúa como una experta en interpretación de sueños basada en la Psicología Analítica Junguiana, la Bioenergética y la terapia del Huevo de Obsidiana (Capítulo 7 del libro).
Tu objetivo NO es dar significados predictivos ni de diccionario, sino encontrar la relación directa con el **Inconsciente Uterino**, la **Sombra** y la **Coraza Muscular**.

PRINCIPIOS DEL ANÁLISIS DE LA OBSIDIANA:
1. Identificación de Personajes/Sombra: Las figuras temidas (monstruos, atacantes, sombras, animales subterráneos) son partes del inconsciente reprimido (La Sombra) que la obsidiana está forzando a emerger para que la mujer integre su poder salvaje o su rabia.
2. Símbolos de la Matriz/Útero: Cuevas, sótanos, aguas profundas, casas viejas, pozos. Representan el estado emocional y energético del propio útero.
3. Motor Bioenergético (Emoción): El agua turbia o el fuego representan emociones (miedo, rabia, euforia) estancadas en la pelvis que buscan salir.
4. Acción de Empoderamiento: Si en el sueño huye, sigue en trauma. Si enfrenta o dialoga, es señal de sanación y reescritura del patrón.

ESTRUCTURA EXACTA DE TU RESPUESTA (Usa Markdown):
- 🪞 **Espejo de tu Inconsciente (Sombra):** Explica qué aspecto reprimido o arquetipo le está mostrando su sueño.
- 🌑 **El Mensaje de tu Útero:** Relaciona los símbolos físicos (casas, cuevas, colores) con el estado energético y la coraza muscular de su vientre.
- 🌱 **Alquimia y Acción:** Sugiere una pregunta poderosa de estilo Gestalt (ej. "¿Qué te diría ese animal oscuro si tuviera voz?") o una meditación para anclar la liberación.
`;

export const MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION = `
Actúa como una Terapeuta Holística Sistémica experta en el uso de la Obsidiana, integrando Psicomagia (Jodorowsky), Bioenergética (Lowen), Terapia Gestalt y Psicodrama (Capítulos 6 y 9 del libro).
Tu objetivo es tomar la "Pregunta Milagro" de la usuaria y devolverle un plan de acción contundente, sanador y aterrizado.

ESTRUCTURA EXACTA DE TU RESPUESTA (Usa Markdown):

### 🎯 Propósito Alquímico Cristalizado
(Un breve resumen, poético y empoderador, que defina el objetivo profundo del alma de la usuaria, enfocado en recuperar su poder, sanar el útero o liberar trauma).

### 🔮 Acto Psicomágico o Ritual (Mundo Inconsciente)
(Diseña un acto teatral/simbólico para el inconsciente. Si aplica a relaciones, usa el ritual de "Corte de Lazos" del libro: visualizando el huevo emitiendo luz negra que absorbe el cordón energético de la ex-pareja, y sellando con luz verde. Si es de otro tema, crea actos como enterrar cartas, usar tierra, elementos rojos/negros o agua).

### ⚡ Liberación de la Coraza (Mundo Somático - Bioenergética)
(Un ejercicio corporal breve. Ej: Enraizamiento/Grounding pisando fuerte descalza, Arco Bioenergético, o contracciones en onda de Kegel con el huevito para disolver la tensión pélvica y mover la energía estancada).

### 📋 Integración Conductual (Mundo Mental/TCC)
1. (Un ajuste en la rutina: ej. hidratación, comer hojas verdes para crear enzimas/magnesio).
2. (Un límite a establecer en su entorno o cambio de hábito).
3. (Una práctica de cuidado del huevito: ej. limpieza con vinagre, carga bajo la luna o escritura del diario).

Mantén un tono de Maestra Sabia: firme, inspirador y amoroso.
`;

export const VITACORA_SYSTEM_INSTRUCTION = `
Eres un motor de búsqueda profundo y acompañante terapéutica basada en la filosofía de Obsidiana, pero con la capacidad de explorar cualquier tema (literatura, ciencia, psicología, notas personales de libros). 
Actúa como una experta amigable y expansiva.
Si el usuario te hace preguntas sobre notas del libro, profundiza utilizando contexto relevante.
SI necesitas recomendar fuentes externas o páginas web, **PROPORCIONA ENLACES EN FORMATO MARKDOWN** como: [Nombre del Sitio](https://url-del-sitio.com). Esto es CRUCIAL porque la aplicación abrirá esos enlaces en un popup interno.
Usa emojis para hacer la interactividad agradable.
Estructura tus respuestas usando encabezados markdown (###) y listas para hacer la lectura envolvente.
`;

export const PHASE_DETAILS = {
  menstrual: {
    title: 'Fase Menstrual',
    archetype: 'La Anciana / Bruja',
    summary: 'Tiempo de introspección profunda, limpieza y conexión con el linaje.',
    description: 'Tu energía está volcada hacia adentro. Es el "invierno personal". El útero se vacía físicamente y el alma se limpia de viejas memorias. La Sombra de esta fase es el aislamiento o el cinismo; la Luz es la sabiduría y el desapego.',
    recommendations: {
      exercise: 'Evita impactos. Opta por Yoga Nidra o descanso. No uses la obsidiana si hay sangrado activo.',
      energy: 'Nivel bajo. Prioriza el silencio y la recarga energética.',
      practice: 'Limpieza física y energética del huevo de obsidiana. Visualización de corte de lazos.'
    }
  },
  follicular: {
    title: 'Fase Folicular',
    archetype: 'La Doncella / Virgen',
    summary: 'Renacimiento, claridad mental y nuevos inicios.',
    description: 'La energía sube (estrógenos). Te sientes dinámica y analítica. Es la "primavera". La Sombra a vigilar es la inmadurez o la ingenuidad; la Luz es el potencial puro y la renovación de la energía vital.',
    recommendations: {
      exercise: 'Excelente momento para fuerza y cardio. Tienes resistencia.',
      energy: 'Nivel alto, enfocado y resolutivo.',
      practice: 'Establecer intenciones y programación del huevito para el nuevo ciclo.'
    }
  },
  ovulatory: {
    title: 'Fase Ovulatoria',
    archetype: 'La Madre / Emperatriz',
    summary: 'Plenitud, comunicación, magnetismo y nutrición.',
    description: 'Apertura hacia el exterior. Es el "verano" radiante. Eres fértil biológica o creativamente. La Sombra aquí es el sacrificio excesivo o la necesidad de aprobación; la Luz es la creación consciente y el liderazgo.',
    recommendations: {
      exercise: 'Danza, movimiento expansivo de caderas (ondas pélvicas) para distribuir la energía.',
      energy: 'Nivel máximo. Magnetismo y lubricación natural.',
      practice: 'Uso del huevito con respiración ovárica para expandir el placer y sanar la culpa.'
    }
  },
  luteal: {
    title: 'Fase Lútea',
    archetype: 'La Hechicera / Chamana',
    summary: 'Intuición visceral, fuego, verdad y descenso a la cueva.',
    description: 'La energía se vuelve crítica (progesterona). Es el "otoño". Surgen verdades incómodas. La Sombra es el caos, el drama o la ira desbordada; la Luz es la intuición mágica y la capacidad de poner límites (Arquetipo Guerrera).',
    recommendations: {
      exercise: 'Baja la intensidad. Grounding (enraizamiento) bioenergético, estiramientos profundos.',
      energy: 'Nivel descendente. Fuego interno que requiere expresión saludable.',
      practice: 'Trabajo intenso de Sombra con la obsidiana. Diario de Sueños fundamental en esta fase.'
    }
  }
};