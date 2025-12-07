// api/gemini.js
// Esta función corre en el servidor de Vercel
export default async function handler(req, res) {
  // 1. Configuración de seguridad (CORS) para que tu app pueda hablarle
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // En producción, pon tu URL real
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder al "pre-flight" del navegador
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Obtener la llave del entorno seguro de Vercel
  // OJO: Aquí se usa process.env porque esto es Node.js (Servidor), no navegador.
  const API_KEY = process.env.VITE_API_KEY || process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Falta la API Key en el servidor' });
  }

  try {
    // 3. Recibir el prompt desde tu app
    const { prompt } = req.body; // Tu app enviará { "prompt": "..." }

    if (!prompt) {
      return res.status(400).json({ error: 'Falta el prompt' });
    }

    // 4. Hablar con Google (desde el servidor, más seguro)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7 }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error de Google');
    }

    // 5. Devolver solo el texto limpio a tu app
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";
    res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
