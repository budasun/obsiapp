export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Usamos la llave de OpenRouter
  const API_KEY = process.env.OPENROUTER_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Falta la API Key de OpenRouter en Vercel.' });
  }

  const { prompt } = req.body;
  const url = "https://openrouter.ai/api/v1/chat/completions";
  // Modelo gratuito de OpenRouter
  const model = "google/gemini-2.0-flash-exp:free"; 

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://obsidiana-app.vercel.app',
        'X-Title': 'Obsidiana App'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || `Error ${response.status}`);
    }

    const text = data.choices?.[0]?.message?.content || "Sin respuesta";
    res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
