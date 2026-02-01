'use client';

import { useEffect, useState } from 'react';
import Persona from '../components/Persona';
import ChatDrawerRight from '../components/ChatDrawerRight';
import SessionGrid from '../components/SessionGrid';
import NewSessionModal from '../components/NewSessionModal';
import SessionContextPanel from '../components/SessionContextPanel';
import JudgeFeedback from '../components/JudgeFeedback';
import { useFeynmanStore } from '../stores/feynman';
import { useRealtimeSession } from '../hooks/use-realtime';
import { ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

export default function Home() {
  const [currentView, setCurrentView] = useState<'grid' | 'chat'>('grid');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isNewSessionModalOpen, setIsNewSessionModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);

  const { agentState, isConnected, isMockMode, setAgentState, createConversation, loadConversation, loadConversations } = useFeynmanStore();
  const { startSession, stopSession, sendMessage, toggleMic, commitTurn, isMicOn } = useRealtimeSession();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleSessionClick = (sessionId: string) => {
    setActiveSessionId(sessionId);
    loadConversation(sessionId);
    setCurrentView('chat');
    setIsChatDrawerOpen(true);
  };

  const handleNewSession = () => {
    setIsNewSessionModalOpen(true);
  };

  const handleCreateSession = async (data: { personaId: string; sourceText: string }) => {
    const conversationId = await createConversation(
      data.personaId,
      undefined,
      data.sourceText
    );
    
    if (conversationId) {
      setActiveSessionId(conversationId);
      setCurrentView('chat');
      setIsChatDrawerOpen(true);
    }
  };

  const handleBackToGrid = () => {
    setCurrentView('grid');
    setActiveSessionId(null);
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-background font-sans select-none">
      {currentView === 'grid' && (
        <SessionGrid
          onSessionClick={handleSessionClick}
          onNewSession={handleNewSession}
        />
      )}

      {currentView === 'chat' && (
        <div className="relative h-full">
          <SessionContextPanel 
            sessionId={activeSessionId}
            isOpen={isContextPanelOpen}
            onToggle={() => setIsContextPanelOpen(!isContextPanelOpen)}
          />

          <div className="w-full h-full relative">
            <Persona />
            <JudgeFeedback />

            <div className="absolute top-6 left-6 z-10">
              <button
                onClick={handleBackToGrid}
                className="flex items-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 backdrop-blur-sm border border-primary/30 rounded-full text-foreground transition-colors"
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
                    ? 'bg-accent-green/20 border-accent-green text-accent-green'
                    : agentState === 'talking'
                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                    : 'bg-secondary/20 border-secondary text-foreground/40'
                )}
              >
                {agentState.toUpperCase()}
              </div>
            </div>

            {isConnected && isMockMode && (
              <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 p-4 bg-background/90 backdrop-blur-sm rounded-[10px] border border-primary/20">
                <h4 className="text-xs text-foreground/50 font-bold uppercase mb-2">
                  Debug States
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setAgentState('idle')}
                    className="px-3 py-1 bg-secondary/30 text-xs text-foreground hover:bg-secondary/50 rounded-[10px]"
                  >
                    Idle
                  </button>
                  <button
                    onClick={() => setAgentState('listening')}
                    className="px-3 py-1 bg-accent-green/20 text-xs text-accent-green hover:bg-accent-green/30 rounded-[10px]"
                  >
                    Listening
                  </button>
                  <button
                    onClick={() => setAgentState('thinking')}
                    className="px-3 py-1 bg-accent-warm/20 text-xs text-accent-warm hover:bg-accent-warm/30 rounded-[10px]"
                  >
                    Thinking
                  </button>
                  <button
                    onClick={() => setAgentState('talking')}
                    className="px-3 py-1 bg-accent-blue/20 text-xs text-accent-blue hover:bg-accent-blue/30 rounded-[10px]"
                  >
                    Talking
                  </button>
                </div>
              </div>
            )}
          </div>

          <ChatDrawerRight
            isOpen={isChatDrawerOpen}
            onToggle={() => setIsChatDrawerOpen(!isChatDrawerOpen)}
            onSendMessage={sendMessage}
            sessionId={activeSessionId}
          />
        </div>
      )}

      <NewSessionModal
        isOpen={isNewSessionModalOpen}
        onClose={() => setIsNewSessionModalOpen(false)}
        onComplete={handleCreateSession}
      />
    </main>
  );
}
