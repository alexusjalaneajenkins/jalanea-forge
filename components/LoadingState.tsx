import React from 'react';
import { Sparkles, Brain, Code2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  subMessage?: string;
  type?: 'brain' | 'code' | 'sparkle';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  message = "Thinking...", 
  subMessage = "AI is synthesizing your vision",
  type = 'sparkle'
}) => {
  
  const Icon = type === 'brain' ? Brain : type === 'code' ? Code2 : Sparkles;
  const colorClass = type === 'brain' ? 'text-purple-400' : type === 'code' ? 'text-cyan-400' : 'text-orange-400';

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative mb-8">
        {/* Pulsing rings */}
        <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${colorClass} bg-current blur-md scale-150 duration-[2s]`}></div>
        <div className={`absolute inset-0 rounded-full animate-ping opacity-10 ${colorClass} bg-current delay-75 blur-lg scale-150 duration-[3s]`}></div>
        
        {/* Center icon container */}
        <div className="relative w-24 h-24 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl">
           <Icon className={`w-10 h-10 ${colorClass} animate-pulse`} />
        </div>
        
        {/* Orbiting particles */}
        <div className="absolute inset-0 animate-spin-slow">
           <div className={`absolute -top-2 left-1/2 w-4 h-4 rounded-full ${colorClass} bg-current blur-sm`}></div>
        </div>
      </div>
      
      <h3 className="text-2xl font-bold font-serif text-white mb-2 tracking-tight">{message}</h3>
      <p className="text-slate-400 text-sm max-w-xs text-center leading-relaxed">{subMessage}</p>
    </div>
  );
};
