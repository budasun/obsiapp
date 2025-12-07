import React, { useState } from 'react';
import { GLOSSARY_DATA } from '../constants';
import { BookOpen, Search, ExternalLink, Diamond } from 'lucide-react';

const Glossary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Helper to normalize text (remove accents, lowercase) for smart search
  const normalizeText = (text: string) => {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const filteredTerms = GLOSSARY_DATA.filter(item => {
    const search = normalizeText(searchTerm);
    const termNorm = normalizeText(item.term);
    const defNorm = normalizeText(item.definition);
    const obsNorm = normalizeText(item.obsidianPerspective);
    
    // Check keywords if they exist
    const keywordsMatch = item.keywords ? item.keywords.some(k => normalizeText(k).includes(search)) : false;

    return (
        termNorm.includes(search) || 
        defNorm.includes(search) ||
        obsNorm.includes(search) ||
        keywordsMatch
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
        <header className="text-center mb-8">
            <h2 className="text-3xl font-serif text-obsidian-900 mb-2">Glosario Ginecológico & Energético</h2>
            <p className="text-gray-600">Integrando la definición médica con la visión holística de la obsidiana (Capítulo 12).</p>
        </header>

        <div className="relative max-w-xl mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={20} />
            <input 
                type="text" 
                placeholder="Busca por síntoma, término o palabra clave (ej. VPH)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-obsidian-200 focus:border-transparent outline-none shadow-sm placeholder-gray-500"
            />
        </div>

        {filteredTerms.length === 0 ? (
             <div className="text-center py-12 text-gray-400">
                <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                <p>No se encontraron términos para "{searchTerm}".</p>
                <p className="text-sm mt-2">Intenta con palabras más generales.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTerms.map((item, index) => (
                    <div key={index} className="bg-white rounded-2xl shadow-sm border border-obsidian-50 overflow-hidden hover:shadow-md transition-shadow">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-3">
                                <h3 className="text-xl font-serif font-bold text-obsidian-900">{item.term}</h3>
                                <a 
                                    href={item.wikiUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-obsidian-500 transition-colors"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                            
                            <div className="mb-4">
                                <p className="text-sm text-gray-700 leading-relaxed">{item.definition}</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-obsidian-400">
                                <div className="flex items-center space-x-2 mb-2 text-obsidian-700">
                                    <Diamond size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Perspectiva Obsidiana</span>
                                </div>
                                <p className="text-sm text-slate-800 italic">"{item.obsidianPerspective}"</p>
                            </div>

                            {item.keywords && (
                                <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                                    {item.keywords.map(k => (
                                        <span key={k} className="text-[10px] uppercase font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                            {k}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

export default Glossary;