import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Settings, Upload, FileText, Loader2, Zap } from 'lucide-react';

export default function AnalysisPage() {
  const [textInput, setTextInput] = useState('');
  const [algorithm, setAlgorithm] = useState('kmeans');
  const [numClusters, setNumClusters] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    // Basic splitting by newline
    const texts = textInput.split('\n').map(t => t.trim()).filter(t => t.length > 5);
    
    if (texts.length < 5) {
      setError("Please provide at least 5 distinct text entries (separated by newlines).");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${API_URL}/api/v1/cluster`, {
        texts,
        algorithm,
        num_clusters: Number(numClusters),
        n_components: 3
      });
      
      // Store result in local storage or state to pass to Dashboard
      localStorage.setItem('clusterResults', JSON.stringify(response.data));
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTextInput(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-2 glass-panel p-8">
        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <FileText className="text-indigo-400" /> Input Data
        </h2>
        
        <p className="text-gray-400 mb-4">
          Paste your social media posts (one per line) or upload a raw text file to begin analysis.
        </p>
        
        <textarea
          className="w-full h-64 bg-black/40 border border-white/10 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-indigo-500 transition resize-none mb-4"
          placeholder="I love the new design update!&#10;This bug is really annoying, please fix it immediately.&#10;Who wants to join my team for the upcoming hackathon?&#10;Thinking about the architectural implications of this new framework.&#10;..."
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
        
        <div className="flex items-center justify-between">
          <label className="cursor-pointer flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg transition">
            <Upload size={18} />
            <span>Upload .txt</span>
            <input type="file" accept=".txt,.csv" className="hidden" onChange={handleFileUpload} />
          </label>
          
          <div className="text-sm text-gray-500">
            {textInput.split('\n').filter(t => t.trim().length > 5).length} valid entries detected
          </div>
        </div>
      </div>
      
      <div className="glass-panel p-8 h-fit">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Settings className="text-indigo-400" /> Configuration
        </h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Algorithm</label>
            <select 
              className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-gray-200 focus:outline-none focus:border-indigo-500"
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value)}
            >
              <option value="kmeans">K-Means</option>
              <option value="dbscan">DBSCAN</option>
            </select>
          </div>
          
          {algorithm === 'kmeans' && (
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Number of Clusters ({numClusters})
              </label>
              <input 
                type="range" 
                min="2" max="10" 
                value={numClusters} 
                onChange={(e) => setNumClusters(e.target.value)}
                className="w-full accent-indigo-500"
              />
            </div>
          )}
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <button 
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full btn-primary flex justify-center items-center gap-2 mt-4 py-3"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Zap />}
            {loading ? 'Analyzing...' : 'Generate Clusters'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
