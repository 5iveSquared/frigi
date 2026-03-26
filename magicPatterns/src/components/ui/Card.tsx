import React from 'react';
import { motion } from 'framer-motion';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  animated?: boolean;
}
export function Card({
  children,
  className = '',
  onClick,
  padding = 'md',
  animated = false
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-5',
    lg: 'p-8'
  };
  const baseClasses = `bg-frigi-surface rounded-game-lg shadow-game-soft overflow-hidden ${paddings[padding]} ${className}`;
  if (onClick || animated) {
    return (
      <motion.div
        whileHover={
        onClick ?
        {
          y: -2
        } :
        {}
        }
        whileTap={
        onClick ?
        {
          scale: 0.98
        } :
        {}
        }
        onClick={onClick}
        className={`${baseClasses} ${onClick ? 'cursor-pointer' : ''}`}>
        
        {children}
      </motion.div>);

  }
  return <div className={baseClasses}>{children}</div>;
}