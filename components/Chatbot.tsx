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
      <div className="bg-pink-600 p-4 text-white flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
          <span className="text-2xl">🔮</span>
        </div>
        <div>
          <h3 className="font-serif font-bold text-lg">Consejera Osiris</h3>
          <p className="text-xs text-pink-100 opacity-90">Terapia Jungiana & Sistémica</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-pink-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.sender === 'user' ? 'bg-pink-500 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-pink-100 rounded-tl-none'}`}>
              {msg.sender === 'user' ? (
                <p>{msg.text}</p>
              ) : (
                <div className="prose prose-pink max-w-none text-sm">
                  <ReactMarkdown
                    components={{
                      strong: ({node, ...props}) => <span className="font-bold text-pink-700" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-lg font-bold text-pink-800 mt-2 block" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
                      li: ({node, ...props}) => <li className="marker:text-pink-500" {...props} />
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
          <div className="flex justify-start"><div className="bg-white p-4 rounded-2xl border border-pink-100 text-pink-400">...</div></div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-pink-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escribe aquí tu consulta..."
            className="flex-1 p-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-400"
            disabled={isLoading}
          />
          <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-pink-600 text-white p-3 rounded-xl hover:bg-pink-700">➤</button>
        </div>
      </div>
    </div>
  );
}
