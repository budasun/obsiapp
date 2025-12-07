export default async function handler(req, res) {
  // 1. Configuración de Seguridad (CORS) - Para que tu app no sea bloqueada
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Respuesta rápida para verificaciones del navegador
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Buscar la llave (Probamos con ambos nombres por seguridad)
  const API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Falta la API Key en las variables de entorno de Vercel.' });
  }

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Falta el prompt' });

  // 3. ESTRATEGIA MAESTRA: Lista de intentos
  // Probaremos estas 4 combinaciones en orden. Una TIENE que funcionar.
  const attempts = [
    { model: 'gemini-1.5-flash', version: 'v1beta' },       // La más nueva y rápida
    { model: 'gemini-1.5-flash-latest', version: 'v1beta' },// Alias común
    { model: 'gemini-1.5-flash-8b', version: 'v1beta' },    // Versión ligera
    { model: 'gemini-pro', version: 'v1beta' },             // Pro en Beta
    { model: 'gemini-pro', version: 'v1' }                  // Pro Clásico (Estable)
  ];

  let lastError = null;

  // 4. Bucle de intentos
  for (const attempt of attempts) {
    try {
      console.log(`Probando conexión con: ${attempt.model} (${attempt.version})...`);
      
      const url = `https://generativelanguage.googleapis.com/${attempt.version}/models/${attempt.model}:generateContent?key=${API_KEY}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          // Temperatura baja para ser más compatible con modelos estrictos
          generationConfig: { temperature: 0.6 }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Error ${response.status}`);
      }

      // ¡ÉXITO! Encontramos un modelo que funciona.
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sin respuesta";
      return res.status(200).json({ text }); // Enviamos y terminamos aquí.

    } catch (error) {
      console.error(`Falló ${attempt.model}: ${error.message}`);
      lastError = error.message;
      // Si falla, el código sigue automáticamente al siguiente intento...
    }
  }

  // 5. Si llegamos aquí, fallaron TODOS los modelos
  return res.status(500).json({ 
    error: `No se pudo conectar con ningún modelo de Google. Último error: ${lastError}` 
  });
}
