import React from 'react';
import { Home, Package, ClipboardList, Users, User } from 'lucide-react';
import { TabType } from '../types';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab }) => {
  const tabs = [
    { id: 'home' as TabType, label: 'Home', icon: Home },
    { id: 'product' as TabType, label: 'Product', icon: Package },
    { id: 'orders' as TabType, label: 'Orders', icon: ClipboardList },
    { id: 'team' as TabType, label: 'Team', icon: Users },
    { id: 'mine' as TabType, label: 'Mine', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/95 border-t border-slate-200/80 z-40 px-3 py-2 shadow-xl backdrop-blur-lg">
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
                  ? 'bg-gradient-to-b from-blue-600 to-blue-800 text-white border border-blue-900 shadow-md -translate-y-0.5' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 transition-butter ${isActive ? 'scale-110 stroke-[2.5] text-sky-300' : 'stroke-[2] text-slate-500'}`} />
              <span className={`text-[11px] leading-none font-bold tracking-tight ${isActive ? 'text-white font-extrabold' : 'text-slate-700'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -top-1 w-2 h-2 rounded-full bg-sky-400 border border-blue-950 shadow-xs animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
