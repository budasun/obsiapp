
import React from 'react';

import { ExternalLink, X, Globe, Copy } from 'lucide-react';

interface MarkdownRendererProps {
    content: string;
}

// Helper to safely render text with inline links
const renderInlineContent = (text: string, onOpenModal: (url: string, title: string) => void) => {
    // Busca enlaces tipo [Texto](URL) y envuelve el resto en texto simple
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    
    let match;
    while ((match = linkRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(text.substring(lastIndex, match.index));
        }
        
        const linkText = match[1];
        const linkUrl = match[2];
        
        parts.push(
            <span 
                key={lastIndex} 
                onClick={() => onOpenModal(linkUrl, linkText)}
                className="text-obsidian-600 font-medium underline decoration-obsidian-200 underline-offset-2 cursor-pointer hover:text-obsidian-800 transition-colors inline-flex items-center gap-1 mx-1 active:scale-95 bg-obsidian-50 px-1.5 rounded-md"
            >
                {linkText}
                <ExternalLink size={14} className="opacity-70" />
            </span>
        );
        
        lastIndex = linkRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
        parts.push(text.substring(lastIndex));
    }
    
    // Ahora procesamos negritas dentro de las partes que son texto
    return parts.map((part, i) => {
        if (typeof part === 'string' && part.includes('**')) {
            const boldParts = part.split(/(\*\*.*?\*\*)/g);
            return (
                <span key={`bold-${i}`}>
                    {boldParts.map((bp, j) => {
                        if (bp.startsWith('**') && bp.endsWith('**')) {
                            return <strong key={j} className="font-bold text-obsidian-700">{bp.slice(2, -2)}</strong>;
                        }
                        return bp;
                    })}
                </span>
            );
        }
        return part;
    });
};

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    const [modalUrl, setModalUrl] = React.useState<string | null>(null);
    const [modalTitle, setModalTitle] = React.useState<string>('');
    const [iframeLoading, setIframeLoading] = React.useState(true);
    const [iframeError, setIframeError] = React.useState(false);

    // Simple parser for common markdown patterns used in the app
    const lines = content.split('\n');

    const openModal = (url: string, title: string) => {
        setModalUrl(url);
        setModalTitle(title);
        setIframeLoading(true);
        setIframeError(false);
    };

    return (
        <>
            <div className="markdown-content space-y-4">
                {lines.map((line, index) => {
                // Headers ###
                if (line.startsWith('### ')) {
                    return (
                        <h3 key={index} className="text-xl font-serif font-bold text-obsidian-800 border-b border-obsidian-100 pb-1 mt-6">
                            {line.replace('### ', '')}
                        </h3>
                    );
                }

                // Headers ##
                if (line.startsWith('## ')) {
                    return (
                        <h2 key={index} className="text-2xl font-serif font-bold text-obsidian-900 mt-8 mb-4">
                            {line.replace('## ', '')}
                        </h2>
                    );
                }

                // Line has links or bold text
                if (line.includes('[') || line.includes('**')) {
                    return (
                        <p key={index} className="leading-relaxed">
                            {renderInlineContent(line, openModal)}
                        </p>
                    );
                }

                // Lists 1. 2. 
                if (/^\d+\.\s/.test(line)) {
                    return (
                        <div key={index} className="flex gap-2 ml-2">
                            <span className="font-bold text-obsidian-500">{line.match(/^\d+/)?.[0]}.</span>
                            <p className="flex-1">{line.replace(/^\d+\.\s/, '')}</p>
                        </div>
                    );
                }

                // Empty lines
                if (line.trim() === '') {
                    return <div key={index} className="h-1" />;
                }

                // Regular paragraphs
                return <p key={index} className="leading-relaxed">{renderInlineContent(line, openModal)}</p>;
            })}
            </div>

            {/* Popup Modal para enlaces internos o externos */}
            {modalUrl && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setModalUrl(null)}>
                    <div 
                        className="bg-white w-full max-w-4xl h-[85vh] rounded-[2rem] flex flex-col overflow-hidden shadow-2xl border border-obsidian-100" 
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header del Popup */}
                        <div className="h-16 flex items-center justify-between px-6 bg-obsidian-50 border-b border-obsidian-100 shrink-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-obsidian-200 p-2 rounded-full shrink-0">
                                    <Globe size={18} className="text-obsidian-700" />
                                </div>
                                <div className="flex flex-col truncate">
                                    <h3 className="font-serif font-bold text-obsidian-900 truncate">
                                        {modalTitle || 'Explorador Interno'}
                                    </h3>
                                    <span className="text-xs text-obsidian-500 truncate flex items-center gap-1">
                                        {modalUrl}
                                        <Copy size={12} className="cursor-pointer hover:text-obsidian-800" onClick={() => navigator.clipboard.writeText(modalUrl)} />
                                    </span>
                                </div>
                            </div>
                            <button 
                                onClick={() => setModalUrl(null)} 
                                className="p-2 hover:bg-obsidian-200 rounded-full text-obsidian-600 transition-colors shrink-0"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        {/* Contenido iframe */}
                        <div className="flex-1 relative bg-stone-100">
                            {iframeLoading && !iframeError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-white">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-obsidian-200 rounded-full animate-pulse" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Globe className="text-obsidian-400 animate-bounce" size={24} />
                                        </div>
                                    </div>
                                    <p className="mt-4 font-serif text-obsidian-600">Materializando conocimiento...</p>
                                </div>
                            )}

                            {iframeError && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 bg-white">
                                    <Globe size={48} className="text-obsidian-300 mb-4" />
                                    <h3 className="font-serif font-bold text-xl text-obsidian-800 mb-2">La conexión no permite ser enmarcada</h3>
                                    <p className="text-obsidian-600 mb-6">Algunos sitios web bloquean por seguridad que se abran dentro de otras aplicaciones.</p>
                                    <a 
                                        href={modalUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="bg-obsidian-800 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-black transition-colors"
                                    >
                                        Abrir en pestaña externa <ExternalLink size={18} />
                                    </a>
                                </div>
                            )}

                            <iframe 
                                src={modalUrl}
                                className="w-full h-full border-none"
                                onLoad={() => setIframeLoading(false)}
                                onError={() => setIframeError(true)}
                                // Sandbox restricts certain iframe behaviors to avoid hijacking the parent app
                                sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MarkdownRenderer;
