import React, { useState, useEffect } from 'react';
import { GLOSSARY_DATA } from '../constants';
import { BookOpen, Search, ExternalLink, Diamond, Globe, Loader2, X } from 'lucide-react';

// Interfaz para unificar qué mostramos en el Modal (sea del libro o de la búsqueda)
interface ModalData {
    url: string;
    title: string;
}

const Glossary: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [wikiResults, setWikiResults] = useState<any[]>([]);
    const [isSearchingWiki, setIsSearchingWiki] = useState(false);

    // Estado unificado para el Modal
    const [selectedModalData, setSelectedModalData] = useState<ModalData | null>(null);

    // Función para normalizar texto (quitar acentos, pasar a minúsculas)
    const normalizeText = (text: string) => {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    // Integración de búsqueda en Wikipedia
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

    // Filtrado del glosario local
    const filteredTerms = GLOSSARY_DATA.filter(item => {
        const search = normalizeText(searchTerm);
        const termNorm = normalizeText(item.term);
        const defNorm = normalizeText(item.definition);
        const obsNorm = normalizeText(item.obsidianPerspective);

        const keywordsMatch = item.keywords ? item.keywords.some(k => normalizeText(k).includes(search)) : false;

        return (
            termNorm.includes(search) ||
            defNorm.includes(search) ||
            obsNorm.includes(search) ||
            keywordsMatch
        );
    });

    // Bloquear el scroll del fondo cuando el modal está abierto
    useEffect(() => {
        if (selectedModalData) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [selectedModalData]);

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <header className="text-center mb-8">
                <h2 className="text-3xl font-serif text-obsidian-900 mb-2">Glosario Ginecológico & Energético</h2>
                <p className="text-gray-600">Integrando la definición médica con la visión holística de la obsidiana.</p>
            </header>

            <div className="relative max-w-xl mx-auto mb-8">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-obsidian-400" size={20} />
                <input
                    type="text"
                    placeholder="Busca por síntoma, término o palabra clave (ej. VPH, Cólicos)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-obsidian-100 bg-white text-gray-900 focus:ring-4 focus:ring-obsidian-100 focus:border-obsidian-300 outline-none shadow-sm placeholder-gray-400 transition-all font-sans"
                />
            </div>

            {filteredTerms.length === 0 && wikiResults.length === 0 ? (
                <div className="text-center py-16 text-gray-400 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                    <BookOpen size={48} className="mx-auto mb-4 opacity-30 text-obsidian-400" />
                    <p className="font-serif text-lg text-obsidian-800">No se encontraron términos para "{searchTerm}".</p>
                    <p className="text-sm mt-2 font-medium">Intenta con palabras más generales o busca la raíz emocional.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* RESULTADOS INTERNOS (Tu Libro) */}
                    {filteredTerms.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredTerms.map((item, index) => (
                                <div key={index} className="bg-white rounded-3xl shadow-sm border border-obsidian-50 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-serif font-bold text-obsidian-900 group-hover:text-obsidian-700 transition-colors">{item.term}</h3>

                                            {/* SOLUCIÓN: Cambiado a botón para abrir Modal en lugar de target="_blank" */}
                                            <button
                                                onClick={() => {
                                                    // Convertimos la URL normal de Wikipedia a su versión móvil (.m.)
                                                    const mobileUrl = item.wikiUrl.replace('es.wikipedia.org', 'es.m.wikipedia.org');
                                                    setSelectedModalData({ url: mobileUrl, title: item.term });
                                                }}
                                                className="p-2 bg-obsidian-50 rounded-full text-obsidian-400 hover:text-obsidian-600 hover:bg-obsidian-100 transition-colors"
                                                title="Leer en Wikipedia sin salir de la app"
                                            >
                                                <ExternalLink size={16} />
                                            </button>
                                        </div>

                                        <div className="mb-5">
                                            <p className="text-sm text-gray-700 leading-relaxed font-sans">{item.definition}</p>
                                        </div>

                                        <div className="bg-obsidian-50/50 p-5 rounded-2xl border-l-4 border-obsidian-500">
                                            <div className="flex items-center space-x-2 mb-2 text-obsidian-700">
                                                <Diamond size={14} className="animate-pulse" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Alquimia de la Obsidiana</span>
                                            </div>
                                            <p className="text-sm text-gray-900 italic leading-relaxed">"{item.obsidianPerspective}"</p>
                                        </div>

                                        {item.keywords && (
                                            <div className="mt-5 pt-4 border-t border-gray-50 flex flex-wrap gap-2">
                                                {item.keywords.map(k => (
                                                    <span key={k} className="text-[9px] uppercase font-bold text-obsidian-400 bg-obsidian-50 px-2.5 py-1 rounded-lg border border-obsidian-100">
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

                    {/* RESULTADOS DE WIKIPEDIA (Búsqueda Dinámica) */}
                    {wikiResults.length > 0 && (
                        <div className="animate-fade-in pt-8 border-t border-gray-100">
                            <div className="flex items-center space-x-3 mb-6">
                                <div className="p-2 bg-blue-50 rounded-xl text-blue-500">
                                    <Globe size={24} />
                                </div>
                                <h3 className="text-2xl font-serif text-gray-900 font-bold">Enciclopedia Médica (Wikipedia)</h3>
                                {isSearchingWiki && <Loader2 size={18} className="animate-spin text-blue-400 ml-2" />}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {wikiResults.map((wiki) => (
                                    <button
                                        key={wiki.pageid}
                                        onClick={() => setSelectedModalData({
                                            url: `https://es.m.wikipedia.org/?curid=${wiki.pageid}`,
                                            title: wiki.title
                                        })}
                                        className="text-left bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all group flex flex-col justify-between w-full focus:outline-none focus:ring-4 focus:ring-blue-50"
                                    >
                                        <div>
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-serif font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{wiki.title}</h4>
                                                <div className="p-1.5 bg-gray-50 rounded-full group-hover:bg-blue-50 transition-colors">
                                                    <ExternalLink size={14} className="text-gray-400 group-hover:text-blue-500" />
                                                </div>
                                            </div>
                                            <div
                                                className="text-sm text-gray-600 leading-relaxed line-clamp-3 wiki-snippet font-sans"
                                                dangerouslySetInnerHTML={{ __html: wiki.snippet + '...' }}
                                            />
                                        </div>
                                        <div className="mt-5 text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center">
                                            Leer artículo completo dentro de la app
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL UNIFICADO */}
            {selectedModalData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-obsidian-900/80 backdrop-blur-sm animate-fade-in">
                    <div
                        className="bg-white rounded-[2rem] w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl transform animate-slide-up border border-obsidian-100"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header del Modal */}
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/80 backdrop-blur-md z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                    <Globe size={20} />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-lg text-gray-900 leading-tight">{selectedModalData.title}</h3>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Wikipedia • Versión Móvil</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedModalData(null)}
                                className="p-2.5 bg-white rounded-full text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm border border-gray-200 active:scale-95"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Contenido del Modal (Iframe) */}
                        <div className="flex-1 bg-white relative w-full h-full">
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 -z-10">
                                <Loader2 className="animate-spin text-gray-300" size={32} />
                            </div>
                            <iframe
                                src={selectedModalData.url}
                                className="w-full h-full border-0"
                                title={selectedModalData.title}
                                sandbox="allow-same-origin allow-scripts allow-popups"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Glossary;