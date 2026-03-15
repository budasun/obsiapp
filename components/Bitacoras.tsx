import React, { useState, useEffect, useRef } from 'react';
import { analyzeBitacora } from '../services/aiService';
import { ScrollText, Send, Loader2, Sparkles, MessageCircle, Plus, ChevronLeft, Library } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

export interface BitacoraEntry {
  id: string;
  date: string;
  content: string;
  interpretation?: string;
  tags?: string[];
  chatHistory?: { id: string; role: 'user' | 'model'; text: string }[];
}

const Bitacoras: React.FC = () => {
  const [bitacoras, setBitacoras] = useState<BitacoraEntry[]>(() => {
    const saved = localStorage.getItem('obsidiana_bitacoras');
    if (!saved) return [];

    const parsed: BitacoraEntry[] = JSON.parse(saved);
    return parsed.map(entry => {
      if (!entry.chatHistory) {
        entry.chatHistory = entry.interpretation
          ? [{ id: `init-${entry.id}`, role: 'model', text: entry.interpretation }]
          : [];
      }
      return entry;
    });
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newEntryText, setNewEntryText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('obsidiana_bitacoras', JSON.stringify(bitacoras));
  }, [bitacoras]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [bitacoras, activeId, isAnalyzing]);

  const handleCreateEntry = async () => {
    if (!newEntryText.trim()) return;

    setIsAnalyzing(true);
    const newId = Date.now().toString();
    const newEntry: BitacoraEntry = {
      id: newId,
      date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
      content: newEntryText,
      tags: ['Bitácora', 'Investigación'],
      chatHistory: []
    };

    setBitacoras(prev => [newEntry, ...prev]);
    setActiveId(newId);
    setIsCreating(false);
    setNewEntryText('');

    try {
      const prompt = `Analiza y proporciona contexto expansivo sobre la siguiente nota o investigación: "${newEntry.content}"`;
      const analysis = await analyzeBitacora(prompt);
      setBitacoras(prev => prev.map(v =>
        v.id === newId ? {
          ...v,
          interpretation: analysis,
          chatHistory: [{ id: Date.now().toString(), role: 'model', text: analysis }]
        } : v
      ));
    } catch (error) {
      console.error("Error analyzing bitacora:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!chatInput.trim() || !activeId) return;

    const activeEntry = bitacoras.find(v => v.id === activeId);
    if (!activeEntry) return;

    const userMsgId = Date.now().toString();
    const newHistory = [...(activeEntry.chatHistory || []), { id: userMsgId, role: 'user' as const, text: chatInput }];

    setBitacoras(prev => prev.map(v => v.id === activeId ? { ...v, chatHistory: newHistory } : v));
    setChatInput('');
    setIsAnalyzing(true);

    try {
      const contextPrompt = `Nota o tema original: "${activeEntry.content}"\n\nHistorial de exploración previa:\n${newHistory.map(m => `${m.role === 'user' ? 'Usuaria' : 'LlamaSearch'}: ${m.text}`).join('\n\n')}\n\nPor favor, responde directamente a la última pregunta de la usuaria profundizando y sirviendo como motor de búsqueda avanzado. No dudes en dar referencias o links en Markdown [como este](https://ejemplo.com).`;

      const response = await analyzeBitacora(contextPrompt);

      setBitacoras(prev => prev.map(v => v.id === activeId ? {
        ...v,
        chatHistory: [...newHistory, { id: (Date.now() + 1).toString(), role: 'model', text: response }]
      } : v));
    } catch (error) {
      console.error("Error in follow-up:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeEntry = bitacoras.find(v => v.id === activeId);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 animate-fade-in pb-4">

      {/* PANEL IZQUIERDO: Lista de Bitácoras */}
      <div className={`w-full md:w-1/3 bg-white rounded-3xl shadow-sm border border-obsidian-100 flex flex-col overflow-hidden ${(activeId || isCreating) ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-obsidian-50 bg-obsidian-50/30 flex justify-between items-center">
          <h2 className="font-serif text-xl font-bold text-obsidian-900 flex items-center gap-2">
            <ScrollText className="text-obsidian-600" size={20} /> Bitácoras
          </h2>
          <button
            onClick={() => {
              setActiveId(null);
              setIsCreating(true);
            }}
            className="p-2 bg-obsidian-800 hover:bg-black text-white rounded-xl transition-all shadow-md active:scale-95"
            title="Nueva nota"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-obsidian-200">
          {bitacoras.length === 0 ? (
            <div className="text-center py-10 px-4 text-gray-400">
              <Library size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Aún no hay bitácoras. Registra tus estudios o pensamientos.</p>
            </div>
          ) : (
            bitacoras.map((entry) => (
              <button
                key={entry.id}
                onClick={() => {
                  setActiveId(entry.id);
                  setIsCreating(false);
                }}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${activeId === entry.id ? 'bg-obsidian-50 border-obsidian-200 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-obsidian-400 uppercase tracking-widest">{entry.date}</span>
                  {entry.chatHistory && entry.chatHistory.length > 1 && (
                    <span className="flex items-center text-[9px] font-bold bg-white px-2 py-0.5 rounded-md text-gray-400 border border-gray-100">
                      <MessageCircle size={10} className="mr-1" /> {Math.floor(entry.chatHistory.length / 2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed font-serif italic">"{entry.content}"</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* PANEL DERECHO: Vista Activa */}
      <div className={`w-full md:w-2/3 bg-white rounded-3xl shadow-sm border border-obsidian-100 flex flex-col overflow-hidden ${!(activeId || isCreating) ? 'hidden md:flex' : 'flex'}`}>

        {/* ESTADO A: Redactar Nueva Nota */}
        {!activeId ? (
          <div className="flex-1 flex flex-col h-full">
            <div className="md:hidden flex items-center p-4 border-b border-gray-100 bg-white">
              <button onClick={() => setIsCreating(false)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg mr-2">
                <ChevronLeft size={24} />
              </button>
              <h3 className="font-serif font-bold text-gray-900">Nueva Nota</h3>
            </div>

            <div className="flex-1 flex flex-col p-6 md:p-10 justify-center overflow-y-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-obsidian-50 rounded-full mb-4 text-obsidian-600">
                  <Library size={28} />
                </div>
                <h3 className="text-3xl font-serif text-obsidian-900 mb-2">Buscador y Biblioteca</h3>
                <p className="text-gray-500 max-w-md mx-auto">Ingresa un tema, un concepto para investigar o una reflexión personal. Nuestra IA actuará como tu buscador para profundizar en ello.</p>
              </div>

              <div className="bg-gray-50 p-2 rounded-2xl border border-gray-200 shadow-inner focus-within:ring-2 focus-within:ring-obsidian-200 focus-within:bg-white transition-all">
                <textarea
                  value={newEntryText}
                  onChange={(e) => setNewEntryText(e.target.value)}
                  placeholder="Ej: Quiero saber más sobre las diosas oscuras mesopotámicas..."
                  className="w-full h-40 p-4 bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-400 font-serif text-lg leading-relaxed"
                />
                <div className="flex justify-end p-2 border-t border-gray-200">
                  <button
                    onClick={handleCreateEntry}
                    disabled={isAnalyzing || !newEntryText.trim()}
                    className="flex items-center space-x-2 bg-obsidian-800 hover:bg-black text-white px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <><Loader2 size={18} className="animate-spin" /> <span>Consultando...</span></>
                    ) : (
                      <><Sparkles size={18} /> <span>Investigar</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (

          /* ESTADO B: Chat / Búsqueda */
          <div className="flex flex-col h-full bg-gray-50/30">
            <div className="md:hidden flex items-center p-4 border-b border-gray-100 bg-white">
              <button onClick={() => setActiveId(null)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg mr-2">
                <ChevronLeft size={24} />
              </button>
              <div>
                <h3 className="font-serif font-bold text-gray-900">Bitácora Activa</h3>
                <p className="text-[10px] text-gray-500 uppercase">{activeEntry?.date}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              <div className="bg-obsidian-50/50 border border-obsidian-100 rounded-2xl p-5 md:p-8 relative mt-4 mx-2">
                <div className="absolute -top-4 left-6 bg-obsidian-800 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md shadow-sm">
                  Punto de Partida
                </div>
                <p className="font-serif text-lg md:text-xl text-gray-900 leading-relaxed italic">"{activeEntry?.content}"</p>
              </div>

              {activeEntry?.chatHistory?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${msg.role === 'user'
                    ? 'bg-obsidian-800 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                    {msg.role === 'model' && (
                      <div className="flex items-center gap-2 mb-2 text-obsidian-600">
                        <Sparkles size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Motor de Investigación</span>
                      </div>
                    )}
                    <div className={`prose prose-sm max-w-none ${msg.role === 'user' ? 'text-white' : 'text-gray-800'} prose-p:leading-relaxed`}>
                      {msg.role === 'user' ? <p>{msg.text}</p> : <MarkdownRenderer content={msg.text} />}
                    </div>
                  </div>
                </div>
              ))}

              {isAnalyzing && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-6 py-5 shadow-sm flex items-center space-x-3 text-obsidian-500">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm font-medium animate-pulse">Buscando y sintetizando...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex items-center gap-3 max-w-4xl mx-auto">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendFollowUp()}
                  placeholder="Pregunta más a fondo sobre el tema..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-obsidian-200 text-gray-900 placeholder-gray-500 shadow-inner"
                />
                <button
                  onClick={handleSendFollowUp}
                  disabled={isAnalyzing || !chatInput.trim()}
                  className="bg-obsidian-800 hover:bg-black text-white p-3.5 rounded-xl transition-all disabled:opacity-50 shadow-md active:scale-95"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bitacoras;
