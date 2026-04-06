import React from 'react';
import { Palette, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = ({ currentTheme, onThemeChange }) => {
  const themes = [
    {
      id: 'cyberpunk',
      name: 'Cyberpunk (Default)',
      description: 'Dark, edgy slate with vibrant neon blue, purple, and pink accents natively designed for the deepest web.',
      bgClass: 'bg-[#0f172a]', 
      accent1: '#38bdf8',
      accent2: '#a855f7'
    },
    {
      id: 'white',
      name: 'Clean White',
      description: 'Bright, minimalist layout focusing entirely on clarity and sharp readability natively designed for executives.',
      bgClass: 'bg-[#f1f5f9]',
      accent1: '#0284c7',
      accent2: '#7e22ce'
    },
    {
      id: 'green',
      name: 'Emerald Matrix',
      description: 'Deep forest greens mixed with sharp, high-tempo lime neons for financial and stock monitoring.',
      bgClass: 'bg-[#064e3b]',
      accent1: '#34d399',
      accent2: '#a3e635'
    },
    {
      id: 'hot-pink',
      name: 'Hot Pink',
      description: 'Extravagant, stylish magenta undertones infused with pure vibrant pink highlights.',
      bgClass: 'bg-[#4c1d95]',
      accent1: '#f472b6',
      accent2: '#d946ef'
    },
    {
      id: 'stylish',
      name: 'Stylish Zinc',
      description: 'Luxury grayscale backdrop intertwined with refined golden yellow accents.',
      bgClass: 'bg-[#18181b]',
      accent1: '#fbbf24',
      accent2: '#eab308'
    }
  ];

  return (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-500 overflow-y-auto">
      <div className="flex items-center mb-8 pb-4 border-b border-slate-700/50">
        <div className="p-3 bg-neonBlue/10 rounded-xl mr-4 border border-neonBlue/20">
            <Palette className="text-neonBlue" size={28} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-glow">Appearance Settings</h2>
          <p className="text-slate-400 mt-1">Customize the interface theme across your dashboard engine.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {themes.map((theme) => {
          const isActive = currentTheme === theme.id;
          return (
            <motion.div
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`relative cursor-pointer rounded-2xl overflow-hidden transition-all duration-300 border-2 ${
                isActive ? 'border-neonBlue shadow-[0_0_20px_rgba(56,189,248,0.25)]' : 'border-slate-700/50 hover:border-slate-500'
              }`}
            >
              <div className={`h-24 w-full ${theme.bgClass} relative flex items-center justify-center`}>
                 <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(145deg, rgba(255,255,255,0.2) 0%, transparent 100%)' }} />
                 <div className="flex space-x-3 z-10 p-4 w-full justify-center">
                    <div className="w-16 h-8 rounded-lg shadow-lg relative overflow-hidden" style={{ backgroundColor: theme.accent1 }}>
                       <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/20" />
                    </div>
                    <div className="w-16 h-8 rounded-lg shadow-lg relative overflow-hidden" style={{ backgroundColor: theme.accent2 }}>
                       <div className="absolute inset-x-0 bottom-0 h-1/2 bg-white/20" />
                    </div>
                 </div>
              </div>
              <div className="p-6 bg-cardBg backdrop-blur-xl">
                <div className="flex justify-between items-start mb-2">
                    <h3 className={`text-lg font-bold ${isActive ? 'text-neonBlue' : 'text-slate-200'}`}>
                    {theme.name}
                    </h3>
                    {isActive && <CheckCircle2 className="text-neonBlue" size={20} />}
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{theme.description}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Settings;
