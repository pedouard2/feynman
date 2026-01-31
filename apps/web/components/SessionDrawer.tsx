'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Plus, History, Settings, X, MessageSquare } from 'lucide-react';
import { useFeynmanStore } from '../stores/feynman';

export default function SessionDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { concepts, reset, topic, setTopic } = useFeynmanStore();

  const handleNewChat = () => {
    // Reset store
    reset();
    setIsOpen(false);
  };

  return (
    <>
      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-6 left-6 z-40 bg-white/5 backdrop-blur-md p-3 rounded-full border border-white/10 hover:bg-white/10 transition-colors text-white"
        title="Menu"
      >
        <Menu size={20} />
      </button>

      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
               onClick={() => setIsOpen(false)}
            />
            
            {/* Drawer Panel */}
            <motion.div 
               initial={{ x: "-100%" }}
               animate={{ x: 0 }}
               exit={{ x: "-100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="fixed top-0 left-0 bottom-0 w-80 bg-neutral-900 border-r border-white/10 z-50 flex flex-col p-6 shadow-2xl"
            >
               {/* Header */}
               <div className="flex items-center justify-between mb-8">
                 <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                   Feynman.AI
                 </h2>
                 <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                   <X size={20} />
                 </button>
               </div>

               {/* Actions */}
               <button 
                 onClick={handleNewChat}
                 className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 mb-6"
               >
                 <Plus size={18} />
                 New Session
               </button>

               {/* Settings / Config */}
               <div className="space-y-6">
                 <div>
                   <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Topic Context</h3>
                   <input 
                      type="text" 
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="e.g. Quantum Physics..."
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                   />
                 </div>
                 
                 <div>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Session Stats</h3>
                    <div className="bg-white/5 rounded-lg p-3 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/60">Concepts Covered</span>
                            <span className="text-white">{concepts.filter(c => c.status === 'covered').length} / {concepts.length || '-'}</span>
                        </div>
                    </div>
                 </div>
               </div>

               {/* Footer */}
               <div className="mt-auto border-t border-white/10 pt-6">
                 <div className="flex items-center gap-3 text-white/50 text-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                        P
                    </div>
                    <div>
                        <div className="text-white">Prince</div>
                        <div className="text-xs">Pro Plan</div>
                    </div>
                    <Settings size={16} className="ml-auto cursor-pointer hover:text-white" />
                 </div>
               </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
