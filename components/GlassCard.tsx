import React, { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = "", 
  hoverEffect = false 
}) => {
  return (
    <div 
      className={`
        relative overflow-hidden
        bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl
        transition-all duration-300
        ${hoverEffect ? 'hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] hover:shadow-cyan-500/10' : ''}
        ${className}
      `}
    >
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};
