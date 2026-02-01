'use client';

import { useEffect, useState } from 'react';
import Persona from '../components/Persona';
import ChatDrawerRight from '../components/ChatDrawerRight';
import SessionGrid from '../components/SessionGrid';
import NewSessionModal from '../components/NewSessionModal';
import JudgeFeedback from '../components/JudgeFeedback';
import { useFeynmanStore } from '../stores/feynman';
import { useRealtimeSession } from '../hooks/use-realtime';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export default function Home() {
  const [currentView, setCurrentView] = useState<'grid' | 'chat'>('grid');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(true);

  const { agentState, isConnected, isMockMode, setAgentState } = useFeynmanStore();
  const { startSession, stopSession, sendMessage, toggleMic, commitTurn, isMicOn } = useRealtimeSession();

  const handleSessionClick = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setCurrentView('chat');
    setIsChatDrawerOpen(true);
  };

  const handleNewSession = () => {
    setIsNewSessionModalOpen(true);
  };

  const handleCreateSession = (data: { personaId: string; sourceText: string }) => {
    const newSessionId = Math.random().toString(36).substring(7);
    setActiveSessionId(newSessionId);
    setCurrentView('chat');
    setIsChatDrawerOpen(true);
  };

  const handleBackToGrid = () => {
    setCurrentView('grid');
    setActiveSessionId(null);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black font-sans select-none">
      {currentView === 'grid' && (
        <SessionGrid
          onSessionClick={handleSessionClick}
          onNewSession={handleNewSession}
        />
      )}

      {currentView === 'chat' && (
        <>
          <Persona />
          <JudgeFeedback />

          <div className="absolute top-6 left-6 z-10">
            <button
              onClick={handleBackToGrid}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-sm font-medium">Back to Sessions</span>
            </button>
          </div>

          <div className="absolute top-6 right-6 z-10">
            <div
              className={clsx(
                'px-3 py-1 rounded-full text-xs font-mono border',
                agentState === 'listening'
                  ? 'bg-green-500/20 border-green-500 text-green-400'
                  : agentState === 'talking'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-white/5 border-white/10 text-white/40'
              )}
            >
              {agentState.toUpperCase()}
            </div>
          </div>

          <ChatDrawerRight
            isOpen={isChatDrawerOpen}
            onToggle={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
            onSendMessage={sendMessage}
            sessionId={activeSessionId}
          />

          {isConnected && isMockMode && (
            <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <h4 className="text-xs text-white/50 font-bold uppercase mb-2">
                Debug States
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAgentState('idle')}
                  className="px-3 py-1 bg-white/5 text-xs text-white hover:bg-white/10 rounded"
                >
                  Idle
                </button>
                <button
                  onClick={() => setAgentState('listening')}
                  className="px-3 py-1 bg-green-500/20 text-xs text-green-300 hover:bg-green-500/30 rounded"
                >
                  Listening
                </button>
                <button
                  onClick={() => setAgentState('thinking')}
                  className="px-3 py-1 bg-yellow-500/20 text-xs text-yellow-300 hover:bg-yellow-500/30 rounded"
                >
                  Thinking
                </button>
                <button
                  onClick={() => setAgentState('talking')}
                  className="px-3 py-1 bg-blue-500/20 text-xs text-blue-300 hover:bg-blue-500/30 rounded"
                >
                  Talking
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onComplete={handleCreateSession}
      />
    </main>
  );
}
