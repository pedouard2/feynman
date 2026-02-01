'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, MicOff, Send } from 'lucide-react';
import { useFeynmanStore } from '../stores/feynman';
import clsx from 'clsx';

export interface ChatDrawerRightProps {
  isOpen: boolean;
  onToggle: () => void;
  onSendMessage: (text: string) => void;
  sessionId: string | null;
}

export default function ChatDrawerRight({ isOpen, onToggle, onSendMessage, sessionId }: ChatDrawerRightProps) {
  const { messages, concepts } = useFeynmanStore();
  const [inputText, setInputText] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleMicToggle = () => {
    setIsMicActive(!isMicActive);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-[400px] bg-neutral-900 border-l border-white/10 z-40 flex flex-col shadow-2xl"
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Chat</h3>
            <button
              onClick={onToggle}
              className="text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {concepts.length > 0 && (
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <h4 className="text-xs font-bold text-white/60 mb-3 uppercase tracking-wider">
                  Concept Coverage
                </h4>
                <div className="space-y-2">
                  {concepts.map((c, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={clsx(
                          'w-2 h-2 rounded-full',
                          c.status === 'covered'
                            ? 'bg-green-400'
                            : c.status === 'partial'
                            ? 'bg-yellow-400'
                            : 'bg-red-400'
                        )}
                      />
                      <span
                        className={clsx(
                          'text-sm',
                          c.status === 'covered' ? 'text-white' : 'text-white/50'
                        )}
                      >
                        {c.name}
                      </span>
                      {c.status === 'covered' && (
                        <span className="text-xs text-green-400 ml-auto">✓</span>
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
                  'max-w-[85%] p-3 rounded-2xl text-sm',
                  msg.role === 'user'
                    ? 'ml-auto bg-blue-600 text-white rounded-tr-sm'
                    : 'mr-auto bg-white/10 text-white rounded-tl-sm'
                )}
              >
                {msg.text}
              </div>
            ))}

            {messages.length === 0 && (
              <div className="text-center text-white/40 text-sm mt-10">
                Start the conversation...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="w-full bg-white/5 border border-white/10 rounded-full pl-4 pr-12 py-2 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={handleMicToggle}
                  className={clsx(
                    'absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors',
                    isMicActive
                      ? 'bg-red-500 text-white'
                      : 'text-white/50 hover:text-white hover:bg-white/10'
                  )}
                >
                  {isMicActive ? <Mic size={16} /> : <MicOff size={16} />}
                </button>
              </div>
              <button
                onClick={handleSend}
                disabled={!inputText.trim()}
                className="p-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 rounded-full text-white transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
