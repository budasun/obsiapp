import React, { useState, useEffect } from 'react';
import { MOCK_COMMUNITY_POSTS } from '../constants';
import { Users, Heart, MessageSquare, Tag, Send, Sparkles, Smile, Flame, Moon } from 'lucide-react';
import { Comment, UserProfile, CommunityPost } from '../types';
import { db } from '../services/firebase';
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    updateDoc,
    doc,
    arrayUnion,
    increment
} from 'firebase/firestore';

interface CommunityProps {
    user: UserProfile;
}

const Community: React.FC<CommunityProps> = ({ user }) => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);

    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [newComment, setNewComment] = useState('');
    const [newPostContent, setNewPostContent] = useState('');
    const [selectedTag, setSelectedTag] = useState('General');

    // Tracking reactions per post locally for UI feedback
    const [userReactions, setUserReactions] = useState<Record<string, string>>(() => {
        const saved = localStorage.getItem('obsidiana_reactions');
        return saved ? JSON.parse(saved) : {};
    });

    useEffect(() => {
        const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                // Handle different timestamp formats from Firebase (serverTimestamp or existing strings)
                timestamp: doc.data().timestamp?.toDate
                    ? new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(doc.data().timestamp.toDate())
                    : (doc.data().timestamp || 'Recién publicado')
            })) as CommunityPost[];

            // If collection is empty, fallback to mock (only if desired, but user wants real data now)
            setPosts(postsData.length > 0 ? postsData : MOCK_COMMUNITY_POSTS);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        localStorage.setItem('obsidiana_reactions', JSON.stringify(userReactions));
    }, [userReactions]);

    const handleReaction = async (postId: string, emoji: string) => {
        const previousReaction = userReactions[postId];
        const postRef = doc(db, 'posts', postId);

        try {
            if (previousReaction === emoji) {
                // Remove reaction
                await updateDoc(postRef, {
                    likes: increment(-1)
                });
                const nextReactions = { ...userReactions };
                delete nextReactions[postId];
                setUserReactions(nextReactions);
            } else {
                // Add or switch reaction
                await updateDoc(postRef, {
                    likes: previousReaction ? increment(0) : increment(1) // only increment if it's the first reaction
                });
                setUserReactions({ ...userReactions, [postId]: emoji });
            }
        } catch (error) {
            console.error("Error updating reaction:", error);
            // Fallback for initial mock data that doesn't exist in Firebase yet
            if (postId.length < 15) { // Likely a mock ID
                // Handle locally as before
                setPosts(posts.map(post => {
                    if (post.id === postId) {
                        let newLikes = post.likes;
                        if (previousReaction === emoji) {
                            newLikes--;
                            const nextReactions = { ...userReactions };
                            delete nextReactions[postId];
                            setUserReactions(nextReactions);
                        } else {
                            if (!previousReaction) newLikes++;
                            setUserReactions({ ...userReactions, [postId]: emoji });
                        }
                        return { ...post, likes: newLikes };
                    }
                    return post;
                }));
            }
        }
    };

    const handleAddPost = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;

        try {
            const newPost = {
                author: user.name,
                content: newPostContent,
                tags: [selectedTag],
                likes: 0,
                timestamp: serverTimestamp(),
                comments: []
            };

            await addDoc(collection(db, 'posts'), newPost);

            setNewPostContent('');
            setSelectedTag('General');
        } catch (error) {
            console.error("Error adding post:", error);
        }
    };

    const handleAddComment = async (postId: string) => {
        if (!newComment.trim()) return;

        const comment: Comment = {
            id: Date.now().toString(),
            author: user.name,
            content: newComment,
            timestamp: new Intl.DateTimeFormat('es-ES', { timeStyle: 'short' }).format(new Date())
        };

        try {
            const postRef = doc(db, 'posts', postId);
            await updateDoc(postRef, {
                comments: arrayUnion(comment)
            });
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment:", error);
            // Fallback for mock data
            if (postId.length < 15) {
                setPosts(posts.map(post => {
                    if (post.id === postId) {
                        return { ...post, comments: [...post.comments, comment] };
                    }
                    return post;
                }));
                setNewComment('');
            }
        }
    };

    const toggleCommentSection = (postId: string) => {
        setActiveCommentPostId(activeCommentPostId === postId ? null : postId);
        setNewComment('');
    };

    const availableTags = ['Testimonio', 'Físico', 'Cólicos', 'Sueños', 'Emocional', 'Ritual', 'General'];

    return (
        <div className="space-y-8 animate-fade-in max-w-2xl mx-auto pb-20">
            <header className="text-center">
                <div className="inline-flex items-center justify-center p-3 bg-obsidian-100 rounded-2xl mb-4 text-obsidian-600">
                    <Users size={32} />
                </div>
                <h2 className="text-4xl font-serif text-obsidian-900 mb-2">Círculo de Mujeres</h2>
                <p className="text-gray-600 italic">"Donde la palabra sana y el silencio escucha."</p>
            </header>

            {/* Create Post Form */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-obsidian-100 transform transition-all hover:shadow-2xl">
                <form onSubmit={handleAddPost} className="space-y-4">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-obsidian-600 flex items-center justify-center text-white font-bold shadow-md">
                            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full object-cover" /> : user.name.charAt(0)}
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

            {/* Feed */}
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
                        <div key={post.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden group hover:border-obsidian-200 transition-all duration-300">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-obsidian-400 to-obsidian-600 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-white overflow-hidden">
                                            {post.author.charAt(0)}
                                        </div>
                                        <div>
                                            <h4 className="font-serif font-bold text-gray-900 group-hover:text-obsidian-700 transition-colors uppercase tracking-tight">{post.author}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{post.timestamp}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        {post.tags.map(tag => (
                                            <span key={tag} className="text-[9px] font-bold text-obsidian-500 bg-obsidian-50 px-2 py-1 rounded-md uppercase tracking-tighter ring-1 ring-obsidian-100">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-gray-900 leading-relaxed mb-6 font-sans text-lg italic pl-4 border-l-2 border-obsidian-100">
                                    "{post.content}"
                                </p>

                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex -space-x-1 group-hover:space-x-1 transition-all">
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

                            {/* Comment Section View */}
                            {activeCommentPostId === post.id && (
                                <div className="bg-gray-50/50 border-t border-gray-100 p-6 space-y-6 animate-fade-in">
                                    <div className="space-y-4">
                                        {post.comments.map(comment => (
                                            <div key={comment.id} className="flex space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-obsidian-500 shadow-sm shrink-0">
                                                    {comment.author.charAt(0)}
                                                </div>
                                                <div className="flex-1 bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-obsidian-900">{comment.author}</span>
                                                        <span className="text-[10px] text-gray-400 uppercase tracking-tighter">{comment.timestamp}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-800 leading-relaxed font-sans">{comment.content}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl shadow-inner border border-gray-200">
                                        <div className="w-8 h-8 rounded-full bg-obsidian-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                            {user.name.charAt(0)}
                                        </div>
                                        <input
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                            placeholder="Escribe un mensaje de apoyo..."
                                            className="flex-1 bg-transparent border-none focus:outline-none text-sm text-gray-900 placeholder-gray-400 px-2"
                                        />
                                        <button
                                            onClick={() => handleAddComment(post.id)}
                                            disabled={!newComment.trim()}
                                            className="bg-obsidian-900 text-white p-2.5 rounded-xl hover:bg-black disabled:opacity-50 transition-all active:scale-90"
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
        </div>
    );
};

export default Community;