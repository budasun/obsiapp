// Archivo: src/services/geminiService.ts (o groqService.ts)

import { CHATBOT_SYSTEM_INSTRUCTION, DREAM_ANALYSIS_SYSTEM_INSTRUCTION, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION, BITACORA_SYSTEM_INSTRUCTION } from "../constants";
import Groq from "groq-sdk";

const getApiKey = () => {
  return import.meta.env.VITE_GROQ_API_KEY;
};

const getModel = () => {
  return import.meta.env.VITE_GROQ_MODEL || "llama-3.3-70b-versatile";
};

let groqClient: Groq | null = null;

const getGroqClient = () => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === '' || apiKey.startsWith('TU_') || apiKey.startsWith('Obtén')) {
    return null;
  }
  if (!groqClient) {
    groqClient = new Groq({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // <- ESTA ES LA MAGIA QUE FALTABA
    });
  }
  return groqClient;
};

const isConfigured = (): boolean => {
  const apiKey = getApiKey();
  return !!(apiKey && !apiKey.startsWith('TU_') && !apiKey.startsWith('Obtén') && apiKey.length > 10);
};

const DEMO_RESPONSES = {
  osiris: [
    "Hola hija mia, bienvenida a tu espacio sagrado. Soy Osiris, tu guía en este viaje de reconexión con tu esencia femenina. ¿Qué deseas explorar hoy?",
    "Tu energía fluye como el Nilo en su momento de crecida. ¿Hay algo específico que quieras sanar o explorar?",
    "El útero es el centro de tu poder creativo. ¿Qué pregunta tienes para el universo?",
  ],
  dream: "🔮 **Análisis de Sueños**\n\nTu sueño revela un proceso de transformación profunda. Los símbolos que describes conectan con tu energía uterina y tu proceso de sanación.\n\n**Símbolos detectados:**\n- 🌊 Energía emocional fluyendo\n- 🔄 Proceso de renovación\n- 🌙 Conexión con tu intuición\n\n**Recomendación:**\nEscucha tu cuerpo y honra tus emociones.",
  miracle: "🌺 **Guía de Sabiduría**\n\n### 🎯 Objetivo Cristalizado\nTransformar el dolor en libertad y reconectar con tu centro creativo.\n\n### 🔮 Acto Psicomágico\nEscribe tu intención en un papel, dóblalo en forma de semilla y entrégala a la tierra.\n\n### ⚡ Cuerpo y Bioenergética\nRealiza respiraciones ováricas durante 5 minutos.",
};

const getRandomDemoResponse = (type: 'osiris' | 'dream' | 'miracle'): string => {
  if (type === 'osiris') {
    return DEMO_RESPONSES.osiris[Math.floor(Math.random() * DEMO_RESPONSES.osiris.length)];
  }
  return DEMO_RESPONSES[type];
};

const callGroq = async (systemInstruction: string, userPrompt: string): Promise<string> => {
  if (!isConfigured()) {
    throw new Error("API_NO_CONFIGURADA");
  }

  const client = getGroqClient();
  if (!client) {
    throw new Error("Cliente Groq no inicializado");
  }

  try {
    const chatCompletion = await client.chat.completions.create({
      model: getModel(),
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2048, // Aumenté un poco los tokens para que las respuestas de Sombra y Milagros no se corten
    });

    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error("Groq Error:", error);
    throw new Error(error.message || "Error al conectar con Groq");
  }
};

export const analyzeDream = async (dreamText: string): Promise<string> => {
  if (!isConfigured()) {
    return getRandomDemoResponse('dream');
  }

  try {
    return await callGroq(DREAM_ANALYSIS_SYSTEM_INSTRUCTION, dreamText);
  } catch (error) {
    console.error("Error analyzing dream:", error);
    return getRandomDemoResponse('dream');
  }
};

export const analyzeBitacora = async (bitacoraText: string): Promise<string> => {
  if (!isConfigured()) {
    return getRandomDemoResponse('dream');
  }

  try {
    return await callGroq(BITACORA_SYSTEM_INSTRUCTION, bitacoraText);
  } catch (error) {
    console.error("Error analyzing bitacora:", error);
    return getRandomDemoResponse('dream');
  }
};

export const getMiracleFeedback = async (question: string, answer: string): Promise<string> => {
  if (!isConfigured()) {
    return getRandomDemoResponse('miracle');
  }

  try {
    const prompt = `Pregunta Milagro: "${question}"\n\nRespuesta/Visualización del usuario: "${answer}"`;
    return await callGroq(MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION, prompt);
  } catch (error) {
    console.error("Error getting miracle feedback:", error);
    return getRandomDemoResponse('miracle');
  }
};

// Mantenemos un "historial" muy básico en memoria para esta sesión para que parezca un chat
let chatHistory: { role: "system" | "user" | "assistant", content: string }[] = [];

export const sendMessageToOsiris = async (userMessage: string): Promise<string> => {
  if (!isConfigured()) {
    return getRandomDemoResponse('osiris');
  }

  const client = getGroqClient();
  if (!client) return getRandomDemoResponse('osiris');

  try {
    // Si el historial está vacío, metemos la instrucción del sistema
    if (chatHistory.length === 0) {
      chatHistory.push({ role: "system", content: CHATBOT_SYSTEM_INSTRUCTION });
    }

    // Agregamos el mensaje del usuario
    chatHistory.push({ role: "user", content: userMessage });

    // Para no exceder límites, mantenemos solo los últimos 6 mensajes (3 interacciones)
    if (chatHistory.length > 7) {
      // Mantenemos el primer mensaje (system) y borramos los viejos
      chatHistory = [chatHistory[0], ...chatHistory.slice(chatHistory.length - 6)];
    }

    const chatCompletion = await client.chat.completions.create({
      model: getModel(),
      messages: chatHistory as any, // TypeScript a veces se queja de los tipos estrictos aquí
      temperature: 0.7,
      max_tokens: 1024,
    });

    const botResponse = chatCompletion.choices[0]?.message?.content || "";

    // Guardamos la respuesta del bot en el historial
    chatHistory.push({ role: "assistant", content: botResponse });

    return botResponse;
  } catch (error) {
    console.error("Error in chat:", error);
    // Si falla, sacamos el último mensaje de usuario para no romper el historial
    chatHistory.pop();
    return getRandomDemoResponse('osiris');
  }
};

export const isApiConfigured = isConfigured;