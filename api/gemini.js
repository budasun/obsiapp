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

  const API_KEY = process.env.GROQ_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ error: 'Falta la API Key de Groq.' });
  }

  const { prompt } = req.body;
  const url = "https://api.groq.com/openai/v1/chat/completions";
  
  // CORRECCIÓN: Usamos el modelo nuevo (el anterior fue dado de baja)
  const model = "llama-3.1-8b-instant"; 

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.6
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error Groq:", data);
      throw new Error(data.error?.message || `Error ${response.status}`);
    }

    const text = data.choices?.[0]?.message?.content || "Sin respuesta";
    res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
