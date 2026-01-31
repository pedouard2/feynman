'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Send } from 'lucide-react';
import { useFeynmanStore } from '../stores/feynman';
import clsx from 'clsx';

export interface ChatDrawerProps {
  onSendMessage: (text: string) => void;
}

export default function ChatDrawer({ onSendMessage }: ChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, addMessage, concepts } = useFeynmanStore();
  const [inputText, setInputText] = useState("");

  const handleSend = () => {
    if (!inputText.trim()) return;
    addMessage('user', inputText);
    onSendMessage(inputText);
    setInputText("");
  };

  return (
    <>
      {/* The Levitating Handle */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 cursor-pointer"
        animate={{ y: isOpen ? 100 : 0, opacity: isOpen ? 0 : 1 }}
        onClick={() => setIsOpen(true)}
      >
        <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-2 rounded-full shadow-lg flex items-center gap-2 hover:bg-white/20 transition-colors">
          <span className="text-sm font-medium">Text Chat</span>
          <ChevronUp size={16} />
        </div>
      </motion.div>

      {/* The Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute bottom-0 left-0 right-0 h-[60vh] bg-neutral-900/90 backdrop-blur-xl border-t border-white/10 rounded-t-3xl z-30 flex flex-col shadow-2xl"
          >
            {/* Header / Close Handle */}
            <div 
              className="w-full flex justify-center py-4 cursor-pointer hover:bg-white/5 transition-colors rounded-t-3xl"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-12 h-1.5 bg-white/20 rounded-full" />
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Concept Tracker (Persisted) */}
              {concepts.length > 0 && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                   <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider opacity-80">
                     Concept Coverage
                   </h3>
                   <div className="space-y-2">
                     {concepts.map((c, i) => (
                       <div key={i} className="flex items-center gap-3">
                         <div className={clsx(
                           "w-2 h-2 rounded-full shadow-[0_0_10px_currentColor]",
                           c.status === 'covered' ? "bg-green-400 text-green-400" :
                           c.status === 'partial' ? "bg-yellow-400 text-yellow-400" :
                           "bg-red-400 text-red-400"
                         )} />
                         <span className={clsx(
                           "text-sm font-medium",
                           c.status === 'covered' ? "text-white" : "text-white/50"
                         )}>
                           {c.name}
                         </span>
                         {c.status === 'covered' && <span className="text-xs text-green-400 ml-auto">✓</span>}
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.map((msg) => (
                <div 
                  key={msg.id}
                  className={clsx(
                    "max-w-[80%] p-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "ml-auto bg-blue-600 text-white rounded-tr-sm" 
                      : "mr-auto bg-white/10 text-white rounded-tl-sm"
                  )}
                >
                  {msg.text}
                </div>
              ))}
              {messages.length === 0 && (
                <div className="text-center text-white/40 text-sm mt-10">
                  Start talking or type a message...
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 flex gap-2">
              <input 
                type="text" 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white focus:outline-none focus:border-white/30 transition-colors"
              />
              <button 
                onClick={handleSend}
                className="p-2 bg-blue-600 rounded-full text-white hover:bg-blue-500 transition-colors"
              >
                <Send size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
