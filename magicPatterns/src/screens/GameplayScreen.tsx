import React, { useEffect, useState, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, Lightbulb, RotateCcw, RefreshCw } from 'lucide-react';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
interface GameplayScreenProps {
  onNavigate: (screen: string) => void;
}
// --- Types & Data ---
type Zone = 'Shelf' | 'Door' | 'Drawer';
interface FridgeItemData {
  id: string;
  name: string;
  emoji: string;
  color: string;
  zone: Zone;
  shapeClass: string; // Tailwind classes for width/height
  isInvalid?: boolean;
}
const PRE_PLACED_ITEMS = {
  topShelf: [
  {
    id: 'p1',
    name: 'Milk',
    emoji: '🥛',
    color: 'bg-blue-100 text-blue-600',
    zone: 'Shelf' as Zone,
    shapeClass: 'w-12 h-20'
  },
  {
    id: 'p2',
    name: 'Yogurt',
    emoji: '🫙',
    color: 'bg-pink-100 text-pink-600',
    zone: 'Shelf' as Zone,
    shapeClass: 'w-10 h-10'
  }],

  middleShelf: [
  {
    id: 'p3',
    name: 'Leftovers',
    emoji: '🍱',
    color: 'bg-teal-100 text-teal-600',
    zone: 'Shelf' as Zone,
    shapeClass: 'w-20 h-12'
  },
  {
    id: 'p4',
    name: 'Cheese',
    emoji: '🧀',
    color: 'bg-yellow-100 text-yellow-600',
    zone: 'Shelf' as Zone,
    shapeClass: 'w-12 h-10'
  }],

  leftCrisper: [
  {
    id: 'p5',
    name: 'Lettuce',
    emoji: '🥬',
    color: 'bg-green-100 text-green-600',
    zone: 'Drawer' as Zone,
    shapeClass: 'w-12 h-12'
  },
  {
    id: 'p6',
    name: 'Carrots',
    emoji: '🥕',
    color: 'bg-orange-100 text-orange-600',
    zone: 'Drawer' as Zone,
    shapeClass: 'w-10 h-10'
  }],

  rightCrisper: [
  {
    id: 'p7',
    name: 'Tomato',
    emoji: '🍅',
    color: 'bg-red-100 text-red-600',
    zone: 'Drawer' as Zone,
    shapeClass: 'w-10 h-10'
  }],

  doorTop: [
  {
    id: 'p8',
    name: 'Ketchup',
    emoji: '🍅',
    color: 'bg-red-100 text-red-600',
    zone: 'Door' as Zone,
    shapeClass: 'w-8 h-16'
  }],

  doorMiddle: [
  {
    id: 'p9',
    name: 'Water',
    emoji: '💧',
    color: 'bg-blue-100 text-blue-600',
    zone: 'Door' as Zone,
    shapeClass: 'w-8 h-16'
  }],

  doorBottom: [
  {
    id: 'p10',
    name: 'Soda',
    emoji: '🥤',
    color: 'bg-red-100 text-red-600',
    zone: 'Door' as Zone,
    shapeClass: 'w-8 h-10'
  },
  {
    id: 'p11',
    name: 'Juice',
    emoji: '🧃',
    color: 'bg-orange-100 text-orange-600',
    zone: 'Door' as Zone,
    shapeClass: 'w-8 h-10'
  }]

};
const TRAY_ITEMS: FridgeItemData[] = [
{
  id: 't1',
  name: 'Butter',
  emoji: '🧈',
  color: 'bg-yellow-100 text-yellow-600',
  zone: 'Door',
  shapeClass: 'w-10 h-8'
},
{
  id: 't2',
  name: 'Eggs',
  emoji: '🥚',
  color: 'bg-orange-50 text-orange-600',
  zone: 'Shelf',
  shapeClass: 'w-20 h-10'
},
{
  id: 't3',
  name: 'Ice Cream',
  emoji: '🍦',
  color: 'bg-purple-100 text-purple-600',
  zone: 'Shelf',
  shapeClass: 'w-12 h-16',
  isInvalid: true
},
{
  id: 't4',
  name: 'Pepper',
  emoji: '🫑',
  color: 'bg-green-100 text-green-600',
  zone: 'Drawer',
  shapeClass: 'w-12 h-12'
},
{
  id: 't5',
  name: 'Soda',
  emoji: '🥤',
  color: 'bg-blue-100 text-blue-600',
  zone: 'Door',
  shapeClass: 'w-8 h-10'
}];

// --- Components ---
const FridgeItem = ({
  item,
  isSelected = false



}: {item: FridgeItemData;isSelected?: boolean;}) =>
<div
  className={`
    ${item.shapeClass} ${item.color} 
    rounded-lg shadow-sm flex flex-col items-center justify-center 
    border border-white/40 relative overflow-hidden
    ${isSelected ? 'ring-4 ring-frigi-red ring-offset-2 shadow-lg scale-105 z-10' : ''}
    ${item.isInvalid ? 'ring-2 ring-red-400 bg-red-50' : ''}
    transition-all duration-200
  `}>
  
    <span className="text-2xl drop-shadow-sm leading-none">{item.emoji}</span>
    <span className="text-[8px] font-bold opacity-70 mt-0.5 truncate w-full text-center px-1 leading-none">
      {item.name}
    </span>
    {item.isInvalid &&
  <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold shadow-sm">
        ×
      </div>
  }
  </div>;

export function GameplayScreen({ onNavigate }: GameplayScreenProps) {
  const [timeLeft, setTimeLeft] = useState(60);
  const [isPaused, setIsPaused] = useState(false);
  const [items, setItems] = useState(TRAY_ITEMS);
  const [score, setScore] = useState(1250);
  const [selectedItemId, setSelectedItemId] = useState<string>(TRAY_ITEMS[1].id); // Default select Eggs
  // Timer logic
  useEffect(() => {
    if (isPaused || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [isPaused, timeLeft]);
  // Handle item drop (mocking the interaction)
  const handleDragEnd = (event: any, info: any, id: string) => {
    // If dragged up significantly, assume it was placed in the fridge
    if (info.offset.y < -100) {
      const newItems = items.filter((item) => item.id !== id);
      setItems(newItems);
      setScore((prev) => prev + 150);
      if (newItems.length > 0) {
        setSelectedItemId(newItems[0].id);
      }
      // If all items placed, go to level complete
      if (newItems.length === 0) {
        setTimeout(() => onNavigate('levelComplete'), 500);
      }
    }
  };
  const selectedItem = items.find((i) => i.id === selectedItemId);
  const isShelfTarget = selectedItem?.zone === 'Shelf';
  return (
    <div className="flex flex-col h-full bg-frigi-bg relative">
      {/* Top Bar */}
      <div className="bg-white px-6 py-4 shadow-sm z-10 rounded-b-3xl">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setIsPaused(true)}
            className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 transition-colors">
            
            <Pause size={20} />
          </button>

          <div className="text-center">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
              Level 4
            </h2>
            <div className="text-xl font-black text-frigi-text">{score}</div>
          </div>

          <button
            onClick={() => {}}
            className="p-2 bg-frigi-orange/10 text-frigi-orange rounded-full hover:bg-frigi-orange/20 transition-colors">
            
            <Lightbulb size={20} />
          </button>
        </div>

        {/* Timer Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-gray-500 w-8">
            {timeLeft}s
          </span>
          <ProgressBar
            progress={timeLeft / 60 * 100}
            color={timeLeft < 15 ? 'orange' : 'blue'}
            size="sm" />
          
        </div>
      </div>

      {/* Main Game Area - REALISTIC FRIDGE */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Fridge Shell */}
        <div className="w-full max-w-[340px] h-[420px] bg-gradient-to-br from-gray-100 to-gray-200 rounded-[32px] border-[6px] border-gray-300 shadow-2xl flex p-2 relative">
          {/* Fridge Handle (Decorative) */}
          <div className="absolute top-1/2 -right-1.5 w-3 h-32 bg-gradient-to-r from-gray-300 to-gray-400 rounded-l-full transform -translate-y-1/2 shadow-sm border border-gray-400/50" />

          {/* Main Cavity (Shelves & Crispers) */}
          <div className="flex-1 bg-gradient-to-b from-blue-50 to-white rounded-l-2xl flex flex-col relative overflow-hidden shadow-[inset_0_4px_20px_rgba(0,0,0,0.08)] border border-gray-200">
            {/* Interior Lighting Glow */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0)_70%)] pointer-events-none z-0" />

            {/* Top Shelf */}
            <div className="h-[28%] border-b-[3px] border-white/80 shadow-[0_2px_5px_rgba(0,0,0,0.05)] flex items-end p-2 gap-3 relative z-10 bg-gradient-to-b from-transparent to-blue-50/30">
              {PRE_PLACED_ITEMS.topShelf.map((item) =>
              <FridgeItem key={item.id} item={item} />
              )}
            </div>

            {/* Middle Shelf */}
            <div className="h-[28%] border-b-[3px] border-white/80 shadow-[0_2px_5px_rgba(0,0,0,0.05)] flex items-end p-2 gap-3 relative z-10 bg-gradient-to-b from-transparent to-blue-50/30">
              {PRE_PLACED_ITEMS.middleShelf.map((item) =>
              <FridgeItem key={item.id} item={item} />
              )}
            </div>

            {/* Bottom Shelf (Target Zone) */}
            <div
              className={`h-[28%] border-b-[3px] border-white/80 shadow-[0_2px_5px_rgba(0,0,0,0.05)] flex items-end p-2 gap-3 relative z-10 bg-gradient-to-b from-transparent to-blue-50/30 transition-colors duration-300 ${isShelfTarget ? 'bg-red-100/40 ring-inset ring-2 ring-frigi-red/50 animate-pulse-soft' : ''}`}>
              
              {/* Ghost Preview */}
              {isShelfTarget && selectedItem &&
              <div
                className={`${selectedItem.shapeClass} border-2 border-dashed border-frigi-red/60 bg-frigi-red/10 rounded-lg flex items-center justify-center`}>
                
                  <span className="text-[10px] font-bold text-frigi-red/80">
                    Place here
                  </span>
                </div>
              }
            </div>

            {/* Crisper Drawers */}
            <div className="flex-1 flex gap-2 p-2 relative z-10">
              {/* Left Crisper */}
              <div className="flex-1 bg-green-50/60 border border-green-100/80 rounded-xl shadow-inner flex items-end justify-center p-1.5 gap-1 relative overflow-hidden">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white/50 rounded-full" />
                <span className="absolute top-1 left-2 text-[8px] font-bold text-green-700/40 uppercase">
                  Produce
                </span>
                {PRE_PLACED_ITEMS.leftCrisper.map((item) =>
                <FridgeItem key={item.id} item={item} />
                )}
              </div>
              {/* Right Crisper */}
              <div className="flex-1 bg-green-50/60 border border-green-100/80 rounded-xl shadow-inner flex items-end justify-center p-1.5 gap-1 relative overflow-hidden">
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white/50 rounded-full" />
                {PRE_PLACED_ITEMS.rightCrisper.map((item) =>
                <FridgeItem key={item.id} item={item} />
                )}
              </div>
            </div>
          </div>

          {/* Door Compartments */}
          <div className="w-[85px] bg-gray-50 border-l border-gray-300 rounded-r-2xl flex flex-col shadow-[inset_4px_0_10px_rgba(0,0,0,0.02)] relative z-20">
            <div className="text-center pt-2 pb-1">
              <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                Drinks
              </span>
            </div>

            {/* Door Slot 1 */}
            <div className="flex-1 border-b-2 border-gray-200/80 flex items-end justify-center pb-1 shadow-[0_2px_3px_rgba(0,0,0,0.02)] bg-gradient-to-b from-transparent to-gray-100/50">
              {PRE_PLACED_ITEMS.doorTop.map((item) =>
              <FridgeItem key={item.id} item={item} />
              )}
            </div>

            {/* Door Slot 2 */}
            <div className="flex-1 border-b-2 border-gray-200/80 flex items-end justify-center pb-1 shadow-[0_2px_3px_rgba(0,0,0,0.02)] bg-gradient-to-b from-transparent to-gray-100/50">
              {PRE_PLACED_ITEMS.doorMiddle.map((item) =>
              <FridgeItem key={item.id} item={item} />
              )}
            </div>

            {/* Door Slot 3 */}
            <div className="h-[35%] flex items-end justify-center pb-2 gap-1 bg-gradient-to-b from-transparent to-gray-100/50">
              {PRE_PLACED_ITEMS.doorBottom.map((item) =>
              <FridgeItem key={item.id} item={item} />
              )}
            </div>
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex gap-4 mt-4">
          <button className="w-10 h-10 bg-white rounded-full shadow-sm text-gray-500 hover:text-frigi-red hover:bg-red-50 flex items-center justify-center transition-colors">
            <RotateCcw size={18} />
          </button>
          <button className="w-10 h-10 bg-white rounded-full shadow-sm text-gray-500 hover:text-frigi-orange hover:bg-orange-50 flex items-center justify-center transition-colors">
            <Lightbulb size={18} />
          </button>
          <button className="w-10 h-10 bg-white rounded-full shadow-sm text-gray-500 hover:text-frigi-mint hover:bg-mint-50 flex items-center justify-center transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Bottom Tray */}
      <div className="bg-white rounded-t-[32px] shadow-[0_-8px_30px_rgba(0,0,0,0.05)] pt-5 pb-8 z-10">
        <div className="px-6 mb-3 flex justify-between items-center">
          <h3 className="font-bold text-gray-500 text-sm">Groceries to Pack</h3>
          <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
            {items.length} left
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto px-6 pb-4 pt-2 hide-scrollbar snap-x">
          <AnimatePresence>
            {items.map((item) => {
              const isSelected = item.id === selectedItemId;
              return (
                <motion.div
                  key={item.id}
                  layout
                  drag
                  dragConstraints={{
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0
                  }}
                  dragElastic={0.5}
                  onDragStart={() => setSelectedItemId(item.id)}
                  onDragEnd={(e, info) => handleDragEnd(e, info, item.id)}
                  whileHover={{
                    scale: 1.05
                  }}
                  whileDrag={{
                    scale: 1.1,
                    zIndex: 50
                  }}
                  initial={{
                    opacity: 0,
                    scale: 0.8
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.5
                  }}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`
                    snap-center shrink-0 w-24 h-28 rounded-2xl flex flex-col items-center justify-center relative cursor-grab active:cursor-grabbing
                    ${isSelected ? 'bg-red-50 border-2 border-frigi-red shadow-md' : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'}
                    transition-colors
                  `}>
                  
                  {/* Zone Badge */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-sm px-2 py-0.5 rounded text-[9px] font-bold text-gray-500 shadow-sm whitespace-nowrap">
                    {item.zone}
                  </div>

                  <div className="mt-4">
                    <FridgeItem item={item} isSelected={isSelected} />
                  </div>
                </motion.div>);

            })}
          </AnimatePresence>

          {items.length === 0 &&
          <div className="w-full text-center py-8 text-gray-400 font-medium">
              Fridge Packed!
            </div>
          }
        </div>
      </div>

      {/* Pause Modal */}
      <Modal
        isOpen={isPaused}
        onClose={() => setIsPaused(false)}
        title="Paused">
        
        <div className="flex flex-col gap-3 mt-4">
          <Button variant="primary" onClick={() => setIsPaused(false)}>
            Resume Game
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setIsPaused(false);
              setTimeLeft(60);
              setItems(TRAY_ITEMS);
              setSelectedItemId(TRAY_ITEMS[1].id);
            }}>
            
            Restart Level
          </Button>
          <Button variant="ghost" onClick={() => onNavigate('home')}>
            Quit to Menu
          </Button>
        </div>
      </Modal>
    </div>);

}