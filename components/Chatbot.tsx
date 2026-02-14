import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';
import { sendMessageToOsiris } from '../services/geminiService';
import { MessageCircleHeart, Send, Loader2, User } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'model',
      text: 'Bienvenida, hermana. Soy Osiris, guardiana de la memoria obsidiana. ¿En qué fase de tu ciclo te encuentras hoy y qué siente tu corazón?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await sendMessageToOsiris(input);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-obsidian-100 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="bg-obsidian-50 p-4 border-b border-obsidian-100 flex items-center space-x-3">
        <div className="bg-obsidian-200 p-2 rounded-full">
          <MessageCircleHeart size={20} className="text-obsidian-700" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-obsidian-900">Consejera Osiris</h3>
          <p className="text-xs text-obsidian-600">Terapia Arquetípica & Sistémica</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${msg.role === 'user'
                ? 'bg-obsidian-600 shadow-md rounded-br-none text-white'
                : 'bg-white text-black border border-obsidian-100 shadow-sm rounded-bl-none'
                }`}
            >
              <MarkdownRenderer content={msg.text} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
              <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pregunta sobre arquetipos, emociones o el uso del huevo..."
            className="flex-1 bg-white border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-obsidian-100 text-gray-900 placeholder-gray-500 shadow-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-obsidian-600 hover:bg-obsidian-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;