import React, { Children } from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
interface StarRatingProps {
  rating: number; // 0 to 3
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
  className?: string;
}
export function StarRating({
  rating,
  size = 'md',
  animated = false,
  className = ''
}: StarRatingProps) {
  const sizes = {
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48
  };
  const starSize = sizes[size];
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  const starVariants = {
    hidden: {
      scale: 0,
      opacity: 0,
      rotate: -45
    },
    show: {
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: 'spring',
        stiffness: 300,
        damping: 15
      }
    }
  };
  return (
    <motion.div
      className={`flex items-center justify-center gap-2 ${className}`}
      variants={animated ? containerVariants : undefined}
      initial={animated ? 'hidden' : 'show'}
      animate="show">
      
      {[1, 2, 3].map((starIndex) => {
        const isFilled = starIndex <= rating;
        return (
          <motion.div
            key={starIndex}
            variants={animated ? starVariants : undefined}
            className={`${isFilled ? 'text-frigi-orange drop-shadow-md' : 'text-gray-200'}`}>
            
            <Star
              size={starSize}
              fill={isFilled ? 'currentColor' : 'none'}
              strokeWidth={isFilled ? 0 : 2} />
            
          </motion.div>);

      })}
    </motion.div>);

}