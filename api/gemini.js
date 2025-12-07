export default async function handler(req, res) {
  // CORS (Seguridad)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Usamos la llave de OpenRouter (puede estar en cualquiera de estas variables)
  const API_KEY = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Falta la API Key de OpenRouter.' });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

  // URL DE OPENROUTER (La puerta universal)
  const url = "https://openrouter.ai/api/v1/chat/completions";
  
  // MODELO: Usamos el gratuito de Google vía OpenRouter
  // Si quieres pagar por calidad premium, cambia a "google/gemini-pro-1.5"
  const model = "google/gemini-flash-1.5"; 

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://obsidiana-app.vercel.app', // Tu sitio (opcional)
        'X-Title': 'Obsidiana App'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error OpenRouter:", data);
      throw new Error(data.error?.message || `Error ${response.status}`);
    }

    // OpenRouter devuelve formato estándar OpenAI
    const text = data.choices?.[0]?.message?.content || "Sin respuesta";
    res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
