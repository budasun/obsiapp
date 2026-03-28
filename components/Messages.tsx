import React, { useState, useEffect } from 'react';
import { UserProfile, PrivateMessage } from '../types';
import { supabase } from '../src/lib/supabaseClient';
import { Mail, Send, ArrowLeft, MessageCircle, Inbox, Users, Sparkles, Search } from 'lucide-react';

interface MessagesProps {
    user: UserProfile;
}

interface DirectoryUser {
    id: string;
    name: string;
    avatarUrl?: string;
}

const MESSAGES_STORAGE_KEY = 'obsidiana_private_messages';

const loadLocalMessages = (): PrivateMessage[] => {
    try {
        const saved = localStorage.getItem(MESSAGES_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

const saveLocalMessages = (messages: PrivateMessage[]) => {
    try {
        localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
        console.error("Error guardando mensajes en localStorage:", error);
    }
};

const Messages: React.FC<MessagesProps> = ({ user }) => {
    const initialMessages = loadLocalMessages();

    const initialConversations = initialMessages.reduce((acc: Record<string, PrivateMessage[]>, msg) => {
        const otherUser = msg.from === user.name ? msg.to : msg.from;
        if (!acc[otherUser]) acc[otherUser] = [];
        acc[otherUser].push(msg);
        return acc;
    }, {});

    const [messages, setMessages] = useState<PrivateMessage[]>(initialMessages);
    const [conversations, setConversations] = useState<Record<string, PrivateMessage[]>>(initialConversations);

    const [loading, setLoading] = useState<boolean>(initialMessages.length === 0);

    const [view, setView] = useState<'inbox' | 'directory'>('inbox');
    const [activeConversation, setActiveConversation] = useState<string | null>(null);
    const [directoryUsers, setDirectoryUsers] = useState<DirectoryUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newMessage, setNewMessage] = useState('');

    useEffect(() => {
        const fallbackTimer = setTimeout(() => {
            if (loading) setLoading(false);
        }, 2500);

        const loadMessages = async () => {
            try {
                const { data, error } = await supabase
                    .from('private_messages')
                    .select('*')
                    .or(`to.eq.${user.name},from.eq.${user.name}`)
                    .order('created_at', { ascending: false });

                clearTimeout(fallbackTimer);

                if (error) throw error;

                const messagesData = (data || []).map(msg => ({
                    ...msg,
                    id: msg.id,
                    timestamp: msg.created_at ? new Intl.DateTimeFormat('es-ES', {
                        dateStyle: 'medium', timeStyle: 'short'
                    }).format(new Date(msg.created_at)) : 'Recién enviado'
                })) as PrivateMessage[];

                setMessages(messagesData);
                saveLocalMessages(messagesData);

                const convs: Record<string, PrivateMessage[]> = {};
                messagesData.forEach(msg => {
                    const otherUser = msg.from === user.name ? msg.to : msg.from;
                    if (!convs[otherUser]) convs[otherUser] = [];
                    convs[otherUser].push(msg);
                });
                setConversations(convs);
                setLoading(false);
            } catch (error) {
                console.error("Supabase desconectado para mensajes:", error);
                clearTimeout(fallbackTimer);
                setLoading(false);
            }
        };

        loadMessages();

        const channel = supabase
            .channel('messages_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages' }, () => {
                loadMessages();
            })
            .subscribe();

        return () => {
            clearTimeout(fallbackTimer);
            supabase.removeChannel(channel);
        };
    }, [user.name, loading]);

    useEffect(() => {
        const loadDirectory = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('profile_complete', true);

            if (!error && data) {
                setDirectoryUsers(data.map(u => ({
                    id: u.id,
                    name: u.full_name || 'Usuario',
                    avatarUrl: u.avatar_url
                })));
            }
        };
        loadDirectory();
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        const msgContent = newMessage.trim();
        setNewMessage('');

        try {
            const { error } = await supabase
                .from('private_messages')
                .insert({
                    from: user.name,
                    to: activeConversation,
                    content: msgContent
                });

            if (error) throw error;
        } catch (error) {
            console.error("Error enviando mensaje a Supabase:", error);
            alert("Hubo un error al enviar el mensaje. Verifica tu conexión.");
        }
    };

    const currentConversation = activeConversation
        ? (conversations[activeConversation] || []).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        : [];

    const conversationUsers = Object.keys(conversations);

    const filteredDirectory = directoryUsers.filter(u =>
        u.name !== user.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-obsidian-200 border-t-obsidian-600 rounded-full animate-spin"></div>
                <p className="text-obsidian-600 font-serif italic">Abriendo tu buzón...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20 max-w-3xl mx-auto">
            {!activeConversation && (
                <header className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-obsidian-100 rounded-2xl mb-4 text-obsidian-600">
                        {view === 'inbox' ? <Mail size={32} /> : <Users size={32} />}
                    </div>
                    <h2 className="text-4xl font-serif text-obsidian-900 mb-6">
                        {view === 'inbox' ? 'Buzón Privado' : 'Red de Hermanas'}
                    </h2>

                    <div className="flex bg-gray-100 p-1.5 rounded-2xl max-w-sm mx-auto shadow-inner">
                        <button
                            onClick={() => setView('inbox')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${view === 'inbox' ? 'bg-white text-obsidian-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Mis Chats
                        </button>
                        <button
                            onClick={() => setView('directory')}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${view === 'directory' ? 'bg-white text-obsidian-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Ver Comunidad
                        </button>
                    </div>
                </header>
            )}

            {view === 'inbox' && !activeConversation && (
                <div className="bg-white rounded-3xl shadow-xl border border-obsidian-100 overflow-hidden">
                    {conversationUsers.length === 0 ? (
                        <div className="p-12 text-center">
                            <Inbox size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500 italic mb-4">Tu buzón está en silencio.</p>
                            <button
                                onClick={() => setView('directory')}
                                className="text-sm bg-obsidian-50 text-obsidian-600 font-bold px-6 py-2.5 rounded-full hover:bg-obsidian-100 transition-colors"
                            >
                                Buscar a alguien en la comunidad
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {conversationUsers.map(userName => {
                                const lastMsg = conversations[userName][0];

                                return (
                                    <button
                                        key={userName}
                                        onClick={() => setActiveConversation(userName)}
                                        className="w-full p-5 flex items-center gap-4 hover:bg-obsidian-50 transition-colors text-left group"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-obsidian-400 to-obsidian-600 flex items-center justify-center text-white font-bold text-xl shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                                            {userName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-bold text-gray-900 text-lg">{userName}</span>
                                                <span className="text-xs text-gray-400">{lastMsg?.timestamp}</span>
                                            </div>
                                            <p className={`text-sm truncate text-gray-500`}>
                                                {lastMsg?.from === user.name ? `Tú: ${lastMsg?.content}` : lastMsg?.content}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {view === 'directory' && !activeConversation && (
                <div className="animate-fade-in space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar a una hermana por su nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 bg-white border border-obsidian-100 shadow-sm rounded-2xl focus:ring-4 focus:ring-obsidian-50 outline-none transition-all font-sans"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredDirectory.map((member) => (
                            <div key={member.id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-obsidian-400 to-obsidian-600 flex items-center justify-center text-white font-bold shadow-inner overflow-hidden shrink-0">
                                        {member.avatarUrl ? (
                                            <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
                                        ) : (
                                            member.name.charAt(0)
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 font-serif leading-tight">{member.name}</h4>
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest mt-0.5">Comunidad Obsidiana</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setActiveConversation(member.name);
                                        setView('inbox');
                                    }}
                                    className="p-3 bg-obsidian-50 text-obsidian-600 rounded-xl hover:bg-obsidian-600 hover:text-white transition-colors active:scale-95"
                                    title={`Enviar mensaje a ${member.name}`}
                                >
                                    <MessageCircle size={18} />
                                </button>
                            </div>
                        ))}
                        {filteredDirectory.length === 0 && (
                            <div className="col-span-full text-center py-10">
                                <p className="text-gray-500 italic">No se encontraron hermanas en el directorio.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeConversation && (
                <div className="bg-white rounded-3xl shadow-2xl border border-obsidian-100 overflow-hidden flex flex-col h-[70vh]">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-obsidian-50/50 backdrop-blur-sm z-10">
                        <button
                            onClick={() => setActiveConversation(null)}
                            className="flex items-center gap-2 text-obsidian-600 hover:text-obsidian-800 transition-colors p-2 bg-white rounded-xl shadow-sm"
                        >
                            <ArrowLeft size={18} />
                            <span className="font-bold text-xs uppercase tracking-widest hidden sm:block">Volver</span>
                        </button>
                        <div className="flex items-center gap-3">
                            <span className="font-bold text-obsidian-900 font-serif text-lg">{activeConversation}</span>
                            <div className="w-10 h-10 rounded-full bg-obsidian-600 flex items-center justify-center text-white font-bold shadow-sm">
                                {activeConversation.charAt(0)}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-gray-50/30">
                        {currentConversation.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                <Sparkles size={40} className="text-obsidian-400 mb-3" />
                                <p className="text-sm font-medium">Este es el inicio de tu conexión con {activeConversation}.</p>
                                <p className="text-xs mt-1">Escribe un mensaje para romper el hielo.</p>
                            </div>
                        ) : (
                            currentConversation.map((msg, idx) => {
                                const isFromMe = msg.from === user.name;
                                const showTime = idx === 0 || currentConversation[idx - 1].timestamp !== msg.timestamp;

                                return (
                                    <div key={msg.id} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isFromMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`p-4 rounded-2xl shadow-sm ${isFromMe
                                                    ? 'bg-obsidian-800 text-white rounded-br-sm'
                                                    : 'bg-white border border-gray-100 text-gray-900 rounded-bl-sm'
                                                }`}>
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                            {showTime && (
                                                <p className="text-[9px] text-gray-400 mt-1.5 font-medium px-1">
                                                    {msg.timestamp}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-gray-100 z-10">
                        <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-obsidian-200 focus:bg-white transition-all shadow-inner"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="bg-obsidian-800 text-white p-4 rounded-2xl hover:bg-black disabled:opacity-50 transition-all shadow-md active:scale-95"
                            >
                                <Send size={20} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Messages;
