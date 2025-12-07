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

  const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Falta la API Key en Vercel.' });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

  // LISTA DE MODELOS A PROBAR (Plan A, B, C y D)
  // El código probará uno por uno hasta que uno funcione.
  const modelsToTry = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-pro" // El clásico infalible
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      console.log(`Intentando conectar con: ${model}...`);
      
      // Usamos la API v1beta que es la más compatible hoy
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
      
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
        throw new Error(data.error?.message || `Error ${response.status}`);
      }

      // ¡SI LLEGAMOS AQUÍ, FUNCIONÓ!
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";
      return res.status(200).json({ text }); // Enviamos la respuesta y terminamos

    } catch (error) {
      console.error(`Falló el modelo ${model}:`, error.message);
      lastError = error.message;
      // El bucle continuará automáticamente con el siguiente modelo...
    }
  }

  // Si llegamos aquí, es que fallaron los 4 modelos
  return res.status(500).json({ 
    error: `No se pudo conectar con ningún modelo. Revisa que la API 'Generative Language' esté habilitada en Google Cloud. Último error: ${lastError}` 
  });
}
