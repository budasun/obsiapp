import React, { useState } from 'react';
import { MOCK_COMMUNITY_POSTS } from '../constants';
import { Users, Heart, MessageSquare, Tag, Send } from 'lucide-react';
import { Comment } from '../types';

const Community: React.FC = () => {
  const [posts, setPosts] = useState(MOCK_COMMUNITY_POSTS);
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  // Simple tracking for posts liked by the user in this session
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());

  const handleLike = (postId: string) => {
    if (likedPostIds.has(postId)) {
       // Optional: Allow unlike, but for now just prevent multiple likes
       return;
    }

    setPosts(posts.map(post => {
        if (post.id === postId) {
            return { ...post, likes: post.likes + 1 };
        }
        return post;
    }));
    
    setLikedPostIds(prev => new Set(prev).add(postId));
  };

  const toggleCommentSection = (postId: string) => {
      if (activeCommentPostId === postId) {
          setActiveCommentPostId(null);
      } else {
          setActiveCommentPostId(postId);
          setNewComment('');
      }
  };

  const handleAddComment = (postId: string) => {
      if (!newComment.trim()) return;

      const comment: Comment = {
          id: Date.now().toString(),
          author: 'Yo', // In a real app, this would be the logged-in user's name
          content: newComment,
          timestamp: 'Ahora'
      };

      setPosts(posts.map(post => {
          if (post.id === postId) {
              return { ...post, comments: [...post.comments, comment] };
          }
          return post;
      }));

      setNewComment('');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-10">
      <header className="text-center mb-8">
        <h2 className="text-3xl font-serif text-obsidian-900 mb-2">Círculo de Mujeres</h2>
        <p className="text-gray-600">Comparte tu alquimia interior. Este es un espacio seguro.</p>
      </header>
      
      {/* Create Post Input (Mock) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-obsidian-100 flex space-x-4 mb-8">
        <div className="w-10 h-10 rounded-full bg-obsidian-200 flex items-center justify-center text-obsidian-700 font-bold">
            Yo
        </div>
        <input 
            type="text" 
            placeholder="Comparte tu experiencia con el huevo..." 
            className="flex-1 bg-white border border-gray-200 rounded-xl px-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-obsidian-100 shadow-inner"
        />
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
            <div key={post.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-obsidian-200 transition-colors">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {post.author.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-gray-900">{post.author}</p>
                            <p className="text-xs text-gray-500">{post.timestamp}</p>
                        </div>
                    </div>
                </div>
                
                <p className="text-gray-800 leading-relaxed mb-4">{post.content}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                    {post.tags.map(tag => (
                        <span key={tag} className="inline-flex items-center text-xs font-medium text-obsidian-600 bg-obsidian-50 px-2.5 py-1 rounded-full">
                            <Tag size={10} className="mr-1" /> {tag}
                        </span>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50 text-gray-500 text-sm">
                    <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1 transition-all transform active:scale-95 ${likedPostIds.has(post.id) ? 'text-pink-600 font-bold' : 'hover:text-pink-500'}`}
                    >
                        <Heart size={18} className={likedPostIds.has(post.id) ? 'fill-pink-600' : ''} />
                        <span>{post.likes} Alquimias</span>
                    </button>
                    <button 
                        onClick={() => toggleCommentSection(post.id)}
                        className={`flex items-center space-x-1 transition-colors ${activeCommentPostId === post.id ? 'text-obsidian-600 font-bold' : 'hover:text-obsidian-500'}`}
                    >
                        <MessageSquare size={18} />
                        <span>{post.comments.length > 0 ? `${post.comments.length} Comentarios` : 'Comentar'}</span>
                    </button>
                </div>

                {/* Comments Section */}
                {activeCommentPostId === post.id && (
                    <div className="mt-4 pt-4 border-t border-gray-50 animate-fade-in bg-gray-50 -mx-6 px-6 pb-2">
                        {/* Existing Comments */}
                        <div className="space-y-3 mb-4">
                            {post.comments.length > 0 ? (
                                post.comments.map(comment => (
                                    <div key={comment.id} className="flex space-x-3">
                                        <div className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">
                                            {comment.author.charAt(0)}
                                        </div>
                                        <div className="flex-1 bg-white p-3 rounded-lg rounded-tl-none shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-xs font-bold text-gray-800">{comment.author}</span>
                                                <span className="text-[10px] text-gray-400">{comment.timestamp}</span>
                                            </div>
                                            <p className="text-sm text-gray-700">{comment.content}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-xs text-gray-400 py-2">Sé la primera en comentar...</p>
                            )}
                        </div>

                        {/* Add Comment Input */}
                        <div className="flex items-center space-x-2">
                             <input 
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                                placeholder="Escribe un comentario amoroso..."
                                className="flex-1 bg-white border border-gray-300 rounded-full px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-obsidian-200"
                            />
                            <button 
                                onClick={() => handleAddComment(post.id)}
                                disabled={!newComment.trim()}
                                className="bg-obsidian-600 text-white p-2 rounded-full hover:bg-obsidian-700 disabled:opacity-50 transition-colors"
                            >
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        ))}
      </div>
    </div>
  );
};

export default Community;