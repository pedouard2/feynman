'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface NewSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: { personaId: string; sourceText: string }) => void;
}

export default function NewSessionModal({ isOpen, onClose, onComplete }: NewSessionModalProps) {
  const [currentStep, setCurrentStep] = useState<'persona' | 'source'>('persona');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState('');

  const handleNext = () => {
    if (currentStep === 'persona' && selectedPersonaId) {
      setCurrentStep('source');
    }
  };

  const handleComplete = () => {
    if (selectedPersonaId) {
      onComplete({ personaId: selectedPersonaId, sourceText });
      onClose();
      setCurrentStep('persona');
      setSelectedPersonaId(null);
      setSourceText('');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] bg-neutral-900 rounded-2xl p-6 z-50 shadow-2xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">New Session</h2>
                <p className="text-sm text-white/50 mt-1">
                  Step {currentStep === 'persona' ? '1' : '2'} of 2
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="mb-6 min-h-[300px]">
              {currentStep === 'persona' && (
                <div>
                  <p className="text-white/60 text-sm mb-4">
                    Persona selection content will go here (Task 5)
                  </p>
                </div>
              )}

              {currentStep === 'source' && (
                <div>
                  <p className="text-white/60 text-sm mb-4">
                    Source input content will go here (Task 6)
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              {currentStep === 'persona' && (
                <button
                  onClick={handleNext}
                  disabled={!selectedPersonaId}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/30 text-white font-medium rounded-lg transition-colors"
                >
                  Next
                </button>
              )}
              {currentStep === 'source' && (
                <button
                  onClick={handleComplete}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
                >
                  Create Session
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
