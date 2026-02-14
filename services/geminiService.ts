import { CHATBOT_SYSTEM_INSTRUCTION, DREAM_ANALYSIS_SYSTEM_INSTRUCTION, MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION } from "../constants";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const getApiKey = () => {
  // @ts-ignore
  return import.meta.env.VITE_OPENROUTER_API_KEY;
};

const callOpenRouter = async (systemInstruction: string, userPrompt: string): Promise<string> => {
  const apiKey = getApiKey();

  if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    throw new Error("API Key missing");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://obsidiana-app.vercel.app", // Optional
      "X-Title": "Obsidiana App",
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.1-70b-instruct",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("OpenRouter Error:", errorData);
    throw new Error(errorData.error?.message || "Error al conectar con OpenRouter");
  }

  const data = await response.json();
  return data.choices[0].message.content || "";
};

export const analyzeDream = async (dreamText: string): Promise<string> => {
  try {
    return await callOpenRouter(DREAM_ANALYSIS_SYSTEM_INSTRUCTION, dreamText);
  } catch (error) {
    console.error("Error analyzing dream:", error);
    return "✨ **Sintonización en curso...**\n\nTu sueño revela un proceso de transformación profunda relacionado con tu energía uterina. Estás recuperando partes de tu sombra para integrarlas en tu luz.";
  }
};

export const getMiracleFeedback = async (question: string, answer: string): Promise<string> => {
  try {
    const prompt = `Pregunta Milagro: "${question}"\n\nRespuesta/Visualización del usuario: "${answer}"`;
    return await callOpenRouter(MIRACLE_FEEDBACK_SYSTEM_INSTRUCTION, prompt);
  } catch (error) {
    console.error("Error getting miracle feedback:", error);
    return "🌺 **Guía de Sabiduría (Modo Demo)**\n\n### 🎯 Objetivo Cristalizado\nTransformar el dolor en libertad y reconectar con tu centro creativo.\n\n### 🔮 Acto Psicomágico\nEscribe tu intención en un papel, dóblalo en forma de semilla y entrégala a la tierra o a una maceta, visualizando cómo florece tu sanación.\n\n### ⚡ Cuerpo y Bioenergética\nRealiza respiraciones ováricas durante 5 minutos, llevando luz rosa a tu útero.";
  }
};

export const sendMessageToOsiris = async (userMessage: string): Promise<string> => {
  try {
    return await callOpenRouter(CHATBOT_SYSTEM_INSTRUCTION, userMessage);
  } catch (error) {
    console.error("Error in chat:", error);
    return "Hija, mi conexión con el éter es débil ahora. Pero recuerda: tu útero es tu brújula. Intenta hablar conmigo más tarde.";
  }
};
