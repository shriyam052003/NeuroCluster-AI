import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AnalysisPage from './pages/AnalysisPage';
import DashboardPage from './pages/DashboardPage';
import { BrainCircuit, Home, Activity } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col relative">
        {/* Background effects */}
        <div className="absolute inset-0 bg-primary z-[-1] overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent opacity-20 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600 opacity-20 blur-[100px]"></div>
        </div>

        <nav className="glass-panel mx-4 mt-4 mb-8 px-6 py-4 flex justify-between items-center sticky top-4 z-50">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-white tracking-tight">
            <BrainCircuit className="text-accent" size={28} />
            NeuroCluster <span className="text-gray-400 font-light">AI</span>
          </Link>
          <div className="flex gap-6">
            <Link to="/" className="text-gray-300 hover:text-white transition flex items-center gap-2">
              <Home size={18} /> Home
            </Link>
            <Link to="/analyze" className="text-gray-300 hover:text-white transition flex items-center gap-2">
              <Activity size={18} /> Analyze
            </Link>
          </div>
        </nav>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-12">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analyze" element={<AnalysisPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
