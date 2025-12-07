import { CHATBOT_SYSTEM_INSTRUCTION, DREAM_ANALYSIS_SYSTEM_INSTRUCTION, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION } from "../constants";

// CONFIGURACIÓN
const API_KEY = import.meta.env.VITE_API_KEY;

// CAMBIO CRÍTICO: Usamos la API "v1" (Estable) y el modelo "gemini-pro"
const BASE_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

const callGoogleAI = async (prompt: string, systemInstruction: string) => {
  if (!API_KEY) {
    throw new Error("Falta la API Key en Vercel (VITE_API_KEY)");
  }

  // ESTRATEGIA BLINDADA: Combinamos la instrucción del sistema y el prompt en un solo texto.
  // Esto evita errores de compatibilidad en la versión v1.
  const finalPrompt = `INSTRUCCIONES DEL SISTEMA:\n${systemInstruction}\n\n---\n\nUSUARIO:\n${prompt}`;

  const payload = {
    contents: [{
      parts: [{ text: finalPrompt }]
    }],
    generationConfig: {
      temperature: 0.7,
    }
  };

  const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error detallado de Google:", data);
    // Si falla, lanzamos el mensaje exacto para diagnosticar
    throw new Error(data.error?.message || `Error del servidor: ${response.status}`);
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "No hubo respuesta del oráculo.";
};

// --- FUNCIONES DE LA APP ---

export const analyzeDream = async (dreamText: string) => {
  try {
    return await callGoogleAI(dreamText, DREAM_ANALYSIS_SYSTEM_INSTRUCTION);
  } catch (error) {
    console.error("Error interpretando sueño:", error);
    return "Error al conectar con la sabiduría del oráculo.";
  }
};

export const getMiracleFeedback = async (question: string, answer: string) => {
  try {
    const prompt = `Pregunta: "${question}"\nRespuesta: "${answer}"`;
    return await callGoogleAI(prompt, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION);
  } catch (error) {
    console.error("Error en pregunta milagro:", error);
    return "Error de conexión.";
  }
};

let chatHistory: any[] = [];

export const sendMessageToOsiris = async (userMessage: string) => {
  try {
    // Gestión manual del historial para v1 (Texto plano)
    const context = chatHistory.map(msg => `${msg.role === 'user' ? 'USUARIO' : 'OSIRIS'}: ${msg.parts[0].text}`).join('\n');
    const fullPrompt = `${context}\nUSUARIO: ${userMessage}`;
    
    // Llamamos a la función genérica pero con el historial inyectado en el texto
    const aiResponse = await callGoogleAI(fullPrompt, CHATBOT_SYSTEM_INSTRUCTION);

    // Guardamos en historial local para mantener la memoria
    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
    chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });

    return aiResponse;
  } catch (error) {
    console.error("Error en chat:", error);
    return "Mi conexión espiritual es débil ahora. Intenta de nuevo.";
  }
};
