export default async function handler(req, res) {
  // Configuración de seguridad (CORS) para que funcione en tu app
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

  const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Falta la API Key en Vercel.' });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

  // CAMBIO MAESTRO: Usamos la versión v1 (estable) y el modelo gemini-pro
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${API_KEY}`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // gemini-pro en v1 prefiere una config simple
        generationConfig: { temperature: 0.7 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de Google:", data);
      throw new Error(data.error?.message || `Error ${response.status}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";
    res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
