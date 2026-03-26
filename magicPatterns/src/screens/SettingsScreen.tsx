import React, { useState } from 'react';
import {
  ArrowLeft,
  Volume2,
  Vibrate,
  Moon,
  Trash2,
  HelpCircle,
  Mail } from
'lucide-react';
import { Card } from '../components/ui/Card';
import { Toggle } from '../components/ui/Toggle';
import { Button } from '../components/ui/Button';
interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}
export function SettingsScreen({ onNavigate }: SettingsScreenProps) {
  const [sound, setSound] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  return (
    <div className="flex flex-col h-full bg-frigi-bg">
      {/* Header */}
      <div className="bg-white px-6 py-4 shadow-sm z-10 sticky top-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onNavigate('home')}
            className="p-2 -ml-2 text-gray-500 hover:text-frigi-text transition-colors rounded-full hover:bg-gray-100">
            
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-frigi-text">Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Preferences */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Preferences
          </h2>
          <Card padding="none" className="divide-y divide-gray-100">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 text-frigi-text">
                <div className="p-2 bg-red-50 text-frigi-red rounded-lg">
                  <Volume2 size={20} />
                </div>
                <span className="font-medium">Sound Effects</span>
              </div>
              <Toggle checked={sound} onChange={setSound} />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 text-frigi-text">
                <div className="p-2 bg-mint-50 text-frigi-mint rounded-lg">
                  <Vibrate size={20} />
                </div>
                <span className="font-medium">Haptics</span>
              </div>
              <Toggle checked={haptics} onChange={setHaptics} />
            </div>

            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 text-frigi-text">
                <div className="p-2 bg-gray-100 text-gray-600 rounded-lg">
                  <Moon size={20} />
                </div>
                <div>
                  <span className="font-medium block">Dark Mode</span>
                  <span className="text-xs text-gray-400">Coming soon</span>
                </div>
              </div>
              <Toggle checked={darkMode} onChange={() => {}} />
            </div>
          </Card>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Support
          </h2>
          <Card padding="none" className="divide-y divide-gray-100">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center gap-3 text-frigi-text">
                <div className="p-2 bg-orange-50 text-frigi-orange rounded-lg">
                  <HelpCircle size={20} />
                </div>
                <span className="font-medium">How to Play</span>
              </div>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left">
              <div className="flex items-center gap-3 text-frigi-text">
                <div className="p-2 bg-red-50 text-frigi-red rounded-lg">
                  <Mail size={20} />
                </div>
                <span className="font-medium">Contact Support</span>
              </div>
            </button>
          </Card>
        </section>

        {/* Danger Zone */}
        <section className="pt-4">
          <Button
            variant="ghost"
            fullWidth
            className="text-red-500 hover:bg-red-50 hover:text-red-600"
            icon={<Trash2 size={18} />}>
            
            Reset Progress
          </Button>
        </section>
      </div>
    </div>);

}