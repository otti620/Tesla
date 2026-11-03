import React from 'react';
import { Home, Package, Flame, Users, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'product' as TabType, label: 'Fleet', icon: Package },
    { id: 'promoters' as TabType, label: 'Bounty', icon: Flame },
    { id: 'team' as TabType, label: 'Team', icon: Users },
    { id: 'mine' as TabType, label: 'Mine', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-neutral-950/95 border-t border-[#a3e635]/25 z-40 px-3 py-2 shadow-2xl backdrop-blur-lg">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition-butter cursor-pointer relative spring-press ${
                isActive 
                  ? 'bg-[#a3e635] text-neutral-950 font-black shadow-md shadow-[#a3e635]/20 -translate-y-0.5' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 transition-butter ${isActive ? 'scale-110 stroke-[2.5] text-neutral-950' : 'stroke-[2] text-neutral-400'}`} />
              <span className={`text-[11px] leading-none font-bold tracking-tight whitespace-nowrap ${isActive ? 'text-neutral-950 font-black' : 'text-neutral-400'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

