import { CHATBOT_SYSTEM_INSTRUCTION, DREAM_ANALYSIS_SYSTEM_INSTRUCTION, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION } from "../constants";

// --- CONFIGURACIÓN CRÍTICA ---
const API_KEY = import.meta.env.VITE_API_KEY;

// OJO AQUÍ: Usamos la API "v1" (SIN BETA) y el modelo "gemini-pro".
// Esta es la combinación más estable de Google.
const BASE_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";

interface GeminiResponse {
  candidates?:Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  error?: {
    message: string;
    code?: number;
    status?: string;
  };
}

const callGoogleAI = async (prompt: string, systemInstruction: string) => {
  if (!API_KEY) throw new Error("Falta VITE_API_KEY en Vercel");

  // En la versión v1 estándar, inyectamos la instrucción del sistema en el texto
  // para asegurar máxima compatibilidad.
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
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = (await response.json()) as GeminiResponse;

  if (!response.ok || data.error) {
    console.error("Error Google:", data);
    throw new Error(data.error?.message || "Error de conexión");
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta.";
};

// --- FUNCIONES EXPORTADAS ---

export const analyzeDream = async (dreamText: string) => {
  try {
    return await callGoogleAI(dreamText, DREAM_ANALYSIS_SYSTEM_INSTRUCTION);
  } catch (error) {
    console.error(error);
    return "No pude interpretar el sueño. Verifica tu conexión.";
  }
};

export const getMiracleFeedback = async (question: string, answer: string) => {
  try {
    return await callGoogleAI(`Pregunta: ${question}\nRespuesta: ${answer}`, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION);
  } catch (error) {
    console.error(error);
    return "Error al conectar con el oráculo.";
  }
};

let chatHistory: any[] = [];

export const sendMessageToOsiris = async (userMessage: string) => {
  try {
    // Gestión simplificada del historial para v1
    const context = chatHistory.map(msg => `${msg.role === 'user' ? 'USUARIO' : 'OSIRIS'}: ${msg.parts[0].text}`).join('\n');
    const fullPrompt = `${context}\nUSUARIO: ${userMessage}`;
    
    // Llamamos a la función genérica pero con el historial inyectado
    const aiResponse = await callGoogleAI(fullPrompt, CHATBOT_SYSTEM_INSTRUCTION);

    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
    chatHistory.push({ role: "model", parts: [{ text: aiResponse }] });

    return aiResponse;
  } catch (error) {
    return "Error de conexión con Osiris.";
  }
};
