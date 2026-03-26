import React from 'react';
import { motion } from 'framer-motion';
import { Play, Settings, Lock, Check, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { CoinDisplay } from '../components/ui/CoinDisplay';
interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}
export function HomeScreen({ onNavigate }: HomeScreenProps) {
  // Mock level data
  const levels = Array.from(
    {
      length: 10
    },
    (_, i) => ({
      id: i + 1,
      status: i < 3 ? 'completed' : i === 3 ? 'current' : 'locked',
      stars: i < 3 ? Math.floor(Math.random() * 2) + 2 : 0 // 2 or 3 stars for completed
    })
  );
  return (
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
      className="flex flex-col h-full bg-frigi-bg relative overflow-hidden">
      
      {/* Top Bar */}
      <div className="flex justify-between items-center p-6 pt-8 z-10">
        <CoinDisplay amount={1240} />
        <button
          onClick={() => onNavigate('settings')}
          className="p-3 bg-white rounded-full shadow-sm text-gray-500 hover:text-frigi-text transition-colors">
          
          <Settings size={24} />
        </button>
      </div>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 z-10 mt-[-20px]">
        {/* CSS Art Fridge Icon */}
        <motion.div
          initial={{
            y: -10,
            opacity: 0
          }}
          animate={{
            y: 0,
            opacity: 1
          }}
          transition={{
            type: 'spring',
            bounce: 0.5,
            delay: 0.1
          }}
          className="mb-4 relative w-24 h-32 bg-gray-100 rounded-xl border-4 border-gray-300 shadow-lg flex flex-col p-1.5 overflow-hidden">
          
          {/* Top Door (Freezer) */}
          <div className="h-1/3 w-full bg-white rounded-md border border-gray-200 mb-1 relative shadow-inner">
            <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-4 bg-gray-300 rounded-full" />
            <div className="absolute bottom-1 left-2 w-4 h-4 bg-cyan-100 rounded-sm" />
            <div className="absolute bottom-1 left-7 w-3 h-3 bg-blue-100 rounded-sm" />
          </div>
          {/* Bottom Door (Fridge) */}
          <div className="flex-1 w-full bg-white rounded-md border border-gray-200 relative shadow-inner flex flex-col p-1 gap-1">
            <div className="absolute right-1 top-4 w-1 h-8 bg-gray-300 rounded-full" />
            {/* Shelves */}
            <div className="flex-1 border-b border-gray-100 flex items-end gap-1 pb-0.5">
              <div className="w-3 h-4 bg-orange-200 rounded-sm" />
              <div className="w-2 h-5 bg-red-200 rounded-sm" />
            </div>
            <div className="flex-1 border-b border-gray-100 flex items-end gap-1 pb-0.5">
              <div className="w-4 h-3 bg-yellow-200 rounded-sm" />
            </div>
            {/* Crisper */}
            <div className="h-4 w-full bg-green-50 rounded-sm border border-green-100 mt-auto flex items-center justify-center">
              <div className="w-2 h-2 bg-green-400 rounded-full opacity-50" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{
            scale: 0.8,
            y: 20
          }}
          animate={{
            scale: 1,
            y: 0
          }}
          transition={{
            type: 'spring',
            bounce: 0.5
          }}
          className="relative mb-8">
          
          <h1 className="text-6xl font-black text-frigi-text tracking-tight drop-shadow-sm">
            Frigi
          </h1>
          <div className="absolute -bottom-2 left-0 right-0 h-3 bg-frigi-mint/30 -z-10 rounded-full transform -rotate-2" />
        </motion.div>

        <Button
          size="lg"
          fullWidth
          icon={<Play fill="currentColor" size={24} />}
          onClick={() => onNavigate('gameplay')}
          className="mb-10 max-w-[280px] text-xl py-5">
          
          Play Level 4
        </Button>

        {/* Level Map (Horizontal Scroll) */}
        <div className="w-full mb-8">
          <div className="flex justify-between items-end mb-4 px-2">
            <h2 className="text-lg font-bold text-frigi-text">Levels</h2>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-sm font-medium text-frigi-red">
              
              Inventory
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-2 snap-x hide-scrollbar">
            {levels.map((level) =>
            <motion.div
              key={level.id}
              whileHover={
              level.status !== 'locked' ?
              {
                y: -5
              } :
              {}
              }
              whileTap={
              level.status !== 'locked' ?
              {
                scale: 0.95
              } :
              {}
              }
              onClick={() =>
              level.status !== 'locked' && onNavigate('gameplay')
              }
              className={`
                  snap-center shrink-0 w-20 h-20 rounded-game-lg flex flex-col items-center justify-center relative shadow-sm cursor-pointer
                  ${level.status === 'completed' ? 'bg-frigi-red text-white' : ''}
                  ${level.status === 'current' ? 'bg-white border-4 border-frigi-red text-frigi-red shadow-game-floating animate-pulse-soft' : ''}
                  ${level.status === 'locked' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : ''}
                `}>
              
                {level.status === 'completed' &&
              <Check size={24} strokeWidth={3} />
              }
                {level.status === 'current' &&
              <span className="text-2xl font-black">{level.id}</span>
              }
                {level.status === 'locked' && <Lock size={20} />}

                {/* Mini stars for completed levels */}
                {level.status === 'completed' &&
              <div className="absolute -bottom-3 flex gap-0.5 bg-white px-2 py-1 rounded-full shadow-sm">
                    {[1, 2, 3].map((star) =>
                <div
                  key={star}
                  className={`w-2 h-2 rounded-full ${star <= level.stars ? 'bg-frigi-orange' : 'bg-gray-200'}`} />

                )}
                  </div>
              }
              </motion.div>
            )}
          </div>
        </div>

        {/* Daily Challenge */}
        <Card
          className="w-full border-t-4 border-t-frigi-orange relative overflow-hidden"
          padding="md">
          
          <div className="absolute top-0 right-0 w-32 h-32 bg-frigi-orange/10 rounded-full -mr-16 -mt-16 pointer-events-none" />
          <div className="flex items-center justify-between relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Target size={18} className="text-frigi-orange" />
                <h3 className="font-bold text-frigi-text">Daily Challenge</h3>
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                Pack the holiday fridge! 🧊
              </p>
            </div>
            <Button
              variant="accent"
              size="sm"
              onClick={() => onNavigate('gameplay')}>
              
              Play
            </Button>
          </div>
        </Card>
      </div>

      <div className="text-center pb-6 text-xs text-gray-400 font-medium z-10">
        Frigi v1.0.0
      </div>
    </motion.div>);

}