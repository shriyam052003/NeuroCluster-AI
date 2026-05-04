import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart2, Users, Zap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl"
      >
        <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-semibold mb-6">
          Unsupervised Behavioral Analytics
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          Discover Hidden <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Personality Patterns
          </span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
          Upload social media posts or raw text data to automatically cluster users into dynamic personality archetypes using advanced NLP embeddings and unsupervised learning.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link to="/analyze" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
            Try Live Demo <ArrowRight size={20} />
          </Link>
          <a href="#features" className="glass-panel flex items-center gap-2 text-lg px-8 py-4 hover:bg-white/10 transition">
            Learn More
          </a>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full"
        id="features"
      >
        <FeatureCard 
          icon={<Zap className="text-yellow-400" size={32} />}
          title="BERT Embeddings"
          desc="Transform raw text into dense semantic vectors using state-of-the-art transformer models."
        />
        <FeatureCard 
          icon={<Users className="text-indigo-400" size={32} />}
          title="Unsupervised Clustering"
          desc="Discover emergent groupings using K-Means and DBSCAN without relying on biased labels."
        />
        <FeatureCard 
          icon={<BarChart2 className="text-purple-400" size={32} />}
          title="Interactive Insights"
          desc="Visualize high-dimensional data in 3D and uncover the core keywords driving each cluster."
        />
      </motion.div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }) {
  return (
    <div className="glass-panel p-8 text-left hover:-translate-y-2 transition-transform duration-300">
      <div className="mb-4 bg-white/5 inline-block p-3 rounded-xl border border-white/10">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </div>
  );
}
