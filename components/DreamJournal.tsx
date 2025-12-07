import React, { useState } from 'react';
import { analyzeDream } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

export default function DreamJournal() {
  const [dream, setDream] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!dream.trim()) return;
    setIsLoading(true);
    try {
      const result = await analyzeDream(dream);
      setAnalysis(result);
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
          placeholder="Describe tu sueño..."
          className="w-full h-40 p-4 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !dream.trim()}
            className="bg-pink-600 text-white px-6 py-2 rounded-full hover:bg-pink-700 disabled:opacity-50 transition-all"
          >
            {isLoading ? 'Interpretando...' : '✨ Interpretar'}
          </button>
        </div>
      </div>

      {analysis && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border-l-4 border-pink-500 animate-fade-in">
          <h3 className="text-lg font-bold text-pink-800 mb-3">👁️ Interpretación</h3>
          <div className="prose prose-pink text-gray-700">
            <ReactMarkdown
              components={{
                strong: ({node, ...props}) => <span className="font-bold text-pink-900" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold text-pink-700 mt-4 mb-2" {...props} />,
                li: ({node, ...props}) => <li className="mb-1" {...props} />
              }}
            >
              {analysis}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
