'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Send } from 'lucide-react';
import { useFeynmanStore } from '../stores/feynman';
import clsx from 'clsx';

export interface BottomChatDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  onSendMessage: (text: string) => void;
  currentTranscript: string;
  sessionId: string | null;
}

export default function BottomChatDrawer({ 
  isOpen, 
  onToggle, 
  onSendMessage, 
  currentTranscript,
  sessionId 
}: BottomChatDrawerProps) {
  const { messages, concepts } = useFeynmanStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentTranscript) {
      setInputText(currentTranscript);
    }
  }, [currentTranscript]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background border-t border-primary/20 shadow-2xl z-40"
            style={{ maxHeight: '70vh' }}
          >
            <button
              onClick={onToggle}
              aria-label="Hide chat"
              className="absolute -top-10 left-1/2 -translate-x-1/2 bg-background border border-primary/20 rounded-t-xl px-4 py-2 hover:bg-secondary/20 transition-colors flex items-center gap-2"
            >
              <ChevronDown size={20} className="text-foreground/60" aria-hidden="true" />
              <span className="text-xs text-foreground/60 font-medium">Hide Chat</span>
            </button>

            <div className="flex flex-col h-full max-h-[70vh]">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {concepts.length > 0 && (
                  <div className="p-4 bg-secondary/20 rounded-[10px] border border-primary/20">
                    <h4 className="text-xs font-bold text-foreground/60 mb-3 uppercase tracking-wider">
                      Concept Coverage
                    </h4>
                    <div className="space-y-2">
                      {concepts.map((c, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div
                            className={clsx(
                              'w-2 h-2 rounded-full',
                              c.status === 'covered'
                                ? 'bg-accent-green'
                                : c.status === 'partial'
                                ? 'bg-accent-warm'
                                : 'bg-accent-warm/60'
                            )}
                          />
                          <span
                            className={clsx(
                              'text-sm',
                              c.status === 'covered' ? 'text-foreground' : 'text-foreground/50'
                            )}
                          >
                            {c.name}
                          </span>
                          {c.status === 'covered' && (
                            <span className="text-xs text-accent-green ml-auto">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={clsx(
                      'p-4 rounded-[10px] max-w-[80%]',
                      msg.role === 'user' 
                        ? 'bg-primary/20 text-foreground ml-auto' 
                        : 'bg-secondary/20 text-foreground'
                    )}
                  >
                    {msg.text}
                  </div>
                ))}

                {messages.length === 0 && (
                  <div className="text-center text-foreground/40 text-sm mt-10">
                    Start the conversation...
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-primary/20 bg-background/95 backdrop-blur-sm">
                <div className="flex gap-3 items-center max-w-4xl mx-auto">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 bg-secondary/30 border border-primary/20 rounded-full px-6 py-3 text-foreground text-sm placeholder-foreground/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                    aria-label="Send message"
                    className="p-3 bg-primary hover:bg-primary/80 disabled:bg-secondary/30 disabled:text-foreground/30 rounded-full text-foreground transition-colors flex-shrink-0"
                  >
                    <Send size={20} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isOpen && (
        <button
          onClick={onToggle}
          aria-label={messages.length > 0 ? `View conversation with ${messages.length} messages` : 'Open chat'}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm border border-primary/30 rounded-full px-6 py-3 hover:bg-secondary/20 transition-all hover:scale-105 z-30 flex items-center gap-2 shadow-lg"
        >
          <ChevronUp size={20} className="text-foreground/60" aria-hidden="true" />
          <span className="text-sm text-foreground/80 font-medium">
            {messages.length > 0 ? `View Conversation (${messages.length})` : 'Open Chat'}
          </span>
        </button>
      )}
    </>
  );
}
