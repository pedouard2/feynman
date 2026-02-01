'use client';

import { useFeynmanStore } from '../stores/feynman';
import { DEFAULT_PERSONAS } from '../lib/personas';
import { Plus } from 'lucide-react';

interface SessionGridProps {
  onSessionClick: (sessionId: string) => void;
  onNewSession: () => void;
}

export default function SessionGrid({ onSessionClick, onNewSession }: SessionGridProps) {
  const { sessions } = useFeynmanStore();

  const getPersonaInfo = (personaId: string) => {
    const persona = DEFAULT_PERSONAS[personaId];
    return {
      name: persona?.name || 'Unknown',
      initial: persona?.name?.[0]?.toUpperCase() || '?'
    };
  };

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">📚</div>
          <h2 className="text-2xl font-bold mb-4">No sessions yet</h2>
          <p className="text-white/60 mb-8">
            Create your first session to start learning with AI personas
          </p>
          <button
            onClick={onNewSession}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center gap-2 mx-auto transition-colors"
          >
            <Plus size={20} />
            Create Your First Session
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Your Sessions
          </h1>
          <button
            onClick={onNewSession}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            New Session
          </button>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {sessions.map((session) => {
            const personaInfo = getPersonaInfo(session.personaId);
            return (
              <button
                key={session.id}
                onClick={() => onSessionClick(session.id)}
                className="bg-white/5 hover:bg-white/10 transition-colors rounded-lg p-6 text-left border border-white/10 group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {personaInfo.initial}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors truncate mb-1">
                      {session.topic}
                    </h3>
                    <p className="text-xs text-white/40">
                      {new Date(session.date).toLocaleDateString()} • {personaInfo.name}
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
