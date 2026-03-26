import React from 'react';
import { motion } from 'framer-motion';
interface CoinDisplayProps {
  amount: number;
  className?: string;
}
export function CoinDisplay({ amount, className = '' }: CoinDisplayProps) {
  return (
    <motion.div
      initial={{
        scale: 0.9,
        opacity: 0
      }}
      animate={{
        scale: 1,
        opacity: 1
      }}
      className={`inline-flex items-center bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-100 ${className}`}>
      
      <span className="text-lg mr-1.5 drop-shadow-sm">🪙</span>
      <span className="font-bold text-frigi-text">
        {amount.toLocaleString()}
      </span>
    </motion.div>);

}