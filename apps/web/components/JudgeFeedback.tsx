'use client';

import { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFeynmanStore } from '../stores/feynman';
import { AlertTriangle, X } from 'lucide-react';

export default function JudgeFeedback() {
  const feedback = useFeynmanStore(state => state.feedback);
  const clearFeedback = useFeynmanStore(state => state.clearFeedback);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleClearFeedback = useCallback(() => {
    clearFeedback();
  }, [clearFeedback]);

  useEffect(() => {
    if (feedback) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        clearFeedback();
      }, 8000);
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [feedback]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className="absolute top-24 left-1/2 z-50 max-w-md w-[90%]"
        >
          <div className="bg-yellow-500/90 backdrop-blur-md text-black px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(234,179,8,0.3)] border border-yellow-400/50 flex items-start gap-4">
            <div className="bg-black/10 p-2 rounded-full shrink-0">
                <AlertTriangle size={20} className="text-black" />
            </div>
            <div className="flex-1">
                <h4 className="font-bold text-sm uppercase tracking-wide opacity-70 mb-1">Feedback</h4>
                <p className="font-medium text-sm leading-relaxed">
                    {feedback}
                </p>
            </div>
            <button 
                onClick={handleClearFeedback}
                aria-label="Dismiss feedback"
                className="opacity-50 hover:opacity-100 transition-opacity"
            >
                <X size={18} aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
