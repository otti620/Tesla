import React from 'react';
import { Home, Car, Users, User, Flame } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'product' as TabType, label: 'Product', icon: Car },
    { id: 'promoters' as TabType, label: 'Promoters', icon: Flame, isHot: true },
    { id: 'team' as TabType, label: 'Team', icon: Users },
    { id: 'mine' as TabType, label: 'Mine', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-neutral-200 z-40 px-2 py-1.5 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-5 gap-0.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 rounded-lg transition-colors relative ${
                isActive ? 'text-[#ff5252]' : 'text-neutral-400 hover:text-neutral-600'
              }`}
            >
              {tab.isHot && (
                <span className="absolute -top-1 right-2 px-1 py-0.2 bg-gradient-to-r from-amber-500 to-rose-600 text-[8px] font-black text-white rounded-full leading-none shadow-sm animate-pulse">
                  HOT
                </span>
              )}
              <Icon className={`w-5 h-5 mb-0.5 transition-transform ${isActive ? 'scale-110 stroke-[2.2]' : 'stroke-[1.7]'}`} />
              <span className={`text-[10px] leading-tight font-medium ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

