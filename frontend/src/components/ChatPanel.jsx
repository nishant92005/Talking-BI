import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Volume2, Bot, User } from 'lucide-react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';

const ChatPanel = () => {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Data Assistant. Ask me anything about your datasets or general financial trends.', id: 1 }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsRecording(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        // We could auto-send here, but let's let the user review it
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
      };

      recognition.onend = () => setIsRecording(false);

      recognition.start();
    } else {
      alert("Speech recognition is not supported in this browser.");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg, id: Date.now() }]);
    setInput('');
    setIsLoading(true);

    try {
      // Assuming FastAPI is running on localhost:8000
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/chat`, {
        message: userMsg,
        context: { view: 'dashboard' }
      });
      const reply = res.data.reply;
      setMessages(prev => [...prev, { role: 'assistant', text: reply, id: Date.now() }]);
      speakText(reply);
    } catch (error) {
      console.error(error);
      const errorMsg = "Sorry, I couldn't reach the backend. Is FastAPI running?";
      setMessages(prev => [...prev, { role: 'assistant', text: errorMsg, id: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-glow">Data Assistant</h2>
        <p className="text-slate-400">Ask questions about your data or market trends.</p>
      </div>

      <div className="flex-1 glass-panel flex flex-col overflow-hidden relative">
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {messages.map((msg) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full ${msg.role === 'user' ? 'bg-neonBlue/20 text-neonBlue ml-4' : 'bg-neonPurple/20 text-neonPurple mr-4'
                  }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`p-4 rounded-2xl ${msg.role === 'user'
                    ? 'bg-gradient-to-br from-neonBlue/20 to-blue-600/20 text-blue-50 border border-neonBlue/30 rounded-tr-none'
                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tl-none leading-relaxed'
                  }`}>
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
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex flex-row items-center max-w-[80%]">
                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-neonPurple/20 text-neonPurple mr-4">
                  <Bot size={20} />
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/50 rounded-tl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-neonPurple animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-neonBlue animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 rounded-full bg-neonPink animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 backdrop-blur-md">
          <form onSubmit={handleSend} className="flex space-x-4 items-center relative">
            <button
              type="button"
              onClick={startVoiceRecognition}
              className={`p-3 rounded-full transition-colors border ${isRecording
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/50 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-neonBlue hover:border-neonBlue/50'
                }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isRecording ? "Listening..." : "Ask something like 'Analyze the latest data upload'..."}
              className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-neonBlue/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-neonBlue to-neonPurple text-white rounded-xl font-medium shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(56,189,248,0.6)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={20} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
