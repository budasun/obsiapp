import React, { useState, useEffect } from 'react';
import { DreamEntry } from '../types';
import { analyzeDream } from '../services/geminiService';
import { BookHeart, Send, Loader2, Sparkles } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const DreamJournal: React.FC = () => {
  const [dreams, setDreams] = useState<DreamEntry[]>(() => {
    const saved = localStorage.getItem('obsidiana_dreams');
    return saved ? JSON.parse(saved) : [];
  });
  const [newDream, setNewDream] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    localStorage.setItem('obsidiana_dreams', JSON.stringify(dreams));
  }, [dreams]);

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
      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-obsidian-200 before:to-transparent">
        {dreams.length === 0 && (
          <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50 backdrop-blur-sm">
            <BookHeart size={48} className="mx-auto mb-3 opacity-30 animate-float" />
            <p className="font-serif italic font-medium">Tu diario está vacío. Los sueños son cartas que el alma se escribe a sí misma.</p>
          </div>
        )}

        {dreams.map((dream, index) => {
          const [isExpanded, setIsExpanded] = useState(false);

          return (
            <div key={dream.id} className="relative flex items-start justify-between md:justify-normal md:odd:flex-row-reverse group animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
              {/* Dot */}
              <div className="flex items-center justify-center w-10 h-10 rounded-xl border border-white bg-obsidian-100 group-hover:bg-obsidian-600 group-hover:text-white text-obsidian-600 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-all duration-300 mt-2">
                <BookHeart size={18} />
              </div>

              {/* Card */}
              <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white rounded-3xl shadow-sm border border-obsidian-100 hover:shadow-xl hover:border-obsidian-200 transition-all duration-500 overflow-hidden ${isExpanded ? 'p-6 ring-4 ring-obsidian-50' : 'p-4'}`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-3">
                    <time className="font-serif font-bold text-obsidian-900 bg-obsidian-50 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">{dream.date}</time>
                    <div className="hidden sm:flex gap-1">
                      {dream.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[8px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded-md uppercase font-bold tracking-tighter border border-gray-100">{tag}</span>
                      ))}
                    </div>
                  </div>
                  {!isExpanded && (
                    <button
                      onClick={() => setIsExpanded(true)}
                      className="text-[10px] font-bold text-obsidian-600 hover:text-black uppercase tracking-widest flex items-center group/btn"
                    >
                      Lee más <Sparkles size={10} className="ml-1 group-hover/btn:rotate-12 transition-transform" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="relative">
                    <p className={`text-gray-900 italic relative z-10 leading-relaxed font-serif ${!isExpanded ? 'line-clamp-2 text-sm opacity-70' : 'text-lg'}`}>
                      {isExpanded ? (
                        <>
                          <span className="text-3xl text-obsidian-100 absolute -top-2 -left-3 select-none">"</span>
                          {dream.content}
                          <span className="text-3xl text-obsidian-100 absolute -bottom-4 -right-2 select-none rotate-180">"</span>
                        </>
                      ) : dream.content}
                    </p>
                  </div>

                  {isExpanded && (
                    <>
                      {dream.interpretation && (
                        <div className="glass p-5 rounded-2xl border border-obsidian-100 bg-obsidian-50/40 animate-slide-up">
                          <h4 className="text-[10px] font-bold text-obsidian-600 uppercase tracking-widest mb-4 flex items-center">
                            <Sparkles size={14} className="mr-2 animate-pulse text-amber-500" />
                            Interpretación de Osiris
                          </h4>
                          <div className="text-slate-800 text-sm leading-relaxed prose prose-sm max-w-none prose-p:mb-2 italic">
                            <MarkdownRenderer content={dream.interpretation} />
                          </div>
                        </div>
                      )}
                      <div className="pt-2 flex justify-center">
                        <button
                          onClick={() => setIsExpanded(false)}
                          className="px-6 py-2 bg-obsidian-50 hover:bg-obsidian-100 text-obsidian-600 rounded-2xl text-[10px] uppercase font-bold tracking-[0.2em] transition-all"
                        >
                          Contraer mensaje
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DreamJournal;