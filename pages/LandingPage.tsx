import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();

  const handleTryNow = () => {
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-forge-950 flex flex-col items-center justify-center relative overflow-hidden px-4">
      {/* Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-500/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto animate-fade-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-forge-accent flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-forge-text">
            JALANEA FORGE
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-forge-text mb-6 leading-tight">
          Turn Ideas into{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
            Products
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-forge-muted mb-10 max-w-lg mx-auto">
          AI-powered product design. Go from idea to PRD to roadmap in minutes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleTryNow}
            className="group flex items-center gap-2 bg-forge-accent hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105"
          >
            Try it now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={signInWithGoogle}
            className="flex items-center gap-2 bg-forge-800 hover:bg-forge-700 text-forge-text font-medium px-8 py-4 rounded-xl border border-forge-700 hover:border-forge-600 transition-all"
          >
            Sign in with Google
          </button>
        </div>

        {/* Subtle tagline */}
        <p className="text-sm text-forge-500 mt-8">
          No credit card required. 25 free AI generations.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
