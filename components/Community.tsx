import React, { useState, useEffect } from 'react';
import { MOCK_COMMUNITY_POSTS } from '../constants';
import { Users, Heart, MessageSquare, Tag, Send, Sparkles, Smile, Flame, Moon, Mail, X, Loader2 } from 'lucide-react';
import { Comment, UserProfile, CommunityPost } from '../types';
import { supabase } from '../src/lib/supabaseClient';

interface CommunityProps {
    user: UserProfile;
}

const COMMUNITY_STORAGE_KEY = 'obsidiana_community_posts';

const loadLocalPosts = (): CommunityPost[] => {
    try {
        const saved = localStorage.getItem(COMMUNITY_STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
};

const saveLocalPosts = (posts: CommunityPost[]) => {
    try {
        localStorage.setItem(COMMUNITY_STORAGE_KEY, JSON.stringify(posts));
    } catch (error) {
        console.error("Error guardando posts en localStorage:", error);
    }
};

const Community: React.FC<CommunityProps> = ({ user }) => {
    const initialPosts = loadLocalPosts();
    const [posts, setPosts] = useState<CommunityPost[]>(initialPosts);

    const [loading, setLoading] = useState<boolean>(initialPosts.length === 0);

    const [error, setError] = useState<string | null>(null);
    const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);

    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [selectedTag, setSelectedTag] = useState('General');

    const [dmRecipient, setDmRecipient] = useState<string | null>(null);
    const [dmMessage, setDmMessage] = useState('');
    const [isSendingDM, setIsSendingDM] = useState(false);

    const [userReactions, setUserReactions] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('obsidiana_reactions');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        const fallbackTimer = setTimeout(() => {
            if (loading) setLoading(false);
        }, 2500);

        const loadPosts = async () => {
            try {
                const { data, error } = await supabase
                    .from('posts')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(25);

                clearTimeout(fallbackTimer);

                if (error) throw error;

                setIsSupabaseConnected(true);

                const postsData = (data || []).map(post => ({
                    id: post.id,
                    author: post.author_name,
                    content: post.content,
                    tags: post.tags || [],
                    likes: post.likes || 0,
                    timestamp: post.created_at ? new Intl.DateTimeFormat('es-ES', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                    }).format(new Date(post.created_at)) : 'Recién publicado',
                    comments: post.comments || []
                })) as CommunityPost[];

                const localPosts = loadLocalPosts();
                const mockIds = MOCK_COMMUNITY_POSTS.map(p => p.id);
                const localUserPosts = localPosts.filter(p => p.id.startsWith('local_') || mockIds.includes(p.id));

                const combinedPosts = postsData.length > 0
                    ? [...postsData, ...localUserPosts.filter(lp => !postsData.some(fp => fp.id === lp.id))]
                    : (localPosts.length > 0 ? localPosts : MOCK_COMMUNITY_POSTS);

                setPosts(combinedPosts);
                saveLocalPosts(combinedPosts);
                setLoading(false);
                setError(null);
            } catch (supabaseError) {
                console.error("Error al conectar con Supabase:", supabaseError);
                clearTimeout(fallbackTimer);
                setIsSupabaseConnected(false);

                const localPosts = loadLocalPosts();
                setPosts(localPosts.length > 0 ? localPosts : MOCK_COMMUNITY_POSTS);
                setLoading(false);
            }
        };

        loadPosts();

        const channel = supabase
            .channel('posts_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
                loadPosts();
            })
            .subscribe();

        return () => {
            clearTimeout(fallbackTimer);
            supabase.removeChannel(channel);
        };
    }, []);

    useEffect(() => {
        localStorage.setItem('obsidiana_reactions', JSON.stringify(userReactions));
    }, [userReactions]);

    const handleReaction = async (postId: string, emoji: string) => {
        const previousReaction = userReactions[postId];
        const isLocal = postId.startsWith('local_') || postId.length < 15;

        setPosts(prevPosts => prevPosts.map(post => {
            if (post.id === postId) {
                let newLikes = post.likes;
                if (previousReaction === emoji) {
                    newLikes = Math.max(0, newLikes - 1);
                } else if (!previousReaction) {
                    newLikes++;
                }
                return { ...post, likes: newLikes };
            }
            return post;
        }));

        if (previousReaction === emoji) {
            const nextReactions = { ...userReactions };
            delete nextReactions[postId];
            setUserReactions(nextReactions);
        } else {
            setUserReactions({ ...userReactions, [postId]: emoji });
        }

        if (!isLocal) {
            try {
                const newLikes = previousReaction === emoji
                    ? (posts.find(p => p.id === postId)?.likes || 0) - 1
                    : (posts.find(p => p.id === postId)?.likes || 0) + (previousReaction ? 0 : 1);

                await supabase
                    .from('posts')
                    .update({ likes: Math.max(0, newLikes) })
                    .eq('id', postId);
            } catch (error) {
                console.error("Error updating reaction en Supabase:", error);
            }
        }
    };

    const handleAddPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        const tempId = `local_${Date.now()}`;
        const newPost: CommunityPost = {
            id: tempId,
            author: user.name,
            content: newPostContent.trim(),
            tags: [selectedTag],
            likes: 0,
            timestamp: 'Recién publicado',
            comments: []
        };

        setPosts(prev => [newPost, ...prev]);
        setNewPostContent('');
        setSelectedTag('General');

        try {
            const { error } = await supabase
                .from('posts')
                .insert({
                    author_name: user.name,
                    content: newPost.content,
                    tags: newPost.tags,
                    likes: 0,
                    comments: []
                });

            if (error) throw error;
        } catch (error) {
            console.error("Error adding post a Supabase:", error);
        }
    };

    const handleAddComment = async (postId: string) => {
        if (!newComment.trim()) return;

        const comment: Comment = {
            id: Date.now().toString(),
            author: user.name,
            content: newComment.trim(),
            timestamp: new Intl.DateTimeFormat('es-ES', { timeStyle: 'short' }).format(new Date())
        };

        const updatedPosts = posts.map(post => {
            if (post.id === postId) {
                return { ...post, comments: [...post.comments, comment] };
            }
            return post;
        });
        setPosts(updatedPosts);
        saveLocalPosts(updatedPosts);
        setNewComment('');

        if (!postId.startsWith('local_') && postId.length >= 15) {
            try {
                const post = posts.find(p => p.id === postId);
                if (post) {
                    await supabase
                        .from('posts')
                        .update({ comments: [...post.comments, comment] })
                        .eq('id', postId);
                }
            } catch (error) {
                console.error("Error adding comment a Supabase:", error);
            }
        }
    };

    const toggleCommentSection = (postId: string) => {
        setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
        setNewComment('');
    };

    const handleSendDirectMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dmMessage.trim() || !dmRecipient) return;

        setIsSendingDM(true);
        try {
            const { error } = await supabase
                .from('private_messages')
                .insert({
                    from: user.name,
                    from_name: user.name,
                    to: dmRecipient,
                    to_name: dmRecipient,
                    content: dmMessage.trim(),
                    read: false
                });

            if (error) throw error;

            setDmRecipient(null);
            setDmMessage('');
            alert(`Mensaje enviado a ${dmRecipient} con éxito.`);
        } catch (error) {
            console.error("Error enviando DM:", error);
            alert("No se pudo enviar el mensaje.");
        } finally {
            setIsSendingDM(false);
        }
    };

    const availableTags = ['Testimonio', 'Físico', 'Cólicos', 'Sueños', 'Emocional', 'Ritual', 'General'];

    return (
        <div className="space-y-8 animate-fade-in max-w-2xl mx-auto pb-20 relative">
            <header className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-obsidian-100 rounded-2xl mb-4 text-obsidian-600">
                    <Users size={32} />
                </div>
                <h2 className="text-4xl font-serif text-obsidian-900 mb-2">Círculo de Mujeres</h2>
                <p className="text-gray-600 italic">"Donde la palabra sana y el silencio escucha."</p>
                {!isSupabaseConnected && !loading && (
                    <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-yellow-50 border border-yellow-200 rounded-full text-xs text-yellow-700">
                        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                        Modo offline - Conectando...
                    </div>
                )}
            </header>

            <div className="bg-white p-6 rounded-3xl shadow-xl border border-obsidian-100 transform transition-all hover:shadow-2xl">
                <form onSubmit={handleAddPost} className="space-y-4">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-obsidian-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
                            {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" /> : user.name.charAt(0)}
                        </div>
                        <div>
                            <span className="font-bold text-gray-900">{user.name}</span>
                            <span className="text-xs text-obsidian-500 ml-2">Compartiendo hoy</span>
                        </div>
                    </div>
                    <textarea
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder="¿Qué ha movido hoy en ti el Huevo de Obsidiana?..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-obsidian-200 min-h-[100px] resize-none transition-all"
                    />
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="flex flex-wrap gap-2">
                            {availableTags.slice(0, 4).map(tag => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => setSelectedTag(tag)}
                                    className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider transition-all ${selectedTag === tag ? 'bg-obsidian-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <button
                            type="submit"
                            disabled={!newPostContent.trim()}
                            className="flex items-center space-x-2 bg-obsidian-800 hover:bg-black text-white px-6 py-2.5 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50"
                        >
                            <Send size={18} />
                            <span>Publicar Vivencia</span>
                        </button>
                    </div>
                </form>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-obsidian-200 border-t-obsidian-600 rounded-full animate-spin"></div>
                    <p className="text-obsidian-600 font-serif italic">Invocando la sabiduría del círculo...</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.length === 0 && (
                        <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-gray-300">
                            <p className="text-gray-500 italic">Aún no hay vivencias compartidas. Sé la primera en sembrar tu palabra.</p>
                        </div>
                    )}
                    {posts.map((post) => (
                        <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div
                                        className={`flex items-center space-x-3 transition-all ${post.author !== user.name ? 'cursor-pointer group' : ''}`}
                                        onClick={() => post.author !== user.name && setDmRecipient(post.author)}
                                    >
                                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-obsidian-400 to-obsidian-600 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-white overflow-hidden transition-all ${post.author !== user.name ? 'group-hover:ring-obsidian-200 group-hover:scale-105' : ''}`}>
                                            {post.author.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className={`font-serif font-bold text-gray-900 transition-colors uppercase tracking-tight ${post.author !== user.name ? 'group-hover:text-obsidian-600' : ''}`}>
                                                {post.author}
                                            </h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{post.timestamp}</p>
                                        </div>
                                        {post.author !== user.name && (
                                            <Mail size={14} className="text-obsidian-300 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                                        )}
                                    </div>
                                    <div className="flex gap-1 flex-wrap justify-end pl-2">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="text-[9px] font-bold text-obsidian-500 bg-obsidian-50 px-2 py-1 rounded-md uppercase tracking-tighter ring-1 ring-obsidian-100 whitespace-nowrap mb-1">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-gray-900 leading-relaxed mb-6 font-sans text-lg italic pl-4 border-l-2 border-obsidian-100 whitespace-pre-wrap">
                                    "{post.content}"
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex -space-x-1 hover:space-x-1 transition-all group">
                                            {['❤️', '✨', '🧘‍♀️'].map(emoji => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleReaction(post.id, emoji)}
                                                    className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-sm transition-all transform hover:scale-125 hover:z-10 shadow-sm ${userReactions[post.id] === emoji ? 'bg-obsidian-50 border-obsidian-200 scale-110 grayscale-0' : 'bg-gray-50 grayscale hover:grayscale-0'}`}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                        <span className="text-xs font-bold text-obsidian-600">{post.likes}</span>
                                    </div>

                                    <button
                                        onClick={() => toggleCommentSection(post.id)}
                                        className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-widest transition-all ${activeCommentPostId === post.id ? 'text-obsidian-600' : 'text-gray-400 hover:text-obsidian-500'}`}
                                    >
                                        <MessageSquare size={16} />
                                        <span>{post.comments.length} Comentarios</span>
                                    </button>
                                </div>
                            </div>

                            {activeCommentPostId === post.id && (
                                <div className="bg-gray-50/50 border-t border-gray-100 p-6 space-y-6 animate-fade-in">
                                    <div className="space-y-4">
                                        {post.comments.map(comment => (
                                            <div key={comment.id} className="flex space-x-3">
                                                <div
                                                    className={`w-8 h-8 rounded-full bg-white border flex items-center justify-center text-xs font-bold shadow-sm shrink-0 transition-all ${comment.author !== user.name ? 'border-obsidian-200 text-obsidian-600 cursor-pointer hover:bg-obsidian-50 hover:scale-110' : 'border-gray-200 text-obsidian-500'}`}
                                                    onClick={() => comment.author !== user.name && setDmRecipient(comment.author)}
                                                >
                                                    {comment.author.charAt(0)}
                                                </div>
                                                <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-obsidian-800">{comment.author}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase">{comment.timestamp}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-800 font-sans">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-inner border border-gray-200">
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                            placeholder="Escribe un mensaje de apoyo..."
                                            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 px-2"
                                        />
                                        <button
                                            onClick={() => handleAddComment(post.id)}
                                            disabled={!newComment.trim()}
                                            className="bg-obsidian-900 text-white p-2.5 rounded-xl hover:bg-black transition-all"
                                        >
                                            <Send size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {dmRecipient && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-md p-6 shadow-2xl border border-obsidian-100" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-obsidian-50 text-obsidian-600 rounded-xl">
                                    <Mail size={20} />
                                </div>
                                <h3 className="font-serif font-bold text-lg text-gray-900">Conectar con {dmRecipient}</h3>
                            </div>
                            <button onClick={() => { setDmRecipient(null); setDmMessage(''); }} className="p-2 bg-gray-50 rounded-full text-gray-500">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSendDirectMessage}>
                            <textarea
                                value={dmMessage}
                                onChange={(e) => setDmMessage(e.target.value)}
                                placeholder="Escribe un mensaje sagrado..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 min-h-[120px] mb-4 focus:ring-2 focus:ring-obsidian-200 outline-none"
                                autoFocus
                            />
                            <button
                                type="submit"
                                disabled={!dmMessage.trim() || isSendingDM}
                                className="w-full flex items-center justify-center space-x-2 bg-obsidian-800 text-white px-6 py-3.5 rounded-xl font-bold disabled:opacity-50"
                            >
                                {isSendingDM ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                <span>{isSendingDM ? 'Enviando...' : 'Enviar Mensaje'}</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Community;
