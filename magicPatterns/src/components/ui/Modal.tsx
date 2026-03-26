import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen &&
      <>
          {/* Backdrop */}
          <motion.div
          initial={{
            opacity: 0
          }}
          animate={{
            opacity: 1
          }}
          exit={{
            opacity: 0
          }}
          onClick={onClose}
          className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" />
        

          {/* Modal Content */}
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
            initial={{
              scale: 0.9,
              opacity: 0,
              y: 20
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0
            }}
            exit={{
              scale: 0.9,
              opacity: 0,
              y: 20
            }}
            transition={{
              type: 'spring',
              damping: 25,
              stiffness: 300
            }}
            className="w-full max-w-sm bg-frigi-surface rounded-game-xl shadow-2xl pointer-events-auto overflow-hidden">
            
              <div className="relative p-6">
                <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                
                  <X size={20} />
                </button>

                {title &&
              <h3 className="text-xl font-bold text-frigi-text mb-4 pr-8">
                    {title}
                  </h3>
              }

                {children}
              </div>
            </motion.div>
          </div>
        </>
      }
    </AnimatePresence>);

}