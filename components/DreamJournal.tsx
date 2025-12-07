import React, { useState } from 'react';
import { DreamEntry } from '../types';
import { analyzeDream } from '../services/geminiService';
import { BookHeart, Send, Loader2, Sparkles } from 'lucide-react';

const DreamJournal: React.FC = () => {
  const [dreams, setDreams] = useState<DreamEntry[]>([]);
  const [newDream, setNewDream] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeAndSave = async () => {
    if (!newDream.trim()) return;

    setIsAnalyzing(true);
    const id = Date.now().toString();
    
    // Simulate API call for analysis
    const analysis = await analyzeDream(newDream);

    const entry: DreamEntry = {
      id,
      date: new Date().toLocaleDateString(),
      content: newDream,
      interpretation: analysis,
      tags: ['Cueva', 'Sombra'] // Simulated tags extraction
    };

    setDreams([entry, ...dreams]);
    setNewDream('');
    setIsAnalyzing(false);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-serif text-obsidian-900 mb-2">Diario de Sueños y Sombra</h2>
        <p className="text-gray-600">Registra tus sueños al despertar. La "Consejera Osiris" buscará mensajes de tu inconsciente uterino.</p>
      </div>

      {/* Input Area */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-obsidian-100">
        <textarea
          value={newDream}
          onChange={(e) => setNewDream(e.target.value)}
          placeholder="Hoy soñé que entraba en una cueva oscura y encontraba un animal herido..."
          className="w-full h-32 p-4 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-obsidian-200 focus:border-transparent outline-none resize-none text-gray-900 placeholder-gray-500 shadow-inner"
        />
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAnalyzeAndSave}
            disabled={isAnalyzing || !newDream.trim()}
            className="flex items-center space-x-2 bg-obsidian-600 hover:bg-obsidian-700 text-white px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Interpretando Símbolos...</span>
              </>
            ) : (
              <>
                <Sparkles size={18} />
                <span>Interpretar y Guardar</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {dreams.length === 0 && (
            <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                <BookHeart size={48} className="mx-auto mb-3 opacity-30" />
                <p>Tu diario está vacío. Los sueños son cartas que el alma se escribe a sí misma.</p>
            </div>
        )}
        
        {dreams.map((dream) => (
          <div key={dream.id} className="bg-white rounded-2xl shadow-sm border border-obsidian-50 overflow-hidden">
            <div className="bg-obsidian-50 px-6 py-3 flex justify-between items-center">
                <span className="font-serif font-bold text-obsidian-900">{dream.date}</span>
                <BookHeart size={16} className="text-obsidian-400" />
            </div>
            <div className="p-6 space-y-4">
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Tu Sueño</h4>
                    <p className="text-gray-900 italic">"{dream.content}"</p>
                </div>
                
                {dream.interpretation && (
                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <h4 className="text-xs font-bold text-purple-800 uppercase tracking-wide mb-2 flex items-center">
                            <Sparkles size={12} className="mr-1" />
                            Interpretación de Osiris
                        </h4>
                        <div className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                            {dream.interpretation}
                        </div>
                    </div>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DreamJournal;