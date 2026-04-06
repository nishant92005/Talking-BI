import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Activity, DollarSign, Users, Rss, ServerCrash, Loader2, Sparkles, Upload, Send, Bot, User } from 'lucide-react';
import { DynamicChart } from './Charts';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const KPICard = ({ title, value, change, trend, icon: Icon, colorClass }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="glass-panel p-6"
  >
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-1 text-slate-100">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-slate-800/50 ${colorClass}`}>
        <Icon size={24} />
      </div>
    </div>
    <div className="flex items-center space-x-2">
      <span className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-400' : 'text-rose-400'}`}>
        {trend === 'up' ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
        {change}
      </span>
      <span className="text-sm text-slate-500">vs last month</span>
    </div>
  </motion.div>
);

const Dashboard = ({ globalQuery }) => {
  const [dashboardConfig, setDashboardConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [promptInput, setPromptInput] = useState('');
  const [currentQuery, setCurrentQuery] = useState(globalQuery || "Provide a general executive overview of market performance");
  const [datasetCache, setDatasetCache] = useState(null);
  const [driveLinkInput, setDriveLinkInput] = useState('');

  // Chat state
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Data Assistant. Ask me anything about this dashboard or dataset.', id: 1 }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Sync if Topbar search is used
  useEffect(() => {
    if (globalQuery && globalQuery !== currentQuery) {
      setCurrentQuery(globalQuery);
      setPromptInput(globalQuery);
      setDatasetCache(null); // Clear dataset caching on new query
    }
  }, [globalQuery]);

  useEffect(() => {
    const fetchDashboard = async () => {
      // Don't fetch via orchestrator if we just uploaded a CSV manually
      if (datasetCache) return;

      setLoading(true);
      setError(null);
      try {
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/query`, { query: currentQuery });
        setDashboardConfig(res.data.dashboard);
      } catch (err) {
        console.error(err);
        setError("AI Agent failed to orchestrate query. Check backend configurations or try again.");
      } finally {
        setLoading(false);
      }
    };

    if (currentQuery && !datasetCache) {
      fetchDashboard();
    }
  }, [currentQuery, datasetCache]);

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (promptInput.trim()) {
      setDatasetCache(null);
      setCurrentQuery(promptInput.trim());
    }
  };

  const processCsvData = async (parsedData) => {
    const analyzeRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/analyze`, {
      dataset: parsedData,
      type: 'csv'
    });

    const parsedInsights = analyzeRes.data.insights;
    if (parsedInsights && parsedInsights.charts) {
      parsedInsights.charts = parsedInsights.charts.map(chart => {
        let processedData = [...parsedData];
        const agg = chart.aggregation || 'none';

        const keys = Object.keys(parsedData[0] || {});
        let xKey = chart.dataKeyX;
        let yKey = chart.dataKeyY || 'value';

        const actualX = keys.find(k => k.toLowerCase() === (xKey || '').toLowerCase());
        const actualY = keys.find(k => k.toLowerCase() === (yKey || '').toLowerCase());

        xKey = actualX || keys[0];
        yKey = actualY || keys.find(k => typeof parsedData[0][k] === 'number') || keys[1] || keys[0];

        const typeStr = (chart.type || 'line').toLowerCase();

        if (agg !== 'none' && xKey) {
          const grouped = {};
          parsedData.forEach(row => {
            const xVal = row[xKey];
            if (xVal === undefined || xVal === null) return;
            const keyStr = String(xVal);
            if (!grouped[keyStr]) grouped[keyStr] = { count: 0, sum: 0 };
            grouped[keyStr].count += 1;
            let rawY = String(row[yKey] || '0').replace(/[^0-9.-]+/g, "");
            const yVal = parseFloat(rawY);
            if (!isNaN(yVal)) grouped[keyStr].sum += yVal;
          });

          const newProcessedData = Object.keys(grouped).map(key => {
            let finalY = 0;
            if (agg === 'count') finalY = grouped[key].count;
            else if (agg === 'sum') finalY = grouped[key].sum;
            else if (agg === 'average') finalY = grouped[key].sum / grouped[key].count;
            return { [xKey]: key, [yKey]: finalY };
          });

          if (newProcessedData.length > 0) {
            processedData = newProcessedData;
          }
        }

        if (typeStr === 'pie' || typeStr === 'bar') {
          processedData.sort((a, b) => {
            let valA = parseFloat(String(a[yKey] || '0').replace(/[^0-9.-]+/g, "")) || 0;
            let valB = parseFloat(String(b[yKey] || '0').replace(/[^0-9.-]+/g, "")) || 0;
            return valB - valA;
          });
          processedData = processedData.slice(0, 15);
        }

        return { ...chart, type: typeStr, dataKeyX: xKey, dataKeyY: yKey, data: processedData };
      });
    }
    setDashboardConfig(parsedInsights);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      alert("Please upload a CSV file.");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentQuery(`Dashboard generated from CSV: ${file.name}`);
    setPromptInput("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const parsedData = uploadRes.data.data;
      setDatasetCache(parsedData);
      await processCsvData(parsedData);
    } catch (err) {
      console.error(err);
      setError("Failed to upload and analyze CSV file.");
    } finally {
      setLoading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDriveUpload = async () => {
    if (!driveLinkInput.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentQuery(`Dashboard from Drive Link`);
    setPromptInput("");

    try {
      const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-drive-link`, { url: driveLinkInput.trim() });
      const parsedData = uploadRes.data.data;
      setDatasetCache(parsedData);
      await processCsvData(parsedData);
      setDriveLinkInput('');
    } catch (err) {
      console.error(err);
      setError("Failed to fetch and analyze Google Drive link. Ensure permissions are set to 'Anyone with link can view'.");
    } finally {
      setLoading(false);
    }
  };
  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg, id: Date.now() }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat`, {
        message: userMsg,
        context: { dataset: datasetCache, dashboardSummary: dashboardConfig?.insights_summary }
      });
      setMessages(prev => [...prev, { role: 'assistant', text: res.data.reply, id: Date.now() }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Error reaching AI backend. Make sure the server is running and Groq API key is valid.", id: Date.now() }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const renderPromptBox = () => (
    <div className="glass-panel p-6 border-neonBlue/30 relative overflow-hidden mb-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-neonBlue/5 blur-[80px] rounded-full pointer-events-none" />
      <h2 className="text-xl font-bold mb-4 text-glow flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center"><Sparkles className="mr-2 text-neonBlue" size={24} /> Generate Custom Dashboard</div>
        <div className="flex items-center space-x-2 relative z-10 w-full sm:w-auto">
          <input
            type="text"
            value={driveLinkInput}
            onChange={(e) => setDriveLinkInput(e.target.value)}
            placeholder="Paste Google Drive Link"
            className="w-48 bg-slate-800/80 border border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-neonBlue/50"
          />
          <button
            type="button"
            onClick={handleDriveUpload}
            disabled={loading || !driveLinkInput.trim()}
            className="text-sm bg-slate-700 hover:bg-slate-600 text-white py-2.5 px-4 rounded-xl border border-slate-500 transition-colors shadow-lg disabled:opacity-50"
          >
            Fetch Link
          </button>

          <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          <label htmlFor="csv-upload" className="w-full sm:w-auto flex justify-center items-center cursor-pointer text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 px-6 rounded-xl border border-slate-600 hover:border-neonBlue/50 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.15)]">
            <Upload size={18} className="mr-2" /> Upload CSV
          </label>
        </div>
      </h2>
      <form onSubmit={handlePromptSubmit} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 relative z-10">
        <input
          type="text"
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          placeholder="E.g., Analyze Apple stock performance compared to Microsoft over the last week"
          className="flex-1 bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-neonBlue/50 transition-colors placeholder:text-slate-500"
        />
        <button
          type="submit"
          disabled={loading || (!promptInput.trim() && !datasetCache)}
          className="px-8 py-3 bg-gradient-to-r from-neonBlue to-neonPurple hover:from-blue-500 hover:to-purple-600 text-white rounded-xl font-medium shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(56,189,248,0.6)] transition-all disabled:opacity-50"
        >
          {loading ? 'Thinking...' : 'Generate Context'}
        </button>
      </form>
    </div>
  );

  const { insights_summary, bullet_insights, charts, news, kpis } = dashboardConfig || {};

  return (
    <div className="p-8 h-full flex flex-col space-y-6 lg:flex-row lg:space-y-0 lg:space-x-6 animate-in fade-in duration-500 overflow-y-hidden">
      {/* Dashboard Main Content */}
      <div className="flex-1 space-y-8 min-w-0 pr-2 overflow-y-auto max-h-full pb-10">
        {renderPromptBox()}

        {error ? (
          <div className="glass-panel p-6 border-rose-500/30 text-rose-400 flex items-center">
            <ServerCrash className="mr-4" size={32} />
            <div>
              <h3 className="text-lg font-bold">Orchestrator Error</h3>
              <p>{error}</p>
            </div>
          </div>
        ) : loading && !dashboardConfig ? (
          <div className="p-8 flex flex-col items-center justify-center space-y-6 text-slate-400">
            <Loader2 size={48} className="animate-spin text-neonBlue" />
            <h2 className="text-xl font-medium text-slate-200 text-glow">Agent is thinking...</h2>
            <p className="animate-pulse">Analyzing query or dataset and fetching insights seamlessly.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center opacity-70 hover:opacity-100 transition-opacity">
              <div>
                <h2 className="text-2xl font-bold text-glow">Analytics View</h2>
                <p className="text-slate-400 italic">Rendered for: "{currentQuery}"</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis && kpis.length > 0 ? kpis.map((kpi, idx) => (
                <KPICard key={idx} title={kpi.label} value={kpi.value} change={"+0.0%"} trend="up" icon={Activity} colorClass="text-neonPurple shadow-[0_0_15px_rgba(168,85,247,0.2)]" />
              )) : (
                <>
                  <KPICard title="Total Analyzed" value={datasetCache ? datasetCache.length : "12.4K"} change="+5.2%" trend="up" icon={Activity} colorClass="text-neonPurple shadow-[0_0_15px_rgba(168,85,247,0.2)]" />
                  <KPICard title="Revenue Proxy" value="$2.4M" change="+14.5%" trend="up" icon={DollarSign} colorClass="text-neonBlue shadow-[0_0_15px_rgba(56,189,248,0.2)]" />
                </>
              )}
            </div>

            {charts && charts.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {charts.map((chart, idx) => (
                  <div key={idx} className={`glass-panel p-6 ${charts.length === 1 ? 'lg:col-span-2' : ''}`}>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold text-slate-200">{chart.title}</h3>
                    </div>
                    <DynamicChart type={chart.type} data={chart.data} dataKeyX={chart.dataKeyX} dataKeyY={chart.dataKeyY} />
                  </div>
                ))}
              </div>
            )}

            {loading && dashboardConfig && (
              <div className="flex justify-center p-4"><Loader2 size={24} className="animate-spin text-neonBlue" /></div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-panel p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neonPurple/10 blur-[80px] rounded-full pointer-events-none" />
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-neonPurple mr-2 animate-pulse" />
                  AI Generated Insights
                </h3>
                <p className="text-slate-300 font-medium mb-4 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  {insights_summary || "No specific AI summary provided for this query."}
                </p>
                <ul className="space-y-4 text-slate-300 pl-2">
                  {bullet_insights && bullet_insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start">
                      <div className="min-w-6 mt-1 text-neonBlue"><ArrowUpRight size={18} /></div>
                      <p>{insight}</p>
                    </li>
                  ))}
                </ul>
              </div>

              {news && news.length > 0 && (
                <div className="glass-panel p-6 flex flex-col">
                  <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                    <Rss size={18} className="mr-2 text-amber-500" /> Web & News Context
                  </h3>
                  <div className="flex-1 overflow-y-auto space-y-4 pr-2 max-h-80">
                    {news.map((item, idx) => (
                      <a key={idx} href={item.link || "#"} target="_blank" rel="noopener noreferrer" className="block bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors group">
                        <h4 className="font-medium text-sm text-slate-200 group-hover:text-neonBlue transition-colors line-clamp-2">{item.title}</h4>
                        <div className="flex justify-between text-xs text-slate-500 mt-2">
                          <span>{item.source}</span>
                          <span>{item.date}</span>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Sidebar: Chat Panel */}
      <div className="w-full lg:w-96 flex-shrink-0 flex flex-col glass-panel overflow-hidden border border-neonPurple/20 h-[500px] lg:h-[calc(100vh-10rem)] sticky top-8">
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/50 flex items-center justify-between">
          <h3 className="font-semibold text-glow flex items-center"><Bot size={18} className="mr-2" /> Data Chat</h3>
        </div>
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-900/20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 max-w-[85%] rounded-xl text-sm ${msg.role === 'user' ? 'bg-gradient-to-br from-neonBlue/20 to-blue-600/20 border border-neonBlue/30 text-blue-50 rounded-tr-none' : 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-none'}`}>
                <ReactMarkdown
                  components={{
                    strong: ({ node, ...props }) => <strong className="font-bold text-neonBlue" {...props} />,
                    p: ({ node, ...props }) => <p className="whitespace-pre-wrap mb-2 last:mb-0" {...props} />,
                    ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                    li: ({ node, ...props }) => <li className="mb-1" {...props} />
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
            </div>
          ))}
          {isChatLoading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/50 rounded-tl-none flex space-x-2 shadow-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-neonPurple animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-neonBlue animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-neonPink animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50">
          <form onSubmit={handleChatSend} className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about your data..."
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-neonBlue/50"
            />
            <button disabled={!chatInput.trim() || isChatLoading} type="submit" className="p-2 bg-gradient-to-r from-neonBlue to-neonPurple rounded-lg text-white disabled:opacity-50 hover:shadow-[0_0_10px_rgba(56,189,248,0.5)]">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
