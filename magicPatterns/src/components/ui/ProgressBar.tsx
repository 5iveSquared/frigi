import React from 'react';
import { motion } from 'framer-motion';
interface ProgressBarProps {
  progress: number; // 0 to 100
  color?: 'blue' | 'mint' | 'orange';
  size?: 'sm' | 'md';
  className?: string;
}
export function ProgressBar({
  progress,
  color = 'blue',
  size = 'md',
  className = ''
}: ProgressBarProps) {
  const colors = {
    blue: 'bg-frigi-red',
    mint: 'bg-frigi-mint',
    orange: 'bg-frigi-orange'
  };
  const heights = {
    sm: 'h-1.5',
    md: 'h-3'
  };
  return (
    <div
      className={`w-full bg-gray-100 rounded-full overflow-hidden ${heights[size]} ${className}`}>
      
      <motion.div
        initial={{
          width: 0
        }}
        animate={{
          width: `${Math.min(Math.max(progress, 0), 100)}%`
        }}
        transition={{
          duration: 0.5,
          ease: 'easeOut'
        }}
        className={`h-full rounded-full ${colors[color]}`} />
      
    </div>);

}