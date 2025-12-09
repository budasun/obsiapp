import React, { useState, useEffect } from 'react';
import { analyzeDream } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import { supabase } from '../lib/supabase';
import { User, Calendar } from 'lucide-react';

interface Dream {
  id: string;
  description: string;
  interpretation: string;
  date: string;
}

export default function DreamJournal() {
  const [dream, setDream] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Dream[]>([]);

  useEffect(() => {
    fetchDreams();
  }, []);

  const fetchDreams = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('dreams')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching dreams:', error);
    } else {
      setHistory(data || []);
    }
  };

  const handleAnalyze = async () => {
    if (!dream.trim()) return;
    setIsLoading(true);
    try {
      const result = await analyzeDream(dream);
      setAnalysis(result);

      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const newDream = {
          description: dream,
          interpretation: result,
          user_id: user.id,
          date: new Date().toISOString()
        };

        const { error } = await supabase
          .from('dreams')
          .insert([newDream]);

        if (error) {
          console.error('Error saving dream:', error);
        } else {
          fetchDreams();
        }
      }

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-md border border-pink-100">
        <h2 className="text-2xl font-serif text-pink-800 mb-4">🌙 Diario de Sueños</h2>
        <textarea
          value={dream}
          onChange={(e) => setDream(e.target.value)}
          placeholder="Describe tu sueño con detalles (colores, emociones, lugares)..."
          className="w-full h-40 p-4 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 text-gray-700 resize-none"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !dream.trim()}
            className="bg-pink-600 text-white px-6 py-2 rounded-full hover:bg-pink-700 disabled:opacity-50 transition-all shadow-sm flex items-center gap-2"
          >
            {isLoading ? 'Interpretando...' : '✨ Interpretar con Osiris'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-pink-500 animate-fade-in">
          <h3 className="text-lg font-bold text-pink-800 mb-3 flex items-center gap-2">
            <span>👁️</span> Interpretación Simbólica
          </h3>
          <div className="prose prose-pink text-gray-700 leading-relaxed">
            <ReactMarkdown
              components={{
                h1: ({ node, ...props }) => <h3 className="text-lg font-bold text-pink-700 mt-4 mb-2" {...props} />,
                h2: ({ node, ...props }) => <h4 className="text-md font-bold text-pink-600 mt-3 mb-2" {...props} />,
                strong: ({ node, ...props }) => <span className="font-bold text-pink-900 bg-pink-50 px-1 rounded" {...props} />,
                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-1 my-2" {...props} />,
                li: ({ node, ...props }) => <li className="pl-1" {...props} />,
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Dream History */}
      <div className="space-y-4">
        <h3 className="text-xl font-serif text-pink-900 mb-2">Historial de Sueños</h3>
        {history.map((item) => (
          <div key={item.id} className="bg-white p-4 rounded-xl border border-pink-50 shadow-sm hover:border-pink-200 transition-colors">
            <div className="flex items-center gap-2 text-xs text-pink-400 mb-2">
              <Calendar size={14} />
              <span>{new Date(item.date).toLocaleDateString()}</span>
            </div>
            <p className="font-medium text-gray-800 mb-2 line-clamp-2">{item.description}</p>
            <div className="text-sm text-gray-600 bg-pink-50 p-3 rounded-lg line-clamp-3">
              {item.interpretation}
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <div className="text-center py-8 text-gray-400 italic">
            No hay sueños registrados aún.
          </div>
        )}
      </div>
    </div>
  );
}
