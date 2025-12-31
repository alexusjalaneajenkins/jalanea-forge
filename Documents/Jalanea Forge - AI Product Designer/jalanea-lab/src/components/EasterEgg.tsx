'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Sparkle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

export function EasterEgg() {
  const router = useRouter();
  const [phase, setPhase] = useState<'door' | 'message' | 'redirect'>('door');
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);

  // Generate sparkles
  useEffect(() => {
    const newSparkles: Sparkle[] = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4,
      delay: Math.random() * 2,
    }));
    setSparkles(newSparkles);
  }, []);

  // Animation sequence
  useEffect(() => {
    const timer1 = setTimeout(() => setPhase('message'), 1500);
    const timer2 = setTimeout(() => setPhase('redirect'), 3000);
    const timer3 = setTimeout(() => {
      window.location.href = 'https://jalnaea.dev';
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 bg-lab-bg flex items-center justify-center overflow-hidden">
      {/* Sparkles */}
      {sparkles.map((sparkle) => (
        <div
          key={sparkle.id}
          className="absolute rounded-full bg-lab-accent animate-sparkle"
          style={{
            left: `${sparkle.x}%`,
            top: `${sparkle.y}%`,
            width: sparkle.size,
            height: sparkle.size,
            animationDelay: `${sparkle.delay}s`,
            boxShadow: '0 0 10px #f59e0b, 0 0 20px #f59e0b, 0 0 30px #f59e0b',
          }}
        />
      ))}

      {/* Content */}
      <div className="relative z-10 text-center px-4">
        {/* Door animation */}
        <div className={`transition-all duration-1000 ${phase === 'door' ? 'scale-100 opacity-100' : 'scale-150 opacity-0'}`}>
          <div className="text-8xl mb-4 animate-pulse">🚪</div>
        </div>

        {/* Message */}
        <div className={`transition-all duration-500 ${phase === 'message' || phase === 'redirect' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-2xl md:text-4xl font-bold text-lab-text mb-4">
            <span className="inline-block">You found the secret door!</span>
            <span className="inline-block ml-2">✨</span>
          </h1>

          {phase === 'redirect' && (
            <p className="text-lab-muted animate-pulse">
              Redirecting you somewhere magical...
            </p>
          )}
        </div>

        {/* Glowing orb */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full animate-pulse-glow pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-lab-accent/50 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
}
