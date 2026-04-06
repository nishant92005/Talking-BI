import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import ChatPanel from './components/ChatPanel';
import FileUpload from './components/FileUpload';
import Settings from './components/Settings';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [globalQuery, setGlobalQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('talking_bi_theme') || 'cyberpunk');

  useEffect(() => {
    localStorage.setItem('talking_bi_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleVoiceClick = () => {
    setIsVoiceActive(!isVoiceActive);
    if (activeTab !== 'chat') setActiveTab('chat');
  };

  const handleSearch = (query) => {
    setGlobalQuery(query);
    setActiveTab('dashboard'); // Force switch back to dashboard to see results
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard globalQuery={globalQuery} />;
      case 'analytics':
        return <div className="p-8"><h2 className="text-2xl font-bold mb-6 text-glow">Deep Analytics</h2><div className="glass-panel p-6 text-slate-400">Detailed analytics filters and pivot tables go here.</div></div>;
      case 'chat':
        return <ChatPanel />;
      case 'upload':
        return <FileUpload />;
      case 'settings':
        return <Settings currentTheme={theme} onThemeChange={setTheme} />;
      default:
        return <div className="p-8">Select a view</div>;
    }
  };

  return (
    <div data-theme={theme} className="flex bg-darkerBg min-h-screen relative overflow-hidden text-slate-200 transition-colors duration-500">
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-[100%] bg-neonPurple/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-[100%] bg-neonBlue/10 blur-[120px] pointer-events-none" />

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="flex-1 ml-[calc(16rem+2rem)] flex flex-col min-h-screen">
        <Topbar onVoiceClick={handleVoiceClick} onSearch={handleSearch} />
        <main className="flex-1 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;
