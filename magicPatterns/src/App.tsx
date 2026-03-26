import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HomeScreen } from './screens/HomeScreen';
import { GameplayScreen } from './screens/GameplayScreen';
import { InventoryScreen } from './screens/InventoryScreen';
import { LevelCompleteScreen } from './screens/LevelCompleteScreen';
import { SettingsScreen } from './screens/SettingsScreen';
type Screen = 'home' | 'gameplay' | 'inventory' | 'levelComplete' | 'settings';
export function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  // Map screens to components
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={setCurrentScreen} />;
      case 'gameplay':
        return <GameplayScreen onNavigate={setCurrentScreen} />;
      case 'inventory':
        return <InventoryScreen onNavigate={setCurrentScreen} />;
      case 'levelComplete':
        return <LevelCompleteScreen onNavigate={setCurrentScreen} />;
      case 'settings':
        return <SettingsScreen onNavigate={setCurrentScreen} />;
      default:
        return <HomeScreen onNavigate={setCurrentScreen} />;
    }
  };
  return (
    <div className="min-h-screen w-full flex justify-center bg-slate-200">
      {/* Mobile Device Container */}
      <div className="w-full max-w-[390px] h-[100dvh] bg-frigi-bg relative overflow-hidden shadow-2xl sm:rounded-[40px] sm:h-[844px] sm:my-auto sm:border-[8px] sm:border-slate-800">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{
              opacity: 0,
              scale: 0.98
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            exit={{
              opacity: 0,
              scale: 1.02
            }}
            transition={{
              duration: 0.2
            }}
            className="w-full h-full">
            
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>);

}