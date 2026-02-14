
import React from 'react';

interface MarkdownRendererProps {
    content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    // Simple parser for common markdown patterns used in the app
    const lines = content.split('\n');

    return (
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

                // Bold text **text**
                if (line.includes('**')) {
                    const parts = line.split(/(\*\*.*?\*\*)/g);
                    return (
                        <p key={index} className="leading-relaxed">
                            {parts.map((part, i) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                    return <strong key={i} className="font-bold text-obsidian-700">{part.slice(2, -2)}</strong>;
                                }
                                return part;
                            })}
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
                return <p key={index} className="leading-relaxed">{line}</p>;
            })}
        </div>
    );
};

export default MarkdownRenderer;
