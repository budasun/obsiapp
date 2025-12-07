import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToOsiris } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'osiris';
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hola, soy tu consejera Osiris. Estoy aquí para acompañarte en tu ciclo y tus emociones. ¿Cómo te sientes hoy?',
      sender: 'osiris'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessageToOsiris(input);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), text: response, sender: 'osiris' };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-lg overflow-hidden border border-pink-100">
      {/* Header */}
      <div className="bg-pink-600 p-4 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <span className="text-2xl">🔮</span>
        </div>
        <div>
          <h3 className="font-serif font-bold text-lg">Consejera Osiris</h3>
          <p className="text-xs text-pink-100 opacity-90">Terapia Jungiana & Sistémica</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-pink-50/30">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-pink-500 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 border border-pink-100 rounded-tl-none'
              }`}
            >
              {msg.sender === 'user' ? (
                <p>{msg.text}</p>
              ) : (
                <div className="prose prose-sm prose-pink max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({node, ...props}) => <h3 className="text-lg font-bold text-pink-700 mt-2 mb-1" {...props} />,
                      h2: ({node, ...props}) => <h4 className="text-md font-bold text-pink-600 mt-2 mb-1" {...props} />,
                      h3: ({node, ...props}) => <strong className="block text-pink-600 mt-2" {...props} />,
                      strong: ({node, ...props}) => <span className="font-bold text-pink-800" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                      li: ({node, ...props}) => <li className="text-gray-700" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-pink-100">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-pink-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe aquí tu consulta..."
            className="flex-1 p-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400 text-gray-700 placeholder-pink-300"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-pink-600 text-white p-3 rounded-xl hover:bg-pink-700 disabled:opacity-50 transition-colors shadow-md"
          >
            <span className="text-xl">➤</span>
          </button>
        </div>
      </div>
    </div>
  );
}
