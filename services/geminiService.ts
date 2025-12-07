import { CHATBOT_SYSTEM_INSTRUCTION, DREAM_ANALYSIS_SYSTEM_INSTRUCTION, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION } from "../constants";

// Función maestra: Solo sabe hablar con TU servidor (/api/gemini)
// NO sabe nada de Google ni de OpenRouter. Es ciega al proveedor.
const callMyServer = async (promptText: string, systemInstruction: string) => {
  
  // Combinamos la instrucción del sistema y el prompt para enviarlo como un solo paquete
  const fullPrompt = `INSTRUCCIÓN DEL SISTEMA:\n${systemInstruction}\n\n---\n\nUSUARIO:\n${promptText}`;

  try {
    console.log("Enviando mensaje al servidor local /api/gemini...");
    
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: fullPrompt })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error del Servidor:", data);
      throw new Error(data.error || "Error desconocido en el servidor");
    }

    return data.text;

  } catch (error) {
    console.error("Error de conexión:", error);
    return "Error: No pude conectar con el servidor. Intenta de nuevo.";
  }
};

// --- Exportaciones (Usan la función maestra) ---

export const analyzeDream = async (dreamText: string) => {
  return await callMyServer(dreamText, DREAM_ANALYSIS_SYSTEM_INSTRUCTION);
};

export const getMiracleFeedback = async (question: string, answer: string) => {
  const text = `Pregunta: "${question}"\nRespuesta: "${answer}"`;
  return await callMyServer(text, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION);
};

// Historial simple en memoria
let chatHistory: string[] = [];

export const sendMessageToOsiris = async (userMessage: string) => {
  // Construimos el historial como texto simple
  const historyText = chatHistory.join('\n');
  const finalPrompt = `${historyText}\nUsuario: ${userMessage}`;
  
  const response = await callMyServer(finalPrompt, CHATBOT_SYSTEM_INSTRUCTION);
  
  // Guardamos en el historial
  chatHistory.push(`Usuario: ${userMessage}`);
  chatHistory.push(`Osiris: ${response}`);
  
  return response;
};
