import React, { useState } from 'react';
import { Search, Bell, Mic } from 'lucide-react';
import { motion } from 'framer-motion';

const Topbar = ({ onVoiceClick, onSearch }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim());
    }
  };

  return (
    <header className="glass-header h-16 flex items-center justify-between px-8">
      <div className="flex items-center w-full max-w-xl">
        <form onSubmit={handleSubmit} className="relative w-full flex items-center">
          <Search className="absolute left-3 text-slate-400" size={18} />
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Agent Search (e.g., 'Show Tesla stock trends and latest news')"
            className="w-full bg-slate-900/50 border border-slate-700/50 rounded-full pl-10 pr-24 py-2 text-sm text-slate-200 focus:outline-none focus:border-neonBlue/50 transition-colors placeholder:text-slate-500"
          />
          <button type="submit" className="hidden" />
          <motion.button 
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onVoiceClick}
            className="absolute right-2 p-1.5 rounded-full bg-gradient-to-r from-neonBlue/20 to-neonPurple/20 text-neonBlue hover:from-neonBlue/40 hover:to-neonPurple/40 transition-all border border-neonBlue/30"
          >
            <Mic size={14} />
          </motion.button>
        </form>
      </div>

      <div className="flex items-center space-x-6">
        <button className="text-slate-400 hover:text-white transition-colors relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-neonPink border border-darkerBg shadow-[0_0_10px_rgba(236,72,153,0.8)]" />
        </button>
        
        <div className="flex items-center space-x-3 cursor-pointer">
          <div className="text-right hidden md:block">
            <p className="text-sm font-semibold text-slate-200">Alex Data</p>
            <p className="text-xs text-slate-400">Analyst</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-700 border-2 border-slate-600 overflow-hidden flex items-center justify-center">
             <span className="text-sm font-bold text-slate-300">AD</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
