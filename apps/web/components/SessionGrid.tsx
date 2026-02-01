'use client';

import { useFeynmanStore } from '../stores/feynman';
import { DEFAULT_PERSONAS } from '../lib/personas';
import { Plus, Loader2 } from 'lucide-react';

interface SessionGridProps {
  onSessionClick: (sessionId: string) => void;
  onNewSession: () => void;
  isLoading?: boolean;
}

export default function SessionGrid({ onSessionClick, onNewSession, isLoading }: SessionGridProps) {
  const { conversations, isLoading: storeLoading } = useFeynmanStore();
  const loading = isLoading || storeLoading;

  const getPersonaInfo = (personaId: string) => {
    const persona = DEFAULT_PERSONAS[personaId];
    return {
      name: persona?.name || 'Unknown',
      initial: persona?.name?.[0]?.toUpperCase() || '?'
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <Loader2 size={48} className="animate-spin text-primary mb-4" aria-hidden="true" />
        <p className="text-foreground/60" role="status">Loading sessions...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6" aria-hidden="true">📚</div>
          <h2 className="text-2xl font-bold mb-4">No sessions yet</h2>
          <p className="text-foreground/60 mb-8">
            Create your first session to start learning with AI personas
          </p>
          <button
            onClick={onNewSession}
            aria-label="Create your first learning session"
            className="px-6 py-3 bg-primary hover:bg-primary/80 text-foreground font-medium rounded-[10px] flex items-center gap-2 mx-auto transition-colors"
          >
            <Plus size={20} aria-hidden="true" />
            Create Your First Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent-blue bg-clip-text text-transparent">
            Your Sessions
          </h1>
          <button
            onClick={onNewSession}
            aria-label="Create new learning session"
            className="px-6 py-3 bg-primary hover:bg-primary/80 text-foreground font-medium rounded-[10px] flex items-center gap-2 transition-colors"
          >
            <Plus size={20} aria-hidden="true" />
            New Session
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {conversations.map((conversation) => {
            const personaInfo = getPersonaInfo(conversation.personaId);
            return (
              <button
                key={conversation.id}
                onClick={() => onSessionClick(conversation.id)}
                aria-label={`Open session: ${conversation.title || conversation.context || 'Untitled Session'}`}
                className="bg-secondary/30 hover:bg-accent-blue/20 transition-colors rounded-[10px] p-6 text-left border border-primary/20 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-foreground font-bold text-lg flex-shrink-0">
                    {personaInfo.initial}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate mb-1">
                      {conversation.title || conversation.context || 'Untitled Session'}
                    </h3>
                    <p className="text-xs text-foreground/40">
                      {new Date(conversation.createdAt).toLocaleDateString()} • {personaInfo.name}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
