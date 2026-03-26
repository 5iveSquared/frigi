import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock } from 'lucide-react';
import { Card } from '../components/ui/Card';
interface InventoryScreenProps {
  onNavigate: (screen: string) => void;
}
const CATEGORIES = ['All', 'Produce', 'Drinks', 'Dairy', 'Frozen'];
const ITEMS = [
{
  id: 1,
  emoji: '🍎',
  name: 'Apple',
  category: 'Produce',
  shape: '1x1',
  unlocked: true,
  color: 'bg-rose-100 text-rose-500'
},
{
  id: 2,
  emoji: '🥦',
  name: 'Broccoli',
  category: 'Produce',
  shape: '2x1',
  unlocked: true,
  color: 'bg-emerald-100 text-emerald-500'
},
{
  id: 3,
  emoji: '🥛',
  name: 'Milk',
  category: 'Drinks',
  shape: '1x2',
  unlocked: true,
  color: 'bg-blue-100 text-blue-500'
},
{
  id: 4,
  emoji: '🧀',
  name: 'Cheese',
  category: 'Dairy',
  shape: '1x1',
  unlocked: true,
  color: 'bg-orange-100 text-orange-500'
},
{
  id: 5,
  emoji: '🧊',
  name: 'Ice Cubes',
  category: 'Frozen',
  shape: '2x2',
  unlocked: true,
  color: 'bg-cyan-100 text-cyan-500'
},
{
  id: 6,
  emoji: '🥩',
  name: 'Steak',
  category: 'Produce',
  shape: '2x2',
  unlocked: false,
  color: 'bg-gray-100 text-gray-400'
},
{
  id: 7,
  emoji: '🧃',
  name: 'Juice Box',
  category: 'Drinks',
  shape: '1x2',
  unlocked: false,
  color: 'bg-gray-100 text-gray-400'
},
{
  id: 8,
  emoji: '🍕',
  name: 'Frozen Pizza',
  category: 'Frozen',
  shape: '3x1',
  unlocked: false,
  color: 'bg-gray-100 text-gray-400'
}];

export function InventoryScreen({ onNavigate }: InventoryScreenProps) {
  const [activeTab, setActiveTab] = useState('All');
  const filteredItems =
  activeTab === 'All' ?
  ITEMS :
  ITEMS.filter((item) => item.category === activeTab);
  return (
    <div className="flex flex-col h-full bg-frigi-bg">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 text-gray-500 hover:text-frigi-text transition-colors rounded-full hover:bg-gray-100">
            
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-frigi-text">Groceries</h1>
        </div>

        {/* Categories Scroll */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
          {CATEGORIES.map((cat) =>
          <button
            key={cat}
            onClick={() => setActiveTab(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === cat ? 'bg-frigi-text text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            
              {cat}
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-2 gap-4">
          {filteredItems.map((item, index) =>
          <motion.div
            key={item.id}
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              delay: index * 0.05
            }}>
            
              <Card
              padding="sm"
              className={`h-full flex flex-col ${!item.unlocked ? 'opacity-70' : ''}`}>
              
                <div
                className={`flex-1 rounded-xl flex items-center justify-center py-6 mb-3 relative ${item.color}`}>
                
                  <span className="text-4xl drop-shadow-sm">{item.emoji}</span>
                  {!item.unlocked &&
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-xl flex items-center justify-center">
                      <div className="bg-gray-800/60 p-2 rounded-full text-white">
                        <Lock size={16} />
                      </div>
                    </div>
                }
                </div>
                <div className="px-1">
                  <h3 className="font-bold text-frigi-text text-sm">
                    {item.name}
                  </h3>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-400 font-medium">
                      {item.category}
                    </span>
                    <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold">
                      {item.shape}
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>);

}