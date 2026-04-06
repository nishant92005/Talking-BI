import React, { useState, useCallback } from 'react';
import { Upload, File, CheckCircle, AlertCircle, Loader2, ArrowUpRight, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { DynamicChart } from './Charts';

const FileUpload = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, uploading, analyzing, success, error
  const [insight, setInsight] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (selectedFile) => {
    if (!selectedFile || !selectedFile.name.endsWith('.csv')) {
      alert("Please upload a CSV file.");
      return;
    }

    setFile(selectedFile);
    setStatus('uploading');

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      // 1. Upload CSV
      const uploadRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/upload-csv`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const parsedData = uploadRes.data.data;

      // 2. Analyze
      setStatus('analyzing');
      const analyzeRes = await axios.post(`${import.meta.env.VITE_API_URL}/api/analyze`, {
        dataset: parsedData,
        type: 'csv'
      });

      try {
        // The backend already parses the LLM output securely using parse_json_safely
        const parsedInsights = analyzeRes.data.insights;

        if (parsedInsights && parsedInsights.charts) {
          parsedInsights.charts = parsedInsights.charts.map(chart => {
            let processedData = parsedData;
            const agg = chart.aggregation || 'none';
            const xKey = chart.dataKeyX;
            const yKey = chart.dataKeyY || 'value';
            const typeStr = (chart.type || 'line').toLowerCase();

            if (agg !== 'none' && xKey) {
              const grouped = {};
              parsedData.forEach(row => {
                const xVal = row[xKey];
                if (xVal === undefined || xVal === null) return;
                if (!grouped[xVal]) grouped[xVal] = { count: 0, sum: 0 };
                grouped[xVal].count += 1;
                const yVal = parseFloat(row[yKey]);
                if (!isNaN(yVal)) grouped[xVal].sum += yVal;
              });

              processedData = Object.keys(grouped).map(key => {
                let finalY = 0;
                if (agg === 'count') finalY = grouped[key].count;
                else if (agg === 'sum') finalY = grouped[key].sum;
                else if (agg === 'average') finalY = grouped[key].sum / grouped[key].count;

                return {
                  [xKey]: key,
                  [yKey]: finalY
                };
              });

              if (typeStr === 'pie' || typeStr === 'bar') {
                processedData.sort((a, b) => b[yKey] - a[yKey]);
                processedData = processedData.slice(0, 15);
              }
            } else if (typeStr === 'pie' || typeStr === 'bar') {
              processedData = processedData.slice(0, 15);
            }

            return {
              ...chart,
              type: typeStr,
              dataKeyY: yKey,
              data: processedData
            };
          });
        }

        setInsight(parsedInsights);
      } catch (parseError) {
        console.error("Failed to parse insights JSON:", parseError);
        setInsight({
          insights_summary: "Analysis complete, but failed to format properly.",
          bullet_insights: [],
          charts: []
        });
      }
      setStatus('success');

    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="p-8 space-y-8 h-[calc(100vh-4rem)] overflow-y-auto">
      <div>
        <h2 className="text-2xl font-bold text-glow">Data Upload</h2>
        <p className="text-slate-400">Upload your CSV datasets for instant AI analysis.</p>
      </div>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`glass-panel border-2 border-dashed p-16 flex flex-col items-center justify-center transition-all ${dragActive ? 'border-neonBlue bg-neonBlue/5' : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'
          }`}
      >
        <Upload size={48} className={dragActive ? 'text-neonBlue' : 'text-slate-500'} />
        <h3 className="text-xl font-medium mt-6 mb-2 text-slate-200">Drag & Drop your CSV file here</h3>
        <p className="text-slate-400 mb-8">or click to browse from your computer</p>

        <input
          id="file-upload"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
        />
        <label
          htmlFor="file-upload"
          className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl cursor-pointer font-medium transition-colors border border-slate-600 hover:border-neonBlue/50"
        >
          Select File
        </label>
      </div>

      {status !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel p-8"
        >
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
              <File size={24} className="text-neonPurple" />
            </div>
            <div>
              <h4 className="font-medium text-slate-200">{file?.name}</h4>
              <p className="text-sm text-slate-400">{(file?.size / 1024).toFixed(2)} KB</p>
            </div>
          </div>

          <div className="relative pt-1 mb-8">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-neonBlue bg-neonBlue/10 border border-neonBlue/20">
                  {status === 'uploading' && 'Uploading Data...'}
                  {status === 'analyzing' && 'AI Generating Insights...'}
                  {status === 'success' && 'Analysis Complete'}
                  {status === 'error' && 'Error Processing File'}
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-slate-800 border border-slate-700">
              <div
                style={{ width: status === 'uploading' ? '30%' : status === 'analyzing' ? '70%' : status === 'error' ? '0%' : '100%' }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${status === 'error' ? 'bg-rose-500' : 'bg-gradient-to-r from-neonBlue to-neonPurple'
                  }`}
              ></div>
            </div>
          </div>

          {status === 'success' && insight && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {insight.kpis && insight.kpis.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {insight.kpis.map((kpi, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ y: -5 }}
                      className="glass-panel p-6 border border-slate-700/50"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-slate-400 font-medium">{kpi.label}</p>
                          <h3 className="text-2xl font-bold mt-2 text-slate-100">{kpi.value}</h3>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-800/50 text-neonBlue">
                          <Activity size={24} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {insight.charts && insight.charts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {insight.charts.map((chart, idx) => (
                    <div key={idx} className={`glass-panel p-6 ${insight.charts.length === 1 ? 'lg:col-span-2' : ''}`}>
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-slate-200">{chart.title}</h3>
                      </div>
                      <DynamicChart type={chart.type} data={chart.data} dataKeyX={chart.dataKeyX} dataKeyY={chart.dataKeyY} />
                    </div>
                  ))}
                </div>
              )}

              <div className="glass-panel p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-neonPurple/10 blur-[80px] rounded-full pointer-events-none" />
                <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
                  <span className="w-2 h-2 rounded-full bg-neonPurple mr-2 animate-pulse" />
                  AI Generated Insights
                </h3>
                <p className="text-slate-300 font-medium mb-4 leading-relaxed bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                  {insight.insights_summary}
                </p>
                {insight.bullet_insights && insight.bullet_insights.length > 0 && (
                  <ul className="space-y-4 text-slate-300 pl-2">
                    {insight.bullet_insights.map((item, idx) => (
                      <li key={idx} className="flex items-start">
                        <div className="min-w-6 mt-1 text-neonBlue"><ArrowUpRight size={18} /></div>
                        <p>{item}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.div>
          )}

          {status === 'error' && (
            <div className="bg-rose-500/10 rounded-xl border border-rose-500/30 p-6 flex items-start text-rose-400">
              <AlertCircle size={24} className="mr-3 flex-shrink-0" />
              <p>Failed to process the dataset. Ensure your FastAPI server is running and the CSV is structurally sound.</p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;
