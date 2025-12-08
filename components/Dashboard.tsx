import React, { useState, useEffect } from 'react';
import { getMiracleFeedback } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

const MIRACLE_QUESTIONS = [
  "Si esta noche ocurriera un milagro y tu dolor desapareciera, ¿qué harías diferente mañana?",
  "Imagina que tu útero pudiera hablarte claramente. ¿Qué crees que te pediría?",
  "Si despertaras llena de energía creativa, ¿qué proyecto iniciarías?",
  "Supón que el bloqueo emocional ya no está. ¿Cómo te relacionarías contigo misma?"
];

export default function Dashboard() {
  const [question, setQuestion] = useState(MIRACLE_QUESTIONS[0]);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('Alquimista'); // Nombre por defecto

  useEffect(() => {
    // 1. Cargar pregunta aleatoria
    setQuestion(MIRACLE_QUESTIONS[Math.floor(Math.random() * MIRACLE_QUESTIONS.length)]);
    
    // 2. Cargar nombre real del usuario desde localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Si el usuario tiene nombre, úsalo. Si no, busca el email antes de la @
        const nameToUse = parsedUser.name || parsedUser.email?.split('@')[0] || 'Alquimista';
        // Capitalizar la primera letra
        setUserName(nameToUse.charAt(0).toUpperCase() + nameToUse.slice(1));
      } catch (e) {
        console.error("Error leyendo usuario", e);
      }
    }
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
      <div className="bg-gradient-to-r from-pink-50 to-white p-6 rounded-2xl shadow-sm border border-pink-100">
        {/* AQUÍ SE MUESTRA EL NOMBRE DINÁMICO */}
        <h1 className="text-3xl font-serif text-pink-900 mb-2">Hola, {userName}</h1>
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

      <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="bg-pink-100 text-pink-600 p-2 rounded-lg text-xl">✨</span>
          <h2 className="text-xl font-bold text-pink-800">La Pregunta Milagro</h2>
        </div>
        
        <p className="text-lg text-gray-700 italic mb-6 font-serif leading-relaxed">"{question}"</p>

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

        {feedback && (
          <div className="mt-6 pt-6 border-t border-pink-100 animate-fade-in">
            <h3 className="text-lg font-bold text-pink-900 mb-3">Tu Plan Alquímico</h3>
            <div className="prose prose-pink text-gray-700 leading-relaxed bg-pink-50 p-4 rounded-xl">
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h3 className="text-lg font-bold text-pink-800 mt-2" {...props} />,
                  strong: ({node, ...props}) => <span className="font-bold text-pink-900" {...props} />,
                  li: ({node, ...props}) => <li className="pl-1" {...props} />,
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
