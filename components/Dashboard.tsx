import React, { useState, useEffect } from 'react';
import { getMiracleFeedback } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

// Preguntas Milagro de Milton Erickson (Rotativas)
const MIRACLE_QUESTIONS = [
  "Si esta noche, mientras duermes, ocurriera un milagro y tu dolor desapareciera, ¿qué harías diferente mañana?",
  "Imagina que tu útero pudiera hablarte claramente sin dolor. ¿Qué crees que te estaría pidiendo que cambies en tu rutina?",
  "Si despertaras mañana llena de energía creativa y sexual, ¿cuál sería el primer proyecto o actividad que iniciarías?",
  "Supón que el bloqueo emocional que sientes ya no está. ¿Cómo te relacionarías diferente con tu pareja o contigo misma?"
];

export default function Dashboard() {
  // Estado para la pregunta del día (aleatoria o por día)
  const [question, setQuestion] = useState(MIRACLE_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Cambiar pregunta al azar al cargar (opcional)
  useEffect(() => {
    const randomQ = MIRACLE_QUESTIONS[Math.floor(Math.random() * MIRACLE_QUESTIONS.length)];
    setQuestion(randomQ);
  }, []);

  const handleGetFeedback = async () => {
    if (!answer.trim()) return;
    setIsLoading(true);
    try {
      const response = await getMiracleFeedback(question, answer);
      setFeedback(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjeta de Bienvenida / Resumen */}
      <div className="bg-gradient-to-r from-pink-50 to-white p-6 rounded-2xl shadow-sm border border-pink-100">
        <h1 className="text-3xl font-serif text-pink-900 mb-2">Hola, Alquimista</h1>
        <p className="text-gray-600">Hoy es un buen día para conectar con tu centro.</p>
        
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-pink-400">
            <span className="text-xs font-bold text-gray-400 uppercase">Ciclo Menstrual</span>
            <div className="text-2xl font-bold text-pink-600 mt-1">Día 12</div>
            <div className="text-sm text-pink-400">Fase Ovulatoria</div>
          </div>
          <div className="bg-slate-800 p-4 rounded-xl shadow-sm text-white">
            <span className="text-xs font-bold text-gray-400 uppercase">Fase Lunar</span>
            <div className="text-2xl font-bold mt-1">Luna Creciente</div>
            <div className="text-sm text-gray-300">Energía de Acción</div>
          </div>
        </div>
      </div>

      {/* Sección Pregunta Milagro */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-pink-100 text-pink-600 p-2 rounded-lg text-xl">✨</span>
          <h2 className="text-xl font-bold text-pink-800">La Pregunta Milagro</h2>
        </div>
        
        <p className="text-lg text-gray-700 italic mb-6 font-serif leading-relaxed">
          "{question}"
        </p>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Escribe tu visualización aquí..."
          className="w-full h-32 p-4 border border-pink-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700 resize-none bg-pink-50/30"
        />

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleGetFeedback}
            disabled={isLoading || !answer.trim()}
            className="bg-pink-600 text-white px-6 py-2 rounded-full hover:bg-pink-700 disabled:opacity-50 transition-all font-medium"
          >
            {isLoading ? 'Conectando...' : 'Obtener Feedback'}
          </button>
        </div>

        {/* AQUÍ ESTÁ EL ARREGLO DEL FORMATO */}
        {feedback && (
          <div className="mt-6 pt-6 border-t border-pink-100 animate-fade-in">
            <h3 className="text-lg font-bold text-pink-900 mb-3">Tu Plan Alquímico</h3>
            <div className="prose prose-pink text-gray-700 leading-relaxed bg-pink-50 p-4 rounded-xl">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h3 className="text-lg font-bold text-pink-800 mt-4 mb-2" {...props} />,
                  h2: ({node, ...props}) => <h4 className="text-md font-bold text-pink-700 mt-3 mb-2" {...props} />,
                  h3: ({node, ...props}) => <strong className="block text-pink-700 mt-3 font-bold" {...props} />,
                  strong: ({node, ...props}) => <span className="font-bold text-pink-900" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
                  p: ({node, ...props}) => <p className="mb-2" {...props} />
                }}
              >
                {feedback}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
