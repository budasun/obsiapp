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
      text: '### Hola, soy Osiris 🌙\nEstoy aquí para acompañarte en tu ciclo. **¿Cómo te sientes hoy?**',
      sender: 'osiris'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendMessageToOsiris(input);
      setMessages(prev => [...prev, { id: Date.now().toString(), text: response, sender: 'osiris' }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-2xl shadow-lg border border-pink-100 overflow-hidden">
      <div className="bg-pink-600 p-4 text-white font-bold text-lg flex items-center gap-2">
        <span>🔮</span> Consejera Osiris
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm ${
                msg.sender === 'user' 
                  ? 'bg-pink-600 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
              }`}
            >
              {msg.sender === 'user' ? (
                msg.text
              ) : (
                /* AQUÍ ESTÁ EL FORMATO MARKDOWN */
                <ReactMarkdown
                  components={{
                    // Títulos grandes y rosas
                    h1: ({node, ...props}) => <h1 style={{fontSize: '1.5em', fontWeight: 'bold', color: '#be185d', marginTop: '10px'}} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{fontSize: '1.3em', fontWeight: 'bold', color: '#be185d', marginTop: '8px'}} {...props} />,
                    h3: ({node, ...props}) => <h3 style={{fontSize: '1.1em', fontWeight: 'bold', color: '#db2777', marginTop: '6px'}} {...props} />,
                    // Negritas oscuras
                    strong: ({node, ...props}) => <strong style={{fontWeight: 'bold', color: '#831843'}} {...props} />,
                    // Listas con puntos
                    ul: ({node, ...props}) => <ul style={{listStyleType: 'disc', paddingLeft: '20px', margin: '10px 0'}} {...props} />,
                    li: ({node, ...props}) => <li style={{marginBottom: '4px'}} {...props} />,
                    // Párrafos
                    p: ({node, ...props}) => <p style={{marginBottom: '8px', lineHeight: '1.6'}} {...props} />
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              )}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-pink-400 text-xs p-2 animate-pulse">Escribiendo...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-white flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Escribe aquí..."
          className="flex-1 p-3 border border-pink-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading} className="bg-pink-600 text-white p-3 rounded-xl hover:bg-pink-700">➤</button>
      </div>
    </div>
  );
}
