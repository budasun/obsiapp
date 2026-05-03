import React, { useState, useEffect, useRef } from 'react';
import { DreamEntry } from '../types';
import { analyzeDream } from '../services/aiService';
import { BookHeart, Send, Loader2, Sparkles, MessageCircle, Plus, ChevronLeft, Moon, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import MarkdownRenderer from './MarkdownRenderer';

export type ExtendedDreamEntry = DreamEntry & {
  chatHistory?: { id: string; role: 'user' | 'model'; text: string }[];
};

const DreamJournal: React.FC = () => {
  const { isOnline } = useApp();
  const [dreams, setDreams] = useState<ExtendedDreamEntry[]>(() => {
    const saved = localStorage.getItem('obsidiana_dreams');
    if (!saved) return [];

    const parsed: DreamEntry[] = JSON.parse(saved);
    return parsed.map(dream => {
      const extDream = dream as ExtendedDreamEntry;
      if (!extDream.chatHistory) {
        extDream.chatHistory = extDream.interpretation
          ? [{ id: `init-${dream.id}`, role: 'model', text: extDream.interpretation }]
          : [];
      }
      return extDream;
    });
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false); // NUEVO ESTADO PARA MÓVIL
  const [newDreamText, setNewDreamText] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('obsidiana_dreams', JSON.stringify(dreams));
  }, [dreams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [dreams, activeId, isAnalyzing]);

  const handleCreateDream = async () => {
    if (!newDreamText.trim()) return;

    const newId = Date.now().toString();
    const newEntry: ExtendedDreamEntry = {
      id: newId,
      date: new Date().toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }),
      content: newDreamText,
      tags: ['Inconsciente'],
      chatHistory: []
    };

    setDreams(prev => [newEntry, ...prev]);
    setActiveId(newId);
    setIsCreating(false);
    setNewDreamText('');

    if (!isOnline) {
      // Offline: save dream without AI analysis, inform user
      setDreams(prev => prev.map(d =>
        d.id === newId ? {
          ...d,
          interpretation: '🌙 _Sueño guardado offline. La interpretación de Osiris estará disponible cuando recuperes conexión._',
          chatHistory: [{ id: Date.now().toString(), role: 'model', text: '🌙 _Sueño guardado offline. La interpretación de Osiris estará disponible cuando recuperes conexión._' }]
        } : d
      ));
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeDream(newEntry.content);
      setDreams(prev => prev.map(d =>
        d.id === newId ? {
          ...d,
          interpretation: analysis,
          chatHistory: [{ id: Date.now().toString(), role: 'model', text: analysis }]
        } : d
      ));
    } catch (error) {
      console.error("Error analyzing dream:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendFollowUp = async () => {
    if (!isOnline) return;
    if (!chatInput.trim() || !activeId) return;

    const activeDream = dreams.find(d => d.id === activeId);
    if (!activeDream) return;

    const userMsgId = Date.now().toString();
    const newHistory = [...(activeDream.chatHistory || []), { id: userMsgId, role: 'user' as const, text: chatInput }];

    setDreams(prev => prev.map(d => d.id === activeId ? { ...d, chatHistory: newHistory } : d));
    setChatInput('');
    setIsAnalyzing(true);

    try {
      const contextPrompt = `Sueño original de la usuaria: "${activeDream.content}"\n\nHistorial de análisis previo:\n${newHistory.map(m => `${m.role === 'user' ? 'Usuaria' : 'Osiris'}: ${m.text}`).join('\n\n')}\n\nPor favor, responde directamente a la última pregunta de la usuaria profundizando en la interpretación del sueño bajo tu rol de Consejera Osiris, experta en arquetipos y la Sombra.`;

      const response = await analyzeDream(contextPrompt);

      setDreams(prev => prev.map(d => d.id === activeId ? {
        ...d,
        chatHistory: [...newHistory, { id: (Date.now() + 1).toString(), role: 'model', text: response }]
      } : d));
    } catch (error) {
      console.error("Error in follow-up:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const activeDream = dreams.find(d => d.id === activeId);

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col md:flex-row gap-6 animate-fade-in pb-4">

      {/* PANEL IZQUIERDO: Lista de Sueños */}
      <div className={`w-full md:w-1/3 bg-white rounded-3xl shadow-sm border border-obsidian-100 flex flex-col overflow-hidden ${(activeId || isCreating) ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-obsidian-50 bg-obsidian-50/30 flex justify-between items-center">
          <h2 className="font-serif text-xl font-bold text-obsidian-900 flex items-center gap-2">
            <BookHeart className="text-obsidian-600" size={20} /> Mi Diario
          </h2>
          <button
            onClick={() => {
              setActiveId(null);
              setIsCreating(true); // Encendemos modo creación
            }}
            className="p-2 bg-obsidian-800 hover:bg-black text-white rounded-xl transition-all shadow-md active:scale-95"
            title="Registrar nuevo sueño"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-obsidian-200">
          {dreams.length === 0 ? (
            <div className="text-center py-10 px-4 text-gray-400">
              <Moon size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Aún no hay sueños. Escribe el primero para comenzar la alquimia.</p>
            </div>
          ) : (
            dreams.map((dream) => (
              <button
                key={dream.id}
                onClick={() => {
                  setActiveId(dream.id);
                  setIsCreating(false); // Apagamos modo creación si elegimos un sueño
                }}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${activeId === dream.id ? 'bg-obsidian-50 border-obsidian-200 shadow-sm' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-100'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-obsidian-400 uppercase tracking-widest">{dream.date}</span>
                  {dream.chatHistory && dream.chatHistory.length > 1 && (
                    <span className="flex items-center text-[9px] font-bold bg-white px-2 py-0.5 rounded-md text-gray-400 border border-gray-100">
                      <MessageCircle size={10} className="mr-1" /> {Math.floor(dream.chatHistory.length / 2)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed font-serif italic">"{dream.content}"</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* PANEL DERECHO: Vista Activa (Nuevo Sueño o Chat) */}
      <div className={`w-full md:w-2/3 bg-white rounded-3xl shadow-sm border border-obsidian-100 flex flex-col overflow-hidden ${!(activeId || isCreating) ? 'hidden md:flex' : 'flex'}`}>

        {/* ESTADO A: Redactar Nuevo Sueño */}
        {!activeId ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Header Móvil para cancelar y regresar a la lista */}
            <div className="md:hidden flex items-center p-4 border-b border-gray-100 bg-white">
              <button onClick={() => setIsCreating(false)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg mr-2">
                <ChevronLeft size={24} />
              </button>
              <h3 className="font-serif font-bold text-gray-900">Registrar Sueño</h3>
            </div>

            <div className="flex-1 flex flex-col p-6 md:p-10 justify-center overflow-y-auto">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-obsidian-50 rounded-full mb-4 text-obsidian-600">
                  <Moon size={28} />
                </div>
                <h3 className="text-3xl font-serif text-obsidian-900 mb-2">El Lenguaje de la Sombra</h3>
                <p className="text-gray-500 max-w-md mx-auto">Registra las imágenes de tu inconsciente al despertar. Osiris te ayudará a decodificar el mensaje oculto de tu útero.</p>
              </div>

              <div className="bg-gray-50 p-2 rounded-2xl border border-gray-200 shadow-inner focus-within:ring-2 focus-within:ring-obsidian-200 focus-within:bg-white transition-all">
                <textarea
                  value={newDreamText}
                  onChange={(e) => setNewDreamText(e.target.value)}
                  placeholder="Hoy soñé que bajaba por una escalera oscura hacia una cueva y me encontraba con..."
                  className="w-full h-40 p-4 bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-400 font-serif text-lg leading-relaxed"
                />
                <div className="flex justify-end p-2 border-t border-gray-200">
                  {!isOnline && (
                    <div className="flex items-center gap-2 text-amber-600 text-xs font-medium mr-auto">
                      <WifiOff size={14} />
                      <span>Sin conexión — se guardará localmente</span>
                    </div>
                  )}
                  <button
                    onClick={handleCreateDream}
                    disabled={isAnalyzing || !newDreamText.trim()}
                    className="flex items-center space-x-2 bg-obsidian-800 hover:bg-black text-white px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <><Loader2 size={18} className="animate-spin" /> <span>Consultando al Oráculo...</span></>
                    ) : !isOnline ? (
                      <><WifiOff size={18} /> <span>Guardar Sueño (Offline)</span></>
                    ) : (
                      <><Sparkles size={18} /> <span>Interpretar Sueño</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (

          /* ESTADO B: Vista de Chat del Sueño Activo */
          <div className="flex flex-col h-full bg-gray-50/30">
            <div className="md:hidden flex items-center p-4 border-b border-gray-100 bg-white">
              <button onClick={() => setActiveId(null)} className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg mr-2">
                <ChevronLeft size={24} />
              </button>
              <div>
                <h3 className="font-serif font-bold text-gray-900">Análisis del Sueño</h3>
                <p className="text-[10px] text-gray-500 uppercase">{activeDream?.date}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-thin scrollbar-thumb-gray-200">
              <div className="bg-obsidian-50/50 border border-obsidian-100 rounded-2xl p-5 md:p-8 relative mt-4 mx-2">
                <div className="absolute -top-4 left-6 bg-obsidian-800 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-md shadow-sm">
                  Tu Sueño
                </div>
                <p className="font-serif text-lg md:text-xl text-gray-900 leading-relaxed italic">"{activeDream?.content}"</p>
              </div>

              {activeDream?.chatHistory?.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${msg.role === 'user'
                    ? 'bg-obsidian-800 text-white rounded-br-sm'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                    {msg.role === 'model' && (
                      <div className="flex items-center gap-2 mb-2 text-obsidian-600">
                        <Sparkles size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Osiris</span>
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
                    <span className="text-sm font-medium animate-pulse">Explorando la sombra...</span>
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
                  onKeyPress={(e) => e.key === 'Enter' && isOnline && handleSendFollowUp()}
                  disabled={!isOnline}
                  placeholder="Profundiza: '¿Qué significa la cueva en este sueño?'..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-obsidian-200 text-gray-900 placeholder-gray-500 shadow-inner"
                />
                <button
                  onClick={handleSendFollowUp}
                  disabled={isAnalyzing || !chatInput.trim() || !isOnline}
                  className="bg-obsidian-800 hover:bg-black text-white p-3.5 rounded-xl transition-all disabled:opacity-50 shadow-md active:scale-95"
                  title={!isOnline ? 'Requiere conexión a internet' : ''}
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

export default DreamJournal;