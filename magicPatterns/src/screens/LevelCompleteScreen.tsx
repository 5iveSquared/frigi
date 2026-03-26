import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Home, RotateCcw, Play, Share2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StarRating } from '../components/ui/StarRating';
interface LevelCompleteScreenProps {
  onNavigate: (screen: string) => void;
}
export function LevelCompleteScreen({ onNavigate }: LevelCompleteScreenProps) {
  const [showContent, setShowContent] = useState(false);
  useEffect(() => {
    // Delay showing content slightly for dramatic effect
    const timer = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="flex flex-col h-full bg-frigi-red relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear'
        }}
        className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(circle,rgba(255,255,255,0.15)_0%,transparent_60%)] pointer-events-none" />
      

      {/* Confetti Mock (CSS based) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) =>
        <motion.div
          key={i}
          initial={{
            y: -50,
            x: Math.random() * 400,
            opacity: 1,
            rotate: 0
          }}
          animate={{
            y: 800,
            x: Math.random() * 400,
            rotate: Math.random() * 360,
            opacity: 0
          }}
          transition={{
            duration: Math.random() * 2 + 2,
            delay: Math.random() * 0.5,
            ease: 'easeOut'
          }}
          className={`absolute w-3 h-3 rounded-sm ${['bg-frigi-mint', 'bg-frigi-orange', 'bg-white', 'bg-yellow-300'][Math.floor(Math.random() * 4)]}`} />

        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10">
        <motion.div
          initial={{
            scale: 0.5,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          transition={{
            type: 'spring',
            bounce: 0.6
          }}
          className="text-center mb-6">
          
          <h1 className="text-5xl font-black text-white drop-shadow-md mb-2">
            Perfect!
          </h1>
          <p className="text-red-100 font-medium text-lg">
            Fridge packed flawlessly
          </p>
        </motion.div>

        {/* Fully Stocked Mini Fridge Visual */}
        <motion.div
          initial={{
            scale: 0.8,
            opacity: 0
          }}
          animate={{
            scale: 1,
            opacity: 1
          }}
          transition={{
            delay: 0.4,
            type: 'spring',
            bounce: 0.5
          }}
          className="relative w-40 h-52 bg-gray-100 rounded-2xl border-4 border-gray-300 shadow-2xl flex flex-col p-2 overflow-hidden mb-8">
          
          {/* Sparkle overlay */}
          <motion.div
            animate={{
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
            className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 pointer-events-none z-20" />
          

          {/* Top Door (Freezer) */}
          <div className="h-1/4 w-full bg-white rounded-lg border border-gray-200 mb-1.5 relative shadow-inner flex items-end p-1 gap-1">
            <div className="w-6 h-6 bg-cyan-100 rounded flex items-center justify-center text-[10px]">
              🧊
            </div>
            <div className="w-8 h-4 bg-purple-200 rounded flex items-center justify-center text-[8px]">
              🍦
            </div>
            <div className="w-6 h-6 bg-cyan-100 rounded flex items-center justify-center text-[10px]">
              🧊
            </div>
          </div>

          {/* Bottom Door (Fridge) */}
          <div className="flex-1 w-full bg-white rounded-lg border border-gray-200 relative shadow-inner flex flex-col p-1.5 gap-1.5">
            {/* Shelves */}
            <div className="flex-1 border-b-2 border-blue-50 flex items-end gap-1 pb-0.5 px-1">
              <div className="w-5 h-8 bg-blue-100 rounded flex items-center justify-center text-[12px]">
                🥛
              </div>
              <div className="w-6 h-5 bg-yellow-100 rounded flex items-center justify-center text-[10px]">
                🧀
              </div>
              <div className="w-5 h-6 bg-orange-100 rounded flex items-center justify-center text-[10px]">
                🧃
              </div>
            </div>
            <div className="flex-1 border-b-2 border-blue-50 flex items-end gap-1 pb-0.5 px-1">
              <div className="w-8 h-6 bg-teal-100 rounded flex items-center justify-center text-[12px]">
                🍱
              </div>
              <div className="w-5 h-5 bg-pink-100 rounded flex items-center justify-center text-[10px]">
                🫙
              </div>
            </div>
            {/* Crisper */}
            <div className="h-6 w-full flex gap-1 mt-auto">
              <div className="flex-1 bg-green-50 rounded border border-green-100 flex items-center justify-center text-[12px]">
                🥬
              </div>
              <div className="flex-1 bg-green-50 rounded border border-green-100 flex items-center justify-center text-[12px]">
                🍅
              </div>
            </div>
          </div>
        </motion.div>

        {showContent &&
        <motion.div
          initial={{
            y: 50,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          className="w-full max-w-sm">
          
            <Card className="text-center relative overflow-visible mb-8">
              {/* Floating Badge */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-frigi-orange text-white px-4 py-1 rounded-full font-bold shadow-md text-sm whitespace-nowrap">
                New High Score!
              </div>

              <div className="pt-6 pb-2">
                <StarRating rating={3} size="xl" animated className="mb-6" />

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">
                      Score
                    </div>
                    <div className="text-2xl font-black text-frigi-red">
                      3,450
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-1">
                      Time Bonus
                    </div>
                    <div className="text-2xl font-black text-frigi-mint">
                      +450
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 text-frigi-orange font-bold bg-orange-50 py-2 rounded-lg">
                  <span>🪙</span> +150 Coins
                </div>
              </div>
            </Card>

            <div className="flex flex-col gap-3">
              <Button
              size="lg"
              variant="primary"
              className="bg-white text-frigi-red hover:bg-gray-50"
              icon={<Play fill="currentColor" size={20} />}
              onClick={() => onNavigate('gameplay')}>
              
                Next Level
              </Button>

              <div className="flex gap-3">
                <Button
                variant="ghost"
                className="flex-1 bg-red-400/20 text-white hover:bg-red-400/30"
                icon={<RotateCcw size={20} />}
                onClick={() => onNavigate('gameplay')}>
                
                  Retry
                </Button>
                <Button
                variant="ghost"
                className="flex-1 bg-red-400/20 text-white hover:bg-red-400/30"
                icon={<Share2 size={20} />}>
                
                  Share
                </Button>
              </div>

              <Button
              variant="ghost"
              className="text-red-200 hover:text-white hover:bg-transparent mt-2"
              icon={<Home size={20} />}
              onClick={() => onNavigate('home')}>
              
                Back to Home
              </Button>
            </div>
          </motion.div>
        }
      </div>
    </div>);

}