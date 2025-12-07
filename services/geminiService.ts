import { GoogleGenAI, Chat } from "@google/genai";
import { CHATBOT_SYSTEM_INSTRUCTION, DREAM_ANALYSIS_SYSTEM_INSTRUCTION, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION } from "../constants";

// Helper to ensure we have the API Key
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure process.env.API_KEY is set.");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeDream = async (dreamText: string): Promise<string> => {
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: dreamText,
      config: {
        systemInstruction: DREAM_ANALYSIS_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    
    return response.text || "No se pudo interpretar el sueño en este momento.";
  } catch (error) {
    console.error("Error analyzing dream:", error);
    return "Hubo un error al conectar con la sabiduría del oráculo (API Error).";
  }
};

export const getMiracleFeedback = async (question: string, answer: string): Promise<string> => {
  try {
    const ai = getClient();
    const prompt = `Pregunta Milagro: "${question}"\n\nRespuesta/Visualización del usuario: "${answer}"`;
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    return response.text || "No se pudo generar el plan alquímico en este momento.";
  } catch (error) {
    console.error("Error getting miracle feedback:", error);
    return "Error de conexión con el oráculo.";
  }
};

let chatSession: Chat | null = null;

export const sendMessageToOsiris = async (userMessage: string): Promise<string> => {
  try {
    const ai = getClient();
    
    if (!chatSession) {
      chatSession = ai.chats.create({
        model: "gemini-2.5-flash",
        config: {
          systemInstruction: CHATBOT_SYSTEM_INSTRUCTION,
          temperature: 0.6,
        },
      });
    }

    const response = await chatSession.sendMessage({
      message: userMessage,
    });

    return response.text || "El silencio es a veces la respuesta...";
  } catch (error) {
    console.error("Error in chat:", error);
    return "Lo siento, mi conexión con el plano etéreo es débil en este momento (API Error).";
  }
};