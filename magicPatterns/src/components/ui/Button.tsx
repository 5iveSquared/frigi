import React from 'react';
import { motion } from 'framer-motion';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
  'inline-flex items-center justify-center font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary:
    'bg-frigi-red text-white shadow-game-floating hover:bg-red-500 focus:ring-frigi-red',
    secondary:
    'bg-frigi-mint text-frigi-text shadow-sm hover:bg-emerald-300 focus:ring-frigi-mint',
    accent:
    'bg-frigi-orange text-white shadow-game-floating hover:bg-orange-500 focus:ring-frigi-orange',
    ghost:
    'bg-transparent text-frigi-text hover:bg-gray-100 focus:ring-gray-200'
  };
  const sizes = {
    sm: 'px-4 py-2 text-sm rounded-game',
    md: 'px-6 py-3 text-base rounded-game-lg',
    lg: 'px-8 py-4 text-lg rounded-game-xl'
  };
  const classes = `
    ${baseStyles}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;
  return (
    <motion.button
      whileHover={
      disabled ?
      {} :
      {
        scale: 1.02
      }
      }
      whileTap={
      disabled ?
      {} :
      {
        scale: 0.95
      }
      }
      className={classes}
      disabled={disabled}
      {...props}>
      
      {icon && <span className={children ? 'mr-2' : ''}>{icon}</span>}
      {children}
    </motion.button>);

}