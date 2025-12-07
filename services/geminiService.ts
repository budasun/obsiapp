import { CHATBOT_SYSTEM_INSTRUCTION, DREAM_ANALYSIS_SYSTEM_INSTRUCTION, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION } from "../constants";

// Función genérica para llamar a TU servidor Vercel
const callMyServer = async (promptText: string, systemInstruction: string) => {
  // Combinamos la instrucción del sistema y el prompt en uno solo
  // porque nuestra API simplificada espera un solo texto.
  const fullPrompt = `${systemInstruction}\n\n---\n\nUSUARIO:\n${promptText}`;

  try {
    // Llamamos a la carpeta /api/gemini que creamos
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error en el servidor");
    }

    return data.text;

  } catch (error) {
    console.error("Error conectando con Vercel Functions:", error);
    return "Error de conexión. Intenta más tarde.";
  }
};

// --- FUNCIONES IGUALES, PERO AHORA USAN callMyServer ---

export const analyzeDream = async (dreamText: string) => {
  return await callMyServer(dreamText, DREAM_ANALYSIS_SYSTEM_INSTRUCTION);
};

export const getMiracleFeedback = async (q: string, a: string) => {
  return await callMyServer(`Pregunta: ${q}\nRespuesta: ${a}`, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION);
};

let chatHistory: string[] = [];

export const sendMessageToOsiris = async (msg: string) => {
  // Manejo simple de historial
  const historyText = chatHistory.join('\n');
  const prompt = `${historyText}\nUsuario: ${msg}`;
  
  const response = await callMyServer(prompt, CHATBOT_SYSTEM_INSTRUCTION);
  
  chatHistory.push(`Usuario: ${msg}`);
  chatHistory.push(`Osiris: ${response}`);
  
  return response;
};
