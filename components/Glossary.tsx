import React, { useState, useEffect } from 'react';
import { GLOSSARY_DATA } from '../constants';
import { BookOpen, Search, ExternalLink, Diamond, Globe, Loader2 } from 'lucide-react';

const Glossary: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Helper to normalize text (remove accents, lowercase) for smart search
    const normalizeText = (text: string) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const [wikiResults, setWikiResults] = useState<any[]>([]);
    const [isSearchingWiki, setIsSearchingWiki] = useState(false);

    // Wikipedia search integration
    useEffect(() => {
        if (searchTerm.length < 3) {
            setWikiResults([]);
            return;
        }

        const searchWiki = async () => {
            setIsSearchingWiki(true);
            try {
                const response = await fetch(
                    `https://es.wikipedia.org/w/api.php?action=query&list=search&srsearch=${searchTerm}&format=json&origin=*`
                );
                const data = await response.json();
                if (data.query && data.query.search) {
                    setWikiResults(data.query.search);
                }
            } catch (error) {
                console.error("Wikipedia search error:", error);
            } finally {
                setIsSearchingWiki(false);
            }
        };

        const timer = setTimeout(searchWiki, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

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

            {filteredTerms.length === 0 && wikiResults.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                    <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                    <p className="font-serif">No se encontraron términos para "{searchTerm}".</p>
                    <p className="text-sm mt-2">Intenta con palabras más generales o revisa tu conexión.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Internal Results */}
                    {filteredTerms.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredTerms.map((item, index) => (
                                <div key={index} className="bg-white rounded-2xl shadow-sm border border-obsidian-50 overflow-hidden hover-lift transition-obsidian group">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="text-xl font-serif font-bold text-obsidian-900">{item.term}</h3>
                                            <a
                                                href={item.wikiUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-obsidian-50 rounded-full text-obsidian-400 hover:text-obsidian-600 transition-colors"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-sm text-gray-800 leading-relaxed font-sans">{item.definition}</p>
                                        </div>

                                        <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-obsidian-400">
                                            <div className="flex items-center space-x-2 mb-2 text-obsidian-700">
                                                <Diamond size={14} />
                                                <span className="text-xs font-bold uppercase tracking-widest">Alquimia Sagrada</span>
                                            </div>
                                            <p className="text-sm text-black italic">"{item.obsidianPerspective}"</p>
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

                    {/* Wikipedia Results */}
                    {wikiResults.length > 0 && (
                        <div className="animate-fade-in">
                            <div className="flex items-center space-x-3 mb-6 border-b border-gray-200 pb-4">
                                <Globe className="text-blue-500" size={24} />
                                <h3 className="text-2xl font-serif text-gray-800 font-bold">Enciclopedia Médica (Wikipedia)</h3>
                                {isSearchingWiki && <Loader2 size={18} className="animate-spin text-gray-400" />}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {wikiResults.map((wiki) => (
                                    <a
                                        key={wiki.pageid}
                                        href={`https://es.wikipedia.org/?curid=${wiki.pageid}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-serif font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{wiki.title}</h4>
                                                <ExternalLink size={14} className="text-gray-300 group-hover:text-blue-400" />
                                            </div>
                                            <div
                                                className="text-sm text-gray-600 leading-relaxed line-clamp-3 wiki-snippet"
                                                dangerouslySetInnerHTML={{ __html: wiki.snippet + '...' }}
                                            />
                                        </div>
                                        <div className="mt-4 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center">
                                            Wikipedia.org • Fuente Externa
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Glossary;