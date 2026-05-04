import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Plotly from 'plotly.js-basic-dist';
import createPlotlyComponentModule from 'react-plotly.js/factory';
const createPlotlyComponent = createPlotlyComponentModule.default || createPlotlyComponentModule;
const Plot = createPlotlyComponent(Plotly);
import { PieChart, List, Tag, User, Download, AlertTriangle, Zap, Search } from 'lucide-react';
import axios from 'axios';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [sandboxText, setSandboxText] = useState('');
  const [sandboxResult, setSandboxResult] = useState(null);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem('clusterResults');
    if (stored) {
      setData(JSON.parse(stored));
    } else {
      navigate('/analyze');
    }
  }, [navigate]);

  if (!data) return null;

  const exportToCSV = () => {
    const headers = ['ID', 'Text', 'Cluster', 'Emotion', 'Sentiment', 'Is_Maverick'];
    const rows = data.points.map(p => [
      p.id, 
      `"${p.full_text.replace(/"/g, '""')}"`, 
      p.cluster, 
      p.emotion, 
      p.sentiment, 
      p.is_maverick
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "neurocluster_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePredict = async () => {
    if (!sandboxText) return;
    setLoadingPredict(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const res = await axios.post(`${API_URL}/api/v1/predict`, { text: sandboxText });
      setSandboxResult(res.data);
    } catch (e) {
      console.error(e);
      alert("Error predicting: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoadingPredict(false);
    }
  };

  const plotData = data.clusters.map(cluster => {
    const clusterPoints = data.points.filter(p => p.cluster === cluster.id);
    return {
      x: clusterPoints.map(p => p.coords[0]),
      y: clusterPoints.map(p => p.coords[1]),
      z: clusterPoints.map(p => p.coords[2]),
      text: clusterPoints.map(p => p.text),
      mode: 'markers',
      type: 'scatter3d',
      name: cluster.name,
      marker: { 
        size: clusterPoints.map(p => p.is_maverick ? 10 : 6), 
        symbol: clusterPoints.map(p => p.is_maverick ? 'diamond' : 'circle'),
        opacity: 0.8 
      }
    };
  });

  // Add sandbox prediction to plot if exists
  if (sandboxResult) {
    plotData.push({
      x: [sandboxResult.coords[0]],
      y: [sandboxResult.coords[1]],
      z: [sandboxResult.coords[2]],
      text: ["NEW: " + sandboxResult.text],
      mode: 'markers',
      type: 'scatter3d',
      name: "Sandbox Point",
      marker: { size: 12, color: '#facc15', symbol: 'cross' }
    });
  }

  const emotionLabels = Object.keys(data.emotion_distribution);
  const emotionValues = Object.values(data.emotion_distribution);
  const mavericks = data.points.filter(p => p.is_maverick);
  const filteredTable = data.points.filter(p => p.full_text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mt-8 space-y-8"
    >
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Users" value={data.points.length} />
        <MetricCard title="Algorithm" value={data.algorithm.toUpperCase()} />
        <MetricCard title="Silhouette Score" value={data.silhouette_score ? data.silhouette_score.toFixed(3) : "N/A"} desc="Cluster cohesion" />
        <MetricCard title="Mavericks" value={mavericks.length} desc="Unique outliers" />
      </div>

      {/* 3D Plot & Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-6 relative">
          <button onClick={exportToCSV} className="absolute top-4 right-4 flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md text-sm transition z-10">
            <Download size={14}/> Export CSV
          </button>
          <h2 className="text-2xl font-bold mb-4">Semantic Space Visualization</h2>
          <div className="h-[500px] w-full rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
             <Plot
              data={plotData}
              layout={{
                autosize: true, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent',
                scene: { xaxis: { title: 'PCA 1', color: '#fff' }, yaxis: { title: 'PCA 2', color: '#fff' }, zaxis: { title: 'PCA 3', color: '#fff' }, bgcolor: 'transparent' },
                margin: { l: 0, r: 0, b: 0, t: 0 }, font: { color: '#fff' }, legend: { font: { color: '#fff' } }
              }}
              style={{ width: '100%', height: '100%' }} useResizeHandler={true}
            />
          </div>
        </div>

        <div className="glass-panel p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-yellow-400">
              <Zap size={20} /> Real-Time Sandbox
            </h3>
            <p className="text-sm text-gray-400 mb-4">Type a new message to instantly classify and place it in the 3D space.</p>
            <textarea
              className="w-full h-24 bg-black/40 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-yellow-500 transition resize-none mb-3"
              placeholder="E.g., I'm really frustrated with the current state of..."
              value={sandboxText} onChange={e => setSandboxText(e.target.value)}
            />
            <button onClick={handlePredict} disabled={loadingPredict} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-2 rounded-lg transition">
              {loadingPredict ? "Predicting..." : "Classify Post"}
            </button>
            {sandboxResult && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-sm">Assigned to: <strong className="text-yellow-400">Cluster {sandboxResult.cluster}</strong></p>
                <p className="text-xs text-gray-400 mt-1">Sentiment Score: {sandboxResult.sentiment.toFixed(2)}</p>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-4">
             <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-red-400">
               <AlertTriangle size={18} /> Maverick Spotlight
             </h3>
             <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
               {mavericks.length === 0 ? <p className="text-sm text-gray-500">No outliers detected.</p> : mavericks.map(m => (
                 <div key={m.id} className="bg-red-500/10 p-2 rounded text-xs border border-red-500/20">
                   {m.text}
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>

      {/* Profiles & Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass-panel p-6 lg:col-span-1">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><PieChart className="text-indigo-400" /> Overall Mood</h3>
          <div className="h-[250px]">
             <Plot
              data={[{ values: emotionValues, labels: emotionLabels, type: 'pie', hole: 0.5, textinfo: 'percent', textposition: 'inside', marker: { colors: ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#10b981', '#f59e0b'] } }]}
              layout={{ autosize: true, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', margin: { l: 20, r: 20, b: 40, t: 20 }, showlegend: true, legend: { orientation: 'h', y: -0.1, x: 0.5, xanchor: 'center', font: { color: '#fff', size: 11 } }, font: { color: '#fff' } }}
              style={{ width: '100%', height: '100%' }} useResizeHandler={true}
            />
          </div>
        </div>

        <div className="glass-panel p-6 lg:col-span-2">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><List className="text-indigo-400" /> Cluster Personas (Big Five)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto pr-2">
            {data.clusters.map(cluster => (
              <div key={cluster.id} className="bg-white/5 border border-white/10 p-4 rounded-xl flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-lg">{cluster.name}</h4>
                  <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded-full border border-indigo-500/30">{cluster.size} users</span>
                </div>
                
                <div className="flex gap-4 text-xs">
                  <div className="flex-1">
                    <p className="text-gray-400 mb-1">Dominant Trait</p>
                    <p className="font-semibold text-indigo-300">{cluster.personality_profile}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 mb-1">Avg Sentiment</p>
                    <div className="w-full bg-gray-700 h-1.5 rounded-full mt-2">
                      <div className={`h-1.5 rounded-full ${cluster.sentiment_scores.compound > 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.abs(cluster.sentiment_scores.compound) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-black/30 p-2 rounded text-[10px] text-gray-400 grid grid-cols-5 gap-1 text-center">
                   <div>O: {cluster.big_five.O}</div>
                   <div>C: {cluster.big_five.C}</div>
                   <div>E: {cluster.big_five.E}</div>
                   <div>A: {cluster.big_five.A}</div>
                   <div>N: {cluster.big_five.N}</div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {cluster.keywords.map(kw => (
                    <span key={kw} className="text-[10px] bg-white/10 px-2 py-1 rounded text-gray-300"><Tag size={8} className="inline mr-1"/>{kw}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Data Table */}
      <div className="glass-panel p-6">
         <div className="flex justify-between items-center mb-6">
           <h3 className="text-xl font-bold flex items-center gap-2"><Search className="text-indigo-400" /> User Data Explorer</h3>
           <input 
             type="text" placeholder="Search entries..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
             className="bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:border-indigo-500 outline-none w-64"
           />
         </div>
         <div className="overflow-x-auto">
           <table className="w-full text-left text-sm text-gray-400">
             <thead className="text-xs uppercase bg-white/5 text-gray-300">
               <tr>
                 <th className="px-4 py-3 rounded-tl-lg">ID</th>
                 <th className="px-4 py-3">Text Entry</th>
                 <th className="px-4 py-3">Cluster</th>
                 <th className="px-4 py-3">Emotion</th>
                 <th className="px-4 py-3">Sentiment</th>
                 <th className="px-4 py-3 rounded-tr-lg">Type</th>
               </tr>
             </thead>
             <tbody>
               {filteredTable.slice(0, 50).map(p => (
                 <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition">
                   <td className="px-4 py-3">{p.id}</td>
                   <td className="px-4 py-3 max-w-xs truncate" title={p.full_text}>{p.text}</td>
                   <td className="px-4 py-3">
                     <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded text-xs">{p.cluster}</span>
                   </td>
                   <td className="px-4 py-3">{p.emotion}</td>
                   <td className="px-4 py-3">
                     <span className={p.sentiment > 0 ? "text-green-400" : (p.sentiment < 0 ? "text-red-400" : "")}>{p.sentiment.toFixed(2)}</span>
                   </td>
                   <td className="px-4 py-3">
                     {p.is_maverick ? <span className="text-red-400 text-xs border border-red-400/30 bg-red-400/10 px-1.5 py-0.5 rounded">Maverick</span> : <span className="text-gray-500 text-xs">Standard</span>}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
           {filteredTable.length > 50 && <p className="text-center text-xs text-gray-500 mt-4">Showing first 50 results...</p>}
         </div>
      </div>

    </motion.div>
  );
}

function MetricCard({ title, value, desc }) {
  return (
    <div className="glass-panel p-4 flex flex-col justify-center">
      <h4 className="text-gray-400 text-sm mb-1">{title}</h4>
      <p className="text-2xl font-bold text-white">{value}</p>
      {desc && <p className="text-xs text-gray-500 mt-1">{desc}</p>}
    </div>
  );
}
