import React from 'react';
import { LayoutDashboard, BarChart3, MessageSquare, Settings, UploadCloud } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'chat', icon: MessageSquare, label: 'AI Assistant' },
    { id: 'upload', icon: UploadCloud, label: 'Data Upload' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <motion.aside 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 glass-panel h-[calc(100vh-2rem)] m-4 flex flex-col fixed left-0 top-0 bottom-0 z-40"
    >
      <div className="p-6 flex items-center space-x-3 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-neonBlue to-neonPurple flex items-center justify-center">
          <BarChart3 size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neonBlue to-neonPurple">
          Talking BI
        </h1>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02, x: 5 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                isActive 
                  ? 'bg-gradient-to-r from-neonBlue/20 to-neonPurple/20 text-neonBlue border border-neonBlue/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-neonBlue' : ''} />
              <span className="font-medium">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-700/50">
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 text-sm">
          <p className="text-slate-300 font-medium mb-1">AI Status</p>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-pulse" />
            <span className="text-slate-400 text-xs text-glow">Online & Ready</span>
          </div>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
