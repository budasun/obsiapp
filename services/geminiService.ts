import { CHATBOT_SYSTEM_INSTRUCTION, DREAM_ANALYSIS_SYSTEM_INSTRUCTION, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION } from "../constants";

// Función que llama a TU servidor local (que luego llama a OpenRouter)
const callMyServer = async (promptText: string, systemInstruction: string) => {
  const fullPrompt = `${systemInstruction}\n\n---\n\nUSUARIO:\n${promptText}`;

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
    console.error("Error conectando con API:", error);
    return "Error de conexión. Intenta más tarde.";
  }
};

// --- Exportaciones ---
export const analyzeDream = async (text: string) => callMyServer(text, DREAM_ANALYSIS_SYSTEM_INSTRUCTION);
export const getMiracleFeedback = async (q: string, a: string) => callMyServer(`P: ${q}\nR: ${a}`, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION);
export const sendMessageToOsiris = async (msg: string) => callMyServer(msg, CHATBOT_SYSTEM_INSTRUCTION);
