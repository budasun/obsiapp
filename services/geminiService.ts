import { CHATBOT_SYSTEM_INSTRUCTION, DREAM_ANALYSIS_SYSTEM_INSTRUCTION, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION } from "../constants";

// Función maestra: Solo habla con TU servidor (/api/gemini)
const callMyServer = async (promptText: string, systemInstruction: string) => {
  // Combinamos la instrucción para que OpenRouter la entienda como contexto
  const fullPrompt = `INSTRUCCIÓN DEL SISTEMA:\n${systemInstruction}\n\n---\n\nUSUARIO:\n${promptText}`;

  try {
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
    console.error("Error de conexión:", error);
    return "Error: No pude conectar con el servidor. Intenta de nuevo.";
  }
};

// --- Exportaciones ---
export const analyzeDream = async (text: string) => callMyServer(text, DREAM_ANALYSIS_SYSTEM_INSTRUCTION);
export const getMiracleFeedback = async (q: string, a: string) => callMyServer(`P: ${q}\nR: ${a}`, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION);

let chatHistory: string[] = [];
export const sendMessageToOsiris = async (msg: string) => {
  const historyText = chatHistory.join('\n');
  const finalPrompt = `${historyText}\nUsuario: ${msg}`;
  const response = await callMyServer(finalPrompt, CHATBOT_SYSTEM_INSTRUCTION);
  
  chatHistory.push(`Usuario: ${msg}`);
  chatHistory.push(`Osiris: ${response}`);
  return response;
};
