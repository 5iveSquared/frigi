import React from 'react';
import { motion } from 'framer-motion';
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}
export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-2">
      {label && <span className="text-frigi-text font-medium">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-frigi-red focus-visible:ring-opacity-75 ${checked ? 'bg-frigi-mint' : 'bg-gray-200'}`}>
        
        <span className="sr-only">Use setting</span>
        <motion.span
          layout
          initial={false}
          animate={{
            x: checked ? 20 : 0
          }}
          transition={{
            type: 'spring',
            stiffness: 500,
            damping: 30
          }}
          className="pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm ring-0" />
        
      </button>
    </div>);

}