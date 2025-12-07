export default async function handler(req, res) {
  // Configuración de seguridad (CORS)
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

  // AQUÍ ESTÁ LA SOLUCIÓN: Buscamos la llave con el nombre nuevo
  const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

  if (!API_KEY) {
    console.error("Error: No encuentro ninguna llave API en las variables de entorno.");
    return res.status(500).json({ error: 'Falta la API Key en el servidor (Configura GEMINI_API_KEY en Vercel)' });
  }

  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Falta el prompt' });
    }

    // Usamos el modelo flash-8b que es muy permisivo para cuentas nuevas
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.5 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error de Google:", data);
      throw new Error(data.error?.message || 'Error de Google');
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";
    res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
