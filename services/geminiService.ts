import { CHATBOT_SYSTEM_INSTRUCTION, DREAM_ANALYSIS_SYSTEM_INSTRUCTION, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION } from "../constants";

// --- CONFIGURACIÓN ---
const API_KEY = import.meta.env.VITE_API_KEY;

// Usamos la v1beta con el modelo flash estándar
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

const callGoogleAI = async (prompt: string, systemInstruction: string) => {
  if (!API_KEY) throw new Error("Falta VITE_API_KEY");

  // Estructura limpia para v1beta
  const payload = {
    contents: [{
      parts: [{ text: prompt }]
    }],
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    generationConfig: {
      temperature: 0.7,
    }
  };

  const response = await fetch(`${BASE_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Error Google:", data);
    // Este mensaje nos dirá la verdad si falla
    throw new Error(data.error?.message || "Error desconocido");
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";
};

// --- EXPORTS ---
export const analyzeDream = async (text: string) => {
  try { return await callGoogleAI(text, DREAM_ANALYSIS_SYSTEM_INSTRUCTION); }
  catch (e) { return "Error de conexión."; }
};

export const getMiracleFeedback = async (q: string, a: string) => {
  try { return await callGoogleAI(`P: ${q}\nR: ${a}`, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION); }
  catch (e) { return "Error de conexión."; }
};

export const sendMessageToOsiris = async (msg: string) => {
  try { return await callGoogleAI(msg, CHATBOT_SYSTEM_INSTRUCTION); }
  catch (e) { return "Error de conexión."; }
};
